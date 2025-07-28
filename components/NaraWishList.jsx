// components/NaraWishList.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IoMdHeartEmpty, IoIosHeart } from 'react-icons/io';
import { collection, getDocs, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function NaraWishList({ initialNaraWishListDetails, initialNaraCount, onClose }) {
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();

  const [naraWishListDetails, setNaraWishListDetails] = useState(initialNaraWishListDetails);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 초기 나라장터 찜 목록 개수와 일치하도록 상태 업데이트
  // useEffect(() => {
  //   setNaraWishListDetails(initialNaraWishListDetails);
  // }, [initialNaraWishListDetails]);

  const toggleNaraFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    const naraDocId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`;
    const userDocRef = doc(db, "users", userId);
    const naraDocRef = doc(collection(userDocRef, "nara"), naraDocId);

    try {
      // UI 옵티미스틱 업데이트: 목록에서 제거
      setNaraWishListDetails((prevDetails) =>
        prevDetails.filter((detail) => {
            const detailId = `${detail.bidwinnrBizno || 'unknown'}-${detail.fnlSucsfDate || 'unknown'}`;
            return detailId !== naraDocId;
        })
      );
      // count 상태는 부모 컴포넌트에서 관리되므로, 여기서는 직접 변경하지 않음
      // 필요한 경우 부모 컴포넌트의 setWishListCount 함수를 props로 받아와 호출

      await deleteDoc(naraDocRef);
      await updateDoc(userDocRef, {
        nara: arrayRemove(naraDocId)
      });

      console.log(`나라장터 찜 항목 ${naraDocId} 제거 성공 (서브컬렉션 및 users 문서 배열)`);

    } catch (error) {
      console.error("나라장터 찜 해제 중 오류 발생:", error);
      alert("나라장터 찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 오류 발생 시 UI 롤백
      setNaraWishListDetails((prevDetails) => [...prevDetails, item]);
    }
  }, [uid, currentUser, router]);

  const handleLoadMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const startIndex = 0;
  const endIndex = currentPage * itemsPerPage;
  const currentItems = naraWishListDetails.slice(startIndex, endIndex);
  const hasMore = endIndex < naraWishListDetails.length;

  return (
    <div className="flex flex-col h-full"> {/* h-full은 Dialog.Panel의 flex-col과 max-h에 의해 유효한 높이를 상속받습니다. */}
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">나라장터 찜 목록</h2>
      {naraWishListDetails.length === 0 ? (
        <p className="text-gray-500 flex-grow text-center flex items-center justify-center">찜한 나라장터 항목이 없습니다.</p>
      ) : (
        <div className="space-y-3 flex-grow pr-2"> {/* flex-grow로 남은 공간 채우기. overflow-y-auto는 Panel에서 */}
          {currentItems.map((item) => {
            const naraItemId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`;
            const isFavorited = true; // 목록에 있다는 것은 찜되어 있다는 의미
            return (
              <div key={naraItemId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {item.bidwinnrNm || '낙찰자명 없음'}
                  </h3>
                  <div className='flex flex-row gap-2'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNaraFavorite(item);
                      }}
                      className="rounded-full"
                    >
                      {isFavorited ? (
                        <IoIosHeart color="red" size={20} />
                      ) : (
                        <IoMdHeartEmpty size={20} />
                      )}
                    </button>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">낙찰</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500">사업자번호:</span>
                    <span className="font-medium">{item.bidwinnrBizno || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">대표자:</span>
                    <span className="font-medium">{item.bidwinnrCeoNm || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">낙찰금액:</span>
                    <span className="font-semibold text-green-600">
                      {item.sucsfbidAmt ? Number(item.sucsfbidAmt).toLocaleString() + '원' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">낙찰일자:</span>
                    <span className="font-medium">{item.fnlSucsfDate ? String(item.fnlSucsfDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}</span>
                  </div>
                  {item.bidwinnrAdrs && (
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
                  )}
                </div>
              </div>
            );
          })}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                더보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}