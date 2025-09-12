"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IoMdHeartEmpty, IoIosHeart } from 'react-icons/io';
import { collection, getDocs, doc, deleteDoc, updateDoc, arrayRemove, query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PermitWishList({ onClose }) { // initialPermitWishListDetails, initialPermitCount props 제거
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();

  const [permitWishListDetails, setPermitWishListDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null); // 마지막으로 로드된 문서 스냅샷
  const [hasMore, setHasMore] = useState(true); // 더 로드할 데이터가 있는지 여부
  const itemsPerPage = 5; // 한 번에 가져올 아이템 수
  const loader = useRef(null); // Intersection Observer를 위한 ref (현재는 사용하지 않음, 필요시 활용)

  // Firebase에서 찜 목록을 가져오는 함수 (페이지네이션 포함)
  const fetchPermitWishListDetails = useCallback(async (isInitialLoad = true) => {
    if (!uid) {
      setLoading(false);
      setPermitWishListDetails([]);
      setHasMore(false);
      return;
    }

    if (!hasMore && !isInitialLoad) {
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, "users", uid);
      const permitsCollectionRef = collection(userDocRef, "permits");

      let q;
      // 'archPmsDay' 필드를 기준으로 정렬 (허가일). 실제 데이터 구조에 맞게 조정
      const baseQuery = query(permitsCollectionRef, orderBy("archPmsDay", "desc"));

      if (isInitialLoad) {
        q = query(baseQuery, limit(itemsPerPage));
      } else {
        if (!lastDoc) {
            setHasMore(false);
            setLoading(false);
            return;
        }
        q = query(baseQuery, startAfter(lastDoc), limit(itemsPerPage));
      }

      const querySnapshot = await getDocs(q);
      const newDetails = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // 문서 ID도 함께 저장

      setPermitWishListDetails(prevDetails =>
        isInitialLoad ? newDetails : [...prevDetails, ...newDetails]
      );
      setLastDoc(querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null);
      setHasMore(newDetails.length === itemsPerPage);

    } catch (err) {
      console.error("인허가 찜 목록 세부정보 로드 오류:", err);
      setError("데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [uid, itemsPerPage, lastDoc, hasMore]);

  // 컴포넌트 마운트 시 (다이얼로그 열릴 때) 초기 데이터 로드
  useEffect(() => {
    if (uid) {
      setPermitWishListDetails([]);
      setLastDoc(null);
      setHasMore(true);
      setLoading(true);
      fetchPermitWishListDetails(true);
    }
  }, [uid]); // fetchPermitWishListDetails 자체는 useCallback으로 감싸져 있으므로 여기서는 제외

  const handleLoadMore = () => {
    fetchPermitWishListDetails(false);
  };

  // 찜 해제 로직
  const togglePermitFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    // 인허가 데이터의 고유 식별자를 확인해야 합니다.
    // `item.platPlc`가 고유한 문서 ID로 사용되었다고 가정합니다.
    const permitDocId = item.platPlc;
    const userDocRef = doc(db, "users", userId);
    const permitDocRef = doc(collection(userDocRef, "permits"), permitDocId);

    try {
      setPermitWishListDetails((prevDetails) =>
        prevDetails.filter((detail) => detail.platPlc !== permitDocId)
      );

      await deleteDoc(permitDocRef);
      // users 문서의 permit 배열 업데이트는 유지 (서브컬렉션이 아닌, users 문서 내에 배열로 ID를 저장하는 경우)
      await updateDoc(userDocRef, {
        permit: arrayRemove(permitDocId) // 만약 users 문서에 permit 필드가 배열로 있다면
      });

      setPermitWishListDetails([]); // 목록 비우기 (새로 로드 준비)
      setLastDoc(null);
      setHasMore(true);
      fetchPermitWishListDetails(true);

    } catch (error) {
      alert("인허가 찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      setPermitWishListDetails((prevDetails) => [...prevDetails, item]);
    }
  }, [uid, currentUser, router, fetchPermitWishListDetails]);

  if (loading && permitWishListDetails.length === 0) {
    return <div className="text-center py-10">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">인허가 찜 목록</h2>
      {permitWishListDetails.length === 0 && !loading ? (
        <p className="text-gray-500 flex-grow text-center flex items-center justify-center">찜한 인허가 항목이 없습니다.</p>
      ) : (
        <div className="space-y-3 flex-grow pr-2">
          {permitWishListDetails.map((permit) => {
            const isFavorited = true; // 목록에 있다는 것은 찜되어 있다는 의미
            // 고유 키로 permit.platPlc를 사용 (실제 데이터에 맞게 조정 필요)
            return (
              <div key={permit.platPlc} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <Link href={`/permit/${permit.platPlc}`} className="block"> {/* 실제 경로에 맞게 수정 */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {permit.bldNm || '건물명 정보 없음'}
                    </h3>
                    <div className='flex flex-row gap-2'>
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Link 이동 방지
                          e.stopPropagation(); // 이벤트 버블링 방지
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
                </Link>
              </div>
            );
          })}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더보기'}
              </button>
            </div>
          )}
          {!hasMore && permitWishListDetails.length > 0 && (
              <p className="text-center text-gray-500 text-sm mt-4">모든 찜 목록을 불러왔습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}