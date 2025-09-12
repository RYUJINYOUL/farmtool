'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchArchitecturalPermitData, ArchitecturalPermitItem } from '@/lib/ArchPmsApi';
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import {
  getDoc,
  doc,
  updateDoc,     // permit 배열 업데이트용
  arrayUnion,    // permit 배열에 추가용
  arrayRemove,   // permit 배열에서 제거용
  collection,
  setDoc,        // 서브컬렉션 문서 추가용
  deleteDoc      // 서브컬렉션 문서 삭제용
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

  const clientFilterCutoffDate = getOneYearAgoDate();

  const [permits, setPermits] = useState<ArchitecturalPermitItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPageNo);
  const [isLoading, setIsLoading] = useState(initialPermits.length === 0 && initialTotalCount > 0);
  const { currentUser } = useSelector((state: any) => state.user);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [loadingInitialUserData, setLoadingInitialUserData] = useState(true); // 사용자 찜 배열 로딩 상태
  const [userPermitIdsInUserDoc, setUserPermitIdsInUserDoc] = useState<string[]>([]); // users/{uid} 문서의 permit 배열


  // 찜하기/찜 해제 함수 (users/{uid} 문서의 permit 배열과 users/{uid}/permits 서브컬렉션 모두 업데이트)
  const toggleFavorite = useCallback(async (permitItem: ArchitecturalPermitItem) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = currentUser.uid;
    const userDocRef = doc(db, "users", userId); // users/{uid} 문서 참조
    const userPermitsSubCollectionDocRef = doc(collection(userDocRef, "permits"), permitItem.platPlc); // users/{uid}/permits/{platPlc} 문서 참조

    const permitIdToToggle = permitItem.platPlc;

    // UI 즉시 업데이트 (옵티미스틱 업데이트)
    const isCurrentlyFavorited = userPermitIdsInUserDoc.includes(permitIdToToggle);
    setUserPermitIdsInUserDoc(prevIds =>
      isCurrentlyFavorited
        ? prevIds.filter(id => id !== permitIdToToggle)
        : [...prevIds, permitIdToToggle]
    );

    try {
      if (isCurrentlyFavorited) {
        // 찜 해제:
        // 1. users/{uid} 문서의 permit 배열에서 platPlc 제거
        await updateDoc(userDocRef, {
          permit: arrayRemove(permitIdToToggle)
        });
        // 2. users/{uid}/permits 서브컬렉션에서 해당 문서 삭제
        await deleteDoc(userPermitsSubCollectionDocRef);
      } else {
        // 찜 설정:
        // 1. users/{uid} 문서의 permit 배열에 platPlc 추가
        await updateDoc(userDocRef, {
          permit: arrayUnion(permitIdToToggle)
        });
        // 2. users/{uid}/permits 서브컬렉션에 인허가 항목 전체 데이터 저장
        await setDoc(userPermitsSubCollectionDocRef, {
          ...permitItem, // 인허가 항목의 모든 데이터 저장
          favoritedAt: new Date(), // 찜한 시간 기록
          userId: userId // 찜한 사용자 ID 기록
        });
      }
    } catch (error) {
      console.error("찜하기/찜 해제 중 오류 발생: ", error);
      // 오류 발생 시 UI 롤백
      setUserPermitIdsInUserDoc(prevIds =>
        isCurrentlyFavorited
          ? [...prevIds, permitIdToToggle]
          : prevIds.filter(id => id !== permitIdToToggle)
      );
      alert("찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요. (콘솔 확인)");
    }
  }, [db, currentUser, router, userPermitIdsInUserDoc]);


  // 사용자의 찜 목록 ID (users/{uid} 문서의 permit 배열)를 Firestore에서 불러오는 useEffect
  useEffect(() => {
    const loadUserPermitIds = async () => {
      if (!currentUser?.uid) {
        setUserPermitIdsInUserDoc([]);
        setLoadingInitialUserData(false);
        return;
      }

      setLoadingInitialUserData(true);

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const fetchedUserData = userSnap.data();
          setUserPermitIdsInUserDoc(Array.isArray(fetchedUserData.permit) ? fetchedUserData.permit : []);
        } else {
          // 사용자 문서가 없으면 생성하거나, 빈 찜 목록으로 처리
          setUserPermitIdsInUserDoc([]);
        }
      } catch (err) {
        setError("찜 목록을 불러오는 데 실패했습니다.");
        setUserPermitIdsInUserDoc([]);
      } finally {
        setLoadingInitialUserData(false);
      }
    };

    loadUserPermitIds();
  }, [currentUser?.uid]); // currentUser.uid가 변경될 때마다 실행


  // 초기 인허가 데이터 로딩 및 필터링/정렬
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const filteredAndSortedInitialPermits = initialPermits
      .filter(permit => {
        if (!permit.archPmsDay) return false;
        return parseInt(String(permit.archPmsDay), 10) >= parseInt(clientFilterCutoffDate, 10) && String(permit.useAprDay).trim() == '';
      })
      .sort((a, b) => {
        const dateA = a.archPmsDay ? parseInt(String(a.archPmsDay), 10) : 0;
        const dateB = b.archPmsDay ? parseInt(String(b.archPmsDay), 10) : 0;
        return dateB - dateA;
      });

    setPermits(filteredAndSortedInitialPermits);
    setTotalCount(initialTotalCount);
    setCurrentPage(initialPageNo);
    setIsLoading(false);

  }, [initialPermits, initialTotalCount, initialPageNo, sigunguCd, bjdongCd, startDate, endDate, dong, clientFilterCutoffDate]);


  // 더보기 버튼 클릭 시 추가 데이터 로딩
  const loadMorePermits = useCallback(async () => {
    if (isLoading) return;
    if (permits.length >= totalCount && totalCount > 0) {
      
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
        const filteredAndSortedAdditionalPermits = data
        .filter(permit => {
          if (!permit.archPmsDay) return false;
          return parseInt(String(permit.archPmsDay), 10) >= parseInt(clientFilterCutoffDate, 10) && String(permit.useAprDay).trim() == ''
        })
        .sort((a, b) => {
          const dateA = a.archPmsDay ? parseInt(String(a.archPmsDay), 10) : 0;
          const dateB = b.archPmsDay ? parseInt(String(b.archPmsDay), 10) : 0;
          return dateB - dateA;
        });

        setPermits((prevPermits) => [...prevPermits, ...filteredAndSortedAdditionalPermits]);

        setTotalCount(newTotalCount);
        setCurrentPage(nextPage);
      }
    } catch (err: any) {
      console.error("더 많은 인허가 정보를 가져오는 데 실패했습니다:", err);
      setError(err.message || "더 많은 데이터를 로드하는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, permits.length, totalCount, isLoading, sigunguCd, bjdongCd, startDate, endDate, numOfRows]);

  const hasMore = permits.length < totalCount;

  // 전체 로딩 상태 (사용자 찜 배열 로딩 + 인허가 데이터 로딩)
  if (loadingInitialUserData || (isLoading && permits.length === 0 && totalCount > 0)) {
    return <div className="text-center mt-20">데이터 로딩 중입니다...</div>;
  }

  // 데이터가 없고 로딩도 끝났을 때
  if (!loadingInitialUserData && !isLoading && permits.length === 0 && totalCount === 0) {
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

          {permits.length === 0 && !loadingInitialUserData && !isLoading ? (
            <p style={{ fontSize: '1.1em', color: '#666' }}>선택된 조건에 해당하는 인허가 정보가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {permits.map((permit, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {permit.bldNm || '건물명 정보 없음'}
                    </h3>
                    <div className='flex flex-row gap-2'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(permit);
                        }}
                        className='rounded-full'
                      >
                        {userPermitIdsInUserDoc.includes(permit.platPlc) ? <IoIosHeart color='red' size={20} /> : <IoMdHeartEmpty size={20} />}
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