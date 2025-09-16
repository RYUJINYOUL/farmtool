"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import moment from 'moment';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import { 
  getDoc, 
  collection, 
  where, 
  orderBy, 
  query, 
  getDocs, 
  limit, 
  startAfter,
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { db } from "@/firebase";
import Image from "next/image";
import CategoryUpload from '@/components/middle/construction/categoryUpload'
import { category } from '@/lib/constants';


const ITEMS_PER_PAGE = 12;

// ProList 컴포넌트: 일반 React 컴포넌트처럼 props를 직접 받음
const ProList = ({ // <-- 이름 변경 및 searchParams 대신 직접 props 받기
  selectedIndustries,
  selectedRegions, 
  selectedSubRegions
}) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter(); // openCategory 함수에서 사용
  const { currentUser } = useSelector(state => state.user);
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD');
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const loader = useRef(null);
  const [openDialog, setOpenDialog] = useState("");

  const toggleFavorite = useCallback(async (itemId, currentFavorites) => {
    if (!currentUser?.uid) {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      router.push('/login');
      return;
    }

    const userId = currentUser.uid;
    const isCurrentlyFavorited = currentFavorites.includes(userId);
    const top = 'materials';
    const category = "materials";

    const wishlistItem = { itemId: itemId, category: category, top: top, middle: 'registration' };

    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === itemId 
          ? { 
              ...msg, 
              favorites: isCurrentlyFavorited 
                ? msg.favorites.filter(uid => uid !== userId) 
                : [...msg.favorites, userId] 
            } 
          : msg
      )
    );

    try {
      const constructionDocRef = doc(db, 'materials', itemId);
      
      const userDocRef = doc(db, "users", userId);

      if (isCurrentlyFavorited) {
        await updateDoc(constructionDocRef, {
          favorites: arrayRemove(userId)
        });
        await updateDoc(userDocRef, {
          wishList: arrayRemove(wishlistItem)
        });
        console.log(`찜 해제: Item ${itemId} from user ${userId}`);
      } else {
        await updateDoc(constructionDocRef, {
          favorites: arrayUnion(userId)
        });
        await updateDoc(userDocRef, {
          wishList: arrayUnion(wishlistItem)
        });
        console.log(`찜 설정: Item ${itemId} (Category: ${category}) by user ${userId}`);
      }
    } catch (error) {
      console.error("Error toggling favorite: ", error);
      // 오류 발생 시 UI 롤백 (선택 사항)
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === itemId 
            ? { 
                ...msg, 
                favorites: isCurrentlyFavorited 
                  ? [...msg.favorites, userId] // 롤백: 다시 추가
                  : msg.favorites.filter(uid => uid !== userId) // 롤백: 다시 제거
              } 
            : msg
        )
      );
      alert("찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [db, currentUser, router]);

 

  // 데이터 로드 함수 (첫 로드 및 추가 로드 모두 사용)
  const fetchMessages = useCallback(async (isInitialLoad) => {
    if (loading || (!isInitialLoad && !hasMore)) {
      console.log("Stopping fetchMessages: loading or no more data.");
      return;
    }

    setLoading(true);

    let baseQueryRef = collection(db, "materials");
    let queryConditions = [];
    
    if (selectedIndustries && selectedIndustries !== "전체") {
      queryConditions.push(where("SubCategories", "array-contains", selectedIndustries));
    }
    
    if (selectedRegions && selectedRegions !== "전국") {
        queryConditions.push(where("region", "==", selectedRegions));
    }
    
    if (selectedSubRegions && selectedSubRegions !== "전체") {
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
          address: data.address || data.data_address,

          businessLicense: data.materials_businessLicense,    //사업자등록번호
          constructionExperience: data.materials_materialType,  //주요자재
          companyName: data.materials_name || '',
          phoneNumber: data.materials_companyPhoneNumber,

          imageDownloadUrls: data.imageDownloadUrls || [],
          createdDate: data.createdDate,
          SubCategories: data.SubCategories,
          favorites: data.favorites || [],
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
    db,
    lastVisible,
    loading,
    hasMore,
    selectedIndustries, 
    selectedRegions,    
    selectedSubRegions,
    currentUser, 
    toggleFavorite 
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


 const openCategory = async () => {
      // currentUser가 없으면 로그인 페이지로 이동
      if (!currentUser?.uid) {
          router.push('/login');
          return;
      }
  
      try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
  
          if (userSnap.exists()) {
              const fetchedUserData = userSnap.data();
              const firestoreTimestamp = fetchedUserData.expirationDate;
                let expirationDate = null;
                
                if (firestoreTimestamp && typeof firestoreTimestamp.toDate === 'function') {
                    // .toDate() 메서드가 있을 때만 변환합니다.
                    expirationDate = firestoreTimestamp.toDate();
                }
              const now = new Date();
  
              if (!expirationDate || expirationDate < now) {
                  alert("업체등록은 결제 후에 이용하실 수 있습니다.");
                  router.push('/payments/checkout');
                  return; 
              }
          } 
          setIsUserProfileModalOpen(true);
          setOpenDialog("register");
      } catch (error) {
          console.error("사용자 데이터 로딩 중 에러:", error);
          alert("사용자 정보를 가져오는 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
  }

  const onClickCard = ({ id }) => {
     router.push(`/materials/registration/${id}`);
  };

  return (
    <div className='w-full h-full'>
      {messages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map(({ address, businessLicense, SubCategories, phoneNumber, constructionExperience, rentalRates, createdDate, id, companyName, favorites, imageDownloadUrls}, idx) => {
            // 각 항목별로 현재 사용자가 찜했는지 여부 확인
            const isWishListed = currentUser?.uid && favorites.includes(currentUser.uid);

            return (
              <div key={idx} // key는 id를 사용하는 것이 더 안정적입니다.
                   className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer relative" // relative 추가
                   onClick={() => onClickCard({ id })}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {companyName}
                  </h3>
                  {/* 찜하기 버튼 */}
                  <div className='flex flex-row gap-2'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                      toggleFavorite(id, favorites); // itemId와 현재 favorites 배열 전달
                    }}
                    className='rounded-full' >
                    {isWishListed ? <IoIosHeart color='red' size={20} /> : <IoMdHeartEmpty size={20} />}
                  </button>
                  {/* 좋아요 수 표시 (favorites 배열의 길이) */}
                  {/* <span className="text-red-600 text-[18px] rounded-full font-medium">
                    {favorites.length}
                  </span> */}
                  </div>
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
                  />
                </div>
                )}
                {/* --- 이미지 표시 로직 끝 --- */}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500">사업자등록번호:</span>
                    <span className="font-medium">{businessLicense || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">주요자재:</span>
                    <span className="font-medium">{(SubCategories || []).join(', ') || '-'}</span>
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
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-600 truncate">
                      {/* 줄바꿈 처리 및 띄어쓰기 문제 해결을 위해 replace 사용 */}
                      {(constructionExperience || '').replace(/\\n/g, '\n')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
        onClick={openCategory}
        className="fixed bottom-[calc(8vh+20px)] right-4 rounded-full w-[45px] h-[45px] text-2xl shadow-lg"
      >
        +
      </Button>
        {openDialog === "register" && (
                              <CategoryUpload
                                isOpen={true}
                                onClose={() => setOpenDialog(null)}
                              />
                          )}
    </div>
  );
};

export default ProList; // <-- export 이름 ProList로 변경