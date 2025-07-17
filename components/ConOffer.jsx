// components/ProList.jsx
"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import moment from 'moment';
import { Button } from "@/components/ui/button"; // ui/button 사용 여부 확인
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from 'react-redux';
import { GiSpeaker } from "react-icons/gi";
import { BsCardText } from "react-icons/bs";
import { getFirestore, collection, where, orderBy, query, getDocs, limit, startAfter } from "firebase/firestore";
import app from '../firebase'; // <-- firebase import 경로 확인 (components 폴더로 옮겼으므로 경로 변경 필요)
import Image from "next/image";
import Link from 'next/link';
import ConUpload from '@/components/ConUpload'

const ITEMS_PER_PAGE = 12;

// ProList 컴포넌트: 일반 React 컴포넌트처럼 props를 직접 받음
const ConOffer = ({ // <-- 이름 변경 및 searchParams 대신 직접 props 받기
  selectedIndustries,
  selectedRegions, 
  selectedSubRegions
}) => {
  const db2 = getFirestore(app);
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter(); // openCategory 함수에서 사용
  const { currentUser } = useSelector(state => state.user);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const loader = useRef(null);
  const timeFromNow = timestampObject => {
  // timestampObject는 {seconds: ..., nanoseconds: ...} 형태라고 가정합니다.
  if (timestampObject && typeof timestampObject.seconds === 'number') {
    // moment.unix()를 사용하여 초 단위 유닉스 타임스탬프를 파싱합니다.
    return moment.unix(timestampObject.seconds).format('YYYY.MM.DD');
  } else {
    // 올바른 형식의 Timestamp 객체가 아닌 경우 처리
    console.error("Invalid timestamp object provided:", timestampObject);
    return '날짜 정보 없음';
  }
};
  

  // 데이터 로드 함수 (첫 로드 및 추가 로드 모두 사용)
  const fetchMessages = useCallback(async (isInitialLoad) => {
    if (loading || (!isInitialLoad && !hasMore)) {
      console.log("Stopping fetchMessages: loading or no more data.");
      return;
    }

    setLoading(true);

    let baseQueryRef = collection(db2, "conApply");
    let queryConditions = [];
    
    if (selectedIndustries && selectedIndustries !== "전체") {
      queryConditions.push(where("SubCategories", "array-contains", selectedIndustries));
    }
    
    if (selectedRegions && selectedRegions !== "전국") {
      queryConditions.push(where("region", "==", selectedRegions));
    }
    
    if (selectedRegions !== "전국" && selectedSubRegions) {
      queryConditions.push(where("subRegion", "==", selectedSubRegions));
    }

    let currentQuery = query(
      baseQueryRef,
      ...queryConditions,
      orderBy("createdDate", "desc")
    );

    if (!isInitialLoad && lastVisible) {
      currentQuery = query(
        currentQuery,
        startAfter(lastVisible),
        limit(ITEMS_PER_PAGE)
      );
    } else {
      currentQuery = query(
        currentQuery,
        limit(ITEMS_PER_PAGE)
      );
    }

    try {
      const snapshot = await getDocs(currentQuery);

      const newTweetList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          address: data.address,
          imageDownloadUrls: data.imageDownloadUrls || [],
          SubCategories: data.SubCategories,
          favorites: data.favorites || [],
          createdDate: data.createdDate,
          constructionExperience: data.conApply_constructionExperience,
          document: data.conApply_documents,
          companyName: data.conApply_name,
          phoneNumber: data.conApply_phoneNumber,
          description: data.conApply_description
        };
      });

      setMessages(prevMessages => isInitialLoad ? newTweetList : [...prevMessages, ...newTweetList]);

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }

      setHasMore(newTweetList.length === ITEMS_PER_PAGE);

    } catch (error) {
      console.error("Error fetching messages: ", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    db2,
    lastVisible,
    loading,
    hasMore,
    selectedIndustries, 
    selectedRegions,    
    selectedSubRegions  
  ]);

  // 의존성 배열에 fetchMessages 추가 (ESLint 경고 방지 및 최신 함수 참조 보장)
  useEffect(() => {
    setMessages([]);
    setLastVisible(null);
    setHasMore(true);
    setLoading(false);
    fetchMessages(true);
  }, [selectedIndustries, selectedRegions, selectedSubRegions]); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          fetchMessages(false);
        }
      },
      {
        root: null,
        rootMargin: "20px",
        threshold: 1.0
      }
    );

    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [hasMore, loading, fetchMessages]);


  function openCategory () {
    if (currentUser?.uid) {
      setIsUserProfileModalOpen(true)
    } else {
      router.push('/login')
    } 
  }

  const onClickCard = ({ id }) => {
    router.push(`/con/apply/${id}`);
  };

  return (
     <div className='w-full h-full'>
          {messages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {messages.map(({ address, imageDownloadUrls, createdDate, SubCategories, constructionExperience, document, 
              favorites, companyName, phoneNumber, description, id}, idx) => ( // imageDownloadUrls 추가
                <div key={idx}
                     className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
                     onClick={() => onClickCard({ id })}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {companyName}
                    </h3>
                    <span className="text-green-800 text-xs px-2 py-1 rounded-full font-medium">{favorites.length}</span>
                  </div>
                  {/* --- 이미지 표시 로직 시작 --- */}
                  {imageDownloadUrls && imageDownloadUrls.length > 0 && (
                    <div className="mb-4 overflow-hidden rounded-md md:w-[300px] md:h-[100px] h-[100px]">
                    <Image
                      src={imageDownloadUrls[0]} // 첫 번째 이미지만 표시
                      alt={companyName || '업체 이미지'}
                      width={500} // 이미지 너비 고정
                      height={100} // 이미지 높이 고정
                      layout="relative" // 이미지 크기를 width와 height에 고정
                      objectFit="cover" // 이미지가 컨테이너를 채우도록 설정 (넘치는 부분은 잘림)
                      // Image 컴포넌트 자체에는 rounded-md를 제거하고 부모 div에 적용
                    />
                  </div>
                  )}
                  {/* --- 이미지 표시 로직 끝 --- */}
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">경력사항:</span>
                      <span className="font-medium">{constructionExperience || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">필요서류</span>
                      <span className="font-medium">{document || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">전화번호:</span>
                      <span className="font-medium">{phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">주소:</span>
                      <span className="font-medium">
                        {(address || '').split(' ').slice(2).join(' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">등록일:</span>
                      <span className="font-medium">{timeFromNow(createdDate)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-600" style={{ whiteSpace: 'pre-line' }}>
                        {/* 줄바꿈 처리 및 띄어쓰기 문제 해결을 위해 replace 사용 */}
                        {(description || '').replace(/\\n/g, '\n')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">검색 결과가 없습니다.</div>
                <div className="text-gray-500 text-sm">다른 조건으로 검색해보세요.</div>
              </div>
            )
          )}
    
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
    
          {hasMore && !loading && (
            <div ref={loader} className="h-1 bg-transparent"></div>
          )}
    
          {!hasMore && messages.length > 0 && (
            <div className="text-center text-gray-500 py-6">모든 데이터를 불러왔습니다.</div>
          )}
           <Button
                onClick={() => openCategory()} 
                className="fixed bottom-8 right-8 rounded-full w-16 h-16 text-3xl shadow-lg"
              >
                +
              </Button>
       <ConUpload
       isOpen={isUserProfileModalOpen} 
       onClose={() => setIsUserProfileModalOpen(false)} 
      />
    </div>
  );
};

export default ConOffer; // <-- export 이름 ProList로 변경