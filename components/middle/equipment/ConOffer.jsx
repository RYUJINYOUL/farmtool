// components/ProList.jsx
"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import moment from 'moment';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import { 
  getFirestore, 
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
import ConUpload from '@/components/middle/construction/conUpload'


const ITEMS_PER_PAGE = 12;


const ConOffer = ({ 
  selectedIndustries,
  selectedRegions, 
  selectedSubRegions
}) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter(); 
  const { currentUser } = useSelector(state => state.user);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const loader = useRef(null);
  const timeFromNow = timestampObject => {
      if (timestampObject && typeof timestampObject.seconds === 'number') {
        return moment.unix(timestampObject.seconds).format('YYYY.MM.DD');
      } else {
        console.error("Invalid timestamp object provided:", timestampObject);
        return '날짜 정보 없음';
      }
    };

  const toggleFavorite = useCallback(async (itemId, currentFavorites) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = currentUser.uid;
    const isCurrentlyFavorited = currentFavorites.includes(userId);
    const top = 'equipApply';
    const category = "equipment";

    const wishlistItem = { itemId: itemId, category: category, top: top, middle: 'apply' };

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
      const constructionDocRef = doc(db, 'equipApply', itemId);
      const userDocRef = doc(db, "users", userId);

      if (isCurrentlyFavorited) {
        await updateDoc(constructionDocRef, {
          favorites: arrayRemove(userId)
        });
        await updateDoc(userDocRef, {
          wishList: arrayRemove(wishlistItem)
        });
      } else {
        await updateDoc(constructionDocRef, {
          favorites: arrayUnion(userId)
        });
        await updateDoc(userDocRef, {
          wishList: arrayUnion(wishlistItem)
        });
      }
    } catch (error) {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === itemId 
            ? { 
                ...msg, 
                favorites: isCurrentlyFavorited 
                  ? [...msg.favorites, userId] 
                  : msg.favorites.filter(uid => uid !== userId) 
              } 
            : msg
        )
      );
      alert("찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [db, currentUser, router]);
  


  const fetchMessages = useCallback(async (isInitialLoad) => {
    if (loading || (!isInitialLoad && !hasMore)) {
      console.log("Stopping fetchMessages: loading or no more data.");
      return;
    }

    setLoading(true);

    let baseQueryRef = collection(db, "equipApply");
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
          description: data.equipApply_description,   
          constructionExperience: data.equipApply_career, 
          companyName: data.equipApply_name || '',
          contactPerson: data.equipApply_rental,  
          phoneNumber: data.equipApply_phoneNumber,
          rentalRates : data.equipApply_rentalRates,    
          imageDownloadUrls: data.imageDownloadUrls || [],
          createdDate: data.createdDate,
          SubCategories: data.SubCategories,
          favorites: data.favorites || [],
          confirmed: data.confirmed
        };
      });

      setMessages((prevMessages) => {
        const combined = isInitialLoad ? newTweetList : [...prevMessages, ...newTweetList];
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        return unique;
      });

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }

      setHasMore(newTweetList.length === ITEMS_PER_PAGE);

    } catch (error) {
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
    router.push(`/equipment/apply/${id}`);
  };



  return (
     <div className='w-full h-full'>
          {messages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {messages.map(({ address, imageDownloadUrls, createdDate, confirmed, constructionExperience, rentalRates, 
              favorites, companyName, phoneNumber, description, id, contactPerson}, idx) => { 
                 const isWishListed = currentUser?.uid && favorites.includes(currentUser.uid);
               return (  
                <div key={idx}
                     className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
                     onClick={() => onClickCard({ id })}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex justify-between items-center">
                       <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              confirmed ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {confirmed ? "확정" : "대기"}
                          </span>

                          <h3 className="font-semibold text-lg text-gray-900 truncate pl-2">
                            {companyName}
                          </h3>
                         
                        </div>
                    <div className='flex flex-row gap-2'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            toggleFavorite(id, favorites); 
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
             
                  {imageDownloadUrls && imageDownloadUrls.length > 0 && (
                    <div className="mb-4 overflow-hidden rounded-md md:w-[300px] md:h-[100px] h-[100px]">
                    <Image
                      src={imageDownloadUrls[0]} 
                      alt={companyName || '업체 이미지'}
                      width={500} 
                      height={100} 
                      layout="relative" 
                      objectFit="cover" 
                    />
                  </div>
                  )}
    
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">경력사항:</span>
                      <span className="font-medium">{constructionExperience || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">장비이용료:</span>
                      <span className="font-medium">{rentalRates || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">운전원필요여부:</span>
                      <span className="font-medium">{contactPerson || '-'}</span>
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
                      <div className="text-xs text-gray-600 truncate">
                        {(description || '').replace(/\\n/g, '\n')}
                      </div>
                    </div>
                  </div>
                </div>
               )
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
                onClick={() => openCategory()} 
                className="fixed bottom-[calc(8vh+20px)] right-4 rounded-full w-16 h-16 text-3xl shadow-lg"
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

export default ConOffer; 