'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchArchitecturalPermitData, ArchitecturalPermitItem } from '@/lib/ArchPmsApi';
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
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


interface ClientPermitListProps {
  initialPermits: ArchitecturalPermitItem[];
  initialTotalCount: number;
  initialPageNo: number;
  numOfRows: number;
  sigunguCd: string;
  bjdongCd: string;
  startDate: string;
  dong: string;
  endDate: string;
  currentMainRegionName: string; // UI 표시용
  currentSubRegionName: string; // UI 표시용
  currentLegalDongName: string; // UI 표시용
}

interface Message {
  id: string;
  favorites: string[];
}


interface WishlistItem {
  itemId: string, 
  category: string, 
  top: string, 
  middle: 'registration'
}

export default function ClientPermitList({
  initialPermits,
  initialTotalCount,
  initialPageNo,
  numOfRows,
  sigunguCd,
  bjdongCd,
  startDate,
  dong,
  endDate,
  currentMainRegionName,
  currentSubRegionName,
  currentLegalDongName,
}: ClientPermitListProps) {
  const getOneYearAgoDate = useCallback(() => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const year = oneYearAgo.getFullYear();
    const month = (oneYearAgo.getMonth() + 1).toString().padStart(2, '0');
    const day = oneYearAgo.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }, []);

  const clientFilterCutoffDate = getOneYearAgoDate(); // 클라이언트 측 필터링 기준 날짜

  const [permits, setPermits] = useState<ArchitecturalPermitItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPageNo);
  const [isLoading, setIsLoading] = useState(initialPermits.length === 0 && initialTotalCount > 0);
  const { currentUser } = useSelector((state: any) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const router = useRouter();

    const toggleFavorite = useCallback(async (itemId: string, currentFavorites: string[]) => {
      if (!currentUser?.uid) {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        router.push('/login');
        return;
      }
  
      const userId = currentUser.uid;
      const isCurrentlyFavorited = currentFavorites.includes(userId);
      const top = 'construction';
      const category = "construction";
  
      const wishlistItem: WishlistItem = { itemId: itemId, category: category, top: top, middle: 'registration' };
  
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
        const constructionDocRef = doc(db, 'construction', itemId);
        
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

 

  // 첫 로드 또는 검색 조건 변경 시 데이터 가져오기 및 클라이언트 필터링
  useEffect(() => {
    setIsLoading(true);
    setError(null);
   

    // initialPermits를 받아서 바로 클라이언트에서 필터링하고 정렬합니다.
    const filteredAndSortedInitialPermits = initialPermits
      .filter(permit => {
        if (!permit.archPmsDay) return false; // 허가일이 없으면 제외
        // 허가일(archPmsDay)이 1년 전 기준 날짜보다 같거나 최신인 경우만 포함
        return parseInt(String(permit.archPmsDay), 10) >= parseInt(clientFilterCutoffDate, 10) && String(permit.useAprDay).trim() == '';
      })
      .sort((a, b) => {
        // 착공일(realStcnsDay) 기준으로 내림차순 정렬 (최신 착공일이 먼저)
        const dateA = a.archPmsDay ? parseInt(String(a.archPmsDay), 10) : 0;
        const dateB = b.archPmsDay ? parseInt(String(b.archPmsDay), 10) : 0;
        return dateB - dateA;
      });

    setPermits(filteredAndSortedInitialPermits);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPageNo);
    setIsLoading(false); // 초기 로딩 완료

    console.log(isLoading)

    // 검색 조건 변경 시 상태 초기화 (여기서는 initialPermits 변화에 반응)
  }, [initialPermits, initialTotalCount, initialPageNo, sigunguCd, bjdongCd, startDate, endDate, dong, clientFilterCutoffDate]);


  const loadMorePermits = useCallback(async () => {
    if (isLoading) return;
    // totalCount는 API의 총 개수이므로, 필터링된 permits.length와 직접 비교하기 어려울 수 있습니다.
    // 여기서는 API의 totalCount를 '더보기'의 기준으로 계속 사용하고, 클라이언트에서 필터링합니다.
    if (permits.length >= totalCount && totalCount > 0) { // permits.length 대신 currentPage와 totalCount로 판단
      console.log("더 이상 로드할 데이터가 없습니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const { data, totalCount: newTotalCount, error: fetchError } = await fetchArchitecturalPermitData(
        sigunguCd,
        bjdongCd,
        startDate,
        endDate,
        nextPage,
        numOfRows
      );

      if (fetchError) {
        setError(fetchError);
      } else {
        const filteredAndSortedInitialPermits = data
        .filter(permit => {
          if (!permit.archPmsDay) return false; // 허가일이 없으면 제외
          // 허가일(archPmsDay)이 1년 전 기준 날짜보다 같거나 최신인 경우만 포함
          return parseInt(String(permit.archPmsDay), 10) >= parseInt(clientFilterCutoffDate, 10) && String(permit.useAprDay).trim() == ''
        })
        .sort((a, b) => {
          // 착공일(realStcnsDay) 기준으로 내림차순 정렬 (최신 착공일이 먼저)
          const dateA = a.archPmsDay ? parseInt(String(a.archPmsDay), 10) : 0;
          const dateB = b.archPmsDay ? parseInt(String(b.archPmsDay), 10) : 0;
          return dateB - dateA;
        });
  
        setPermits((prevPermits) => [...prevPermits, ...filteredAndSortedInitialPermits]);
      
        setTotalCount(filteredAndSortedInitialPermits.length); // API에서 반환하는 totalCount로 업데이트
        setCurrentPage(nextPage);
        setIsLoading(false); // 초기 로딩 완료
      }
    } catch (err: any) {
      console.error("더 많은 인허가 정보를 가져오는 데 실패했습니다:", err);
      setError(err.message || "더 많은 데이터를 로드하는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, permits.length, totalCount, isLoading, sigunguCd, bjdongCd, startDate, endDate, numOfRows]);

  const hasMore = permits.length < totalCount;

    if (isLoading && permits.length === 0 && totalCount > 0) {
    return <div className="text-center mt-20">데이터 로딩 중입니다...</div>;
    }
    // 추가: 검색 결과가 아예 없을 때 (초기 로드 포함)
    if (!isLoading && permits.length === 0 && totalCount === 0) {
        return <p className="text-center mt-20 text-gray-600">선택된 조건에 해당하는 인허가 정보가 없습니다.</p>;
    }



  return (
    <div className='min-h-screen bg-gray-50'>
      {error ? (
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em' }}>오류 발생: {error}</p>
      ) : (
        <div>
          <p style={{ fontSize: '1.0em', fontWeight: 'bold', marginBottom: '20px', color: '#444' }}>
             {currentMainRegionName} {currentSubRegionName} {dong} 
          </p>

          {permits.length === 0 && !isLoading && totalCount === 0 ? (
            <p style={{ fontSize: '1.1em', color: '#666' }}>선택된 조건에 해당하는 인허가 정보가 없습니다.</p>
          ) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permits.map((permit, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {permit.bldNm || '건물명 정보 없음'}
                  </h3>
                  <div className='flex flex-row gap-2'>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                        // toggleFavorite(id, favorites); // itemId와 현재 favorites 배열 전달
                                      }}
                                      className='rounded-full' >
                                      { <IoIosHeart color='red' size={20} /> }
                                    </button>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">허가</span>
                                    {/* 좋아요 수 표시 (favorites 배열의 길이) */}
                                    {/* <span className="text-red-600 text-[18px] rounded-full font-medium">
                                      {favorites.length}
                                    </span> */}
                                    </div>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500">대지위치:</span>
                    <span className="font-medium">{permit.platPlc || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">허가일:</span>
                    <span className="font-medium">{permit.archPmsDay ? String(permit.archPmsDay).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">착공일:</span>
                    <span className="font-semibold text-green-600">
                      {permit.realStcnsDay ? String(permit.realStcnsDay).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">건축구분:</span>
                    <span className="font-medium">{permit.mainPurpsCdNm || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">대지면적:</span>
                    <span className="font-medium">{permit.platArea || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">연면적:</span>
                    <span className="font-medium">{permit.totArea || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">건축면적:</span>
                    <span className="font-medium">{permit.archArea || '-'}</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-gray-500">용적률:</span>
                    <span className="font-medium">{permit.vlRat || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">건폐율:</span>
                    <span className="font-medium">{permit.bcRat || '-'}</span>
                  </div>
                  {/* {item.bidwinnrAdrs && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-gray-500 text-xs mb-1">주소:</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{item.bidwinnrAdrs}</div>
                    </div>
                  )}
                  {item.bidwinnrTelNo && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-gray-500 text-xs mb-1">전화번호:</div>
                      <div className="text-xs text-gray-600">{item.bidwinnrTelNo}</div>
                    </div>
                  )} */}
                </div>
              </div>
            ))}
          </div>
          )}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={loadMorePermits}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#007bff',
                  color: 'white',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? '로딩 중...' : '더보기'}
              </button>
            </div>
          )}
          {!hasMore && permits.length > 0 && !isLoading && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>모든 데이터를 불러왔습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
