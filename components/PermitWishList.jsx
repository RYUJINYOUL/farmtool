// components/PermitWishList.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IoMdHeartEmpty, IoIosHeart } from 'react-icons/io';
import { collection, getDocs, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function PermitWishList({ initialPermitWishListDetails, initialPermitCount, onClose }) {
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();

  const [permitWishListDetails, setPermitWishListDetails] = useState(initialPermitWishListDetails);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 초기 인허가 찜 목록 개수와 일치하도록 상태 업데이트
  // useEffect(() => {
  //   setPermitWishListDetails(initialPermitWishListDetails);
  // }, [initialPermitWishListDetails]);

  const togglePermitFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    const permitDocId = item.platPlc;
    const userDocRef = doc(db, "users", userId);
    const permitDocRef = doc(collection(userDocRef, "permits"), permitDocId);

    try {
      // UI 옵티미스틱 업데이트: 목록에서 제거
      setPermitWishListDetails((prevDetails) =>
        prevDetails.filter((detail) => detail.platPlc !== permitDocId)
      );
      // count 상태는 부모 컴포넌트에서 관리되므로, 여기서는 직접 변경하지 않음
      // 필요한 경우 부모 컴포넌트의 setWishListCount 함수를 props로 받아와 호출

      await deleteDoc(permitDocRef);
      await updateDoc(userDocRef, {
        permit: arrayRemove(permitDocId)
      });

      console.log(`인허가 찜 항목 ${permitDocId} 제거 성공 (서브컬렉션 및 users 문서 배열)`);

    } catch (error) {
      console.error("인허가 찜 해제 중 오류 발생:", error);
      alert("인허가 찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 오류 발생 시 UI 롤백
      setPermitWishListDetails((prevDetails) => [...prevDetails, item]);
    }
  }, [uid, currentUser, router]);

  const handleLoadMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const startIndex = 0;
  const endIndex = currentPage * itemsPerPage;
  const currentItems = permitWishListDetails.slice(startIndex, endIndex);
  const hasMore = endIndex < permitWishListDetails.length;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">인허가 찜 목록</h2>
      {permitWishListDetails.length === 0 ? (
        <p className="text-gray-500 flex-grow text-center flex items-center justify-center">찜한 인허가 항목이 없습니다.</p>
      ) : (
        <div className="space-y-3 flex-grow pr-2"> {/* flex-grow로 남은 공간 채우기. overflow-y-auto는 Panel에서 */}
          {currentItems.map((permit) => {
            const isFavorited = true; // 목록에 있다는 것은 찜되어 있다는 의미
            return (
              <div key={permit.platPlc} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {permit.bldNm || '건물명 정보 없음'}
                  </h3>
                  <div className='flex flex-row gap-2'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePermitFavorite(permit);
                      }}
                      className="rounded-full"
                    >
                      {isFavorited ? (
                        <IoIosHeart color="red" size={20} />
                      ) : (
                        <IoMdHeartEmpty size={20} />
                      )}
                    </button>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">허가</span>
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