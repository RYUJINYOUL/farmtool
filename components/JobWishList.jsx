"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IoMdHeartEmpty, IoIosHeart } from 'react-icons/io';
import { collection, getDocs, doc, deleteDoc, updateDoc, arrayRemove, query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JobWishList({ onClose }) { // initialNaraWishListDetails, initialNaraCount props 제거
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();

  const [naraWishListDetails, setNaraWishListDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null); // 마지막으로 로드된 문서 스냅샷
  const [hasMore, setHasMore] = useState(true); // 더 로드할 데이터가 있는지 여부
  const itemsPerPage = 5; // 한 번에 가져올 아이템 수
  const loader = useRef(null); // Intersection Observer를 위한 ref (현재는 더보기 버튼 방식이므로 직접 사용하지 않음)

  // Firebase에서 찜 목록을 가져오는 함수 (페이지네이션 포함)
  const fetchNaraWishListDetails = useCallback(async (isInitialLoad = true) => {
    if (!uid) {
      setLoading(false);
      setNaraWishListDetails([]); // uid가 없으면 목록 비움
      setHasMore(false); // 더 이상 로드할 데이터 없음
      return;
    }

    // 더 이상 데이터가 없는데 초기 로드가 아닌 경우 (불필요한 호출 방지)
    if (!hasMore && !isInitialLoad) {
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, "users", uid);
      const naraCollectionRef = collection(userDocRef, "job");

      let q;
      // 'fnlSucsfDate' 필드를 기준으로 정렬. 실제 데이터 구조에 맞게 정렬 기준 필드를 조정하세요.
      const baseQuery = query(naraCollectionRef, orderBy("fnlSucsfDate", "desc"));

      if (isInitialLoad) {
        q = query(baseQuery, limit(itemsPerPage));
      } else {
        // lastDoc이 없는데 initialLoad가 아닌 경우 (예외 상황)
        if (!lastDoc) {
            setHasMore(false); // 더 이상 불러올 데이터 없음
            setLoading(false);
            return;
        }
        q = query(baseQuery, startAfter(lastDoc), limit(itemsPerPage));
      }

      const querySnapshot = await getDocs(q);
      const newDetails = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // 문서 ID도 함께 저장

      setNaraWishListDetails(prevDetails =>
        isInitialLoad ? newDetails : [...prevDetails, ...newDetails]
      );
      // querySnapshot.docs.length가 0일 경우 lastDoc을 null로 설정하여 더 이상 로드할 문서가 없음을 명확히 합니다.
      setLastDoc(querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null);
      setHasMore(newDetails.length === itemsPerPage); // 가져온 개수가 요청한 개수와 같으면 다음 페이지가 있을 수 있음

    } catch (err) {
      console.error("구인구직 찜 목록 세부정보 로드 오류:", err);
      setError("데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [uid, itemsPerPage, lastDoc, hasMore]); // 의존성 배열에 lastDoc과 hasMore 추가

  // 컴포넌트 마운트 시 (다이얼로그 열릴 때) 초기 데이터 로드
  useEffect(() => {
    if (uid) {
      // 다이얼로그가 닫혔다가 다시 열릴 경우를 대비해 상태 초기화
      setNaraWishListDetails([]);
      setLastDoc(null);
      setHasMore(true);
      setLoading(true); // 로딩 상태 재설정
      fetchNaraWishListDetails(true); // 처음부터 다시 로드
    }
  }, [uid]); // fetchNaraWishListDetails 자체는 useCallback으로 감싸져 있으므로 여기서는 제외

  // Intersection Observer를 사용하여 "더보기" 버튼 없이 스크롤 시 자동 로드
  // 또는 명시적으로 "더보기" 버튼 클릭 시 로드
  // 여기서는 "더보기" 버튼 방식을 유지합니다.
  const handleLoadMore = () => {
    fetchNaraWishListDetails(false);
  };

  // 찜 해제 로직
  const toggleNaraFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    // 구인구직 데이터의 고유 식별자를 확인해야 합니다.
    // bidwinnrBizno와 fnlSucsfDate 조합을 문서 ID로 사용했다면 해당 조합으로 찾습니다.
    const naraDocId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`;
    const userDocRef = doc(db, "users", userId);
    const naraDocRef = doc(collection(userDocRef, "job"), naraDocId);

    try {
      // UI 옵티미스틱 업데이트: 목록에서 제거
      setNaraWishListDetails((prevDetails) =>
        prevDetails.filter((detail) => {
            const detailId = `${detail.bidwinnrBizno || 'unknown'}-${detail.fnlSucsfDate || 'unknown'}`;
            return detailId !== naraDocId;
        })
      );

      await deleteDoc(naraDocRef);
      await updateDoc(userDocRef, {
        job: arrayRemove(naraDocId) // 만약 users 문서에 nara 필드가 배열로 있다면
      });

      setNaraWishListDetails([]); // 목록 비우기 (새로 로드 준비)
      setLastDoc(null);
      setHasMore(true);
      fetchNaraWishListDetails(true);


    } catch (error) {
      console.error("구인구직 찜 해제 중 오류 발생:", error);
      alert("구인구직 찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 오류 발생 시 UI 롤백 (여기서는 찜 해제된 아이템 복구)
      setNaraWishListDetails((prevDetails) => [...prevDetails, item]);
    }
  }, [uid, currentUser, router, fetchNaraWishListDetails]);

  if (loading && naraWishListDetails.length === 0) { // 초기 로딩 시에만 로딩 스피너 표시
    return <div className="text-center py-10">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">구인구직 찜 목록</h2>
      {naraWishListDetails.length === 0 && !loading ? ( // 로딩 중이 아니고 데이터가 없을 때만 표시
        <p className="text-gray-500 flex-grow text-center flex items-center justify-center">찜한 구인구직 항목이 없습니다.</p>
      ) : (
        <div className="space-y-3 flex-grow pr-2">
          {naraWishListDetails.map((item) => {
            // Firestore 문서 ID가 없는 경우 고유하게 식별할 수 있는 조합 사용
            const naraItemId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}-${item.bidwinnrNm || 'unknown'}`;
            const isFavorited = true; // 목록에 있다는 것은 찜되어 있다는 의미 (여기서는 항상 true)
            return (
              <div key={naraItemId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <Link href={`/nara/${naraItemId}`} className="block"> {/* 실제 경로에 맞게 수정 */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {item.bidwinnrNm || '낙찰자명 없음'}
                    </h3>
                    <div className='flex flex-row gap-2'>
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Link 이동 방지
                          e.stopPropagation(); // 이벤트 버블링 방지
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
                  {/* <div className="space-y-3 text-sm text-gray-600">
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
                        <div className="text-xs text-gray-600">전화번호: {item.bidwinnrTelNo}</div>
                      </div>
                    )}
                  </div> */}
                </Link>
              </div>
            );
          })}
          {hasMore && ( // 더 로드할 데이터가 있고 로딩 중이 아닐 때만 "더보기" 표시
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore} // handleLoadMore 함수 호출
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                disabled={loading} // 로딩 중에는 버튼 비활성화
              >
                {loading ? '로딩 중...' : '더보기'}
              </button>
            </div>
          )}
          {!hasMore && naraWishListDetails.length > 0 && ( // 모든 데이터를 불러왔을 때 메시지
              <p className="text-center text-gray-500 text-sm mt-4">모든 찜 목록을 불러왔습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}