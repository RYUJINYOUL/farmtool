"use client"
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { industryNames, regions, hierarchicalRegions } from '@/lib/constants';
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc, // users/{uid} 문서 업데이트를 위해 추가
  arrayUnion, // 배열에 추가
  arrayRemove // 배열에서 제거
} from "firebase/firestore";
import { db } from "@/firebase";

const timeOptions = Array.from({length: 48}, (_, i) => {
  const h = String(Math.floor(i/2)).padStart(2, '0');
  const m = i%2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});


function MobileFilterUI({
  industryNames,
  regions,
  selectedIndustries,
  selectedRegions,
  handleIndustryClick,
  handleIndustryRemove,
  setSelectedSubRegions,
  setSelectedRegions,
  type,
  handleTypeChange,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  presmptPrceBgn,
  setPresmptPrceBgn,
  presmptPrceEnd,
  setPresmptPrceEnd,
  formatPrice,
  timeOptions,
  regionNameMap,
  hselectedRegion,
  selectedSubRegions,
}) {
  const [showIndustryList, setShowIndustryList] = useState(false);
  const [showRegionList, setShowRegionList] = useState(false);
  const [showSubRegionList, setSubShowRegionList] = useState(false);

  const handleRegionClick = (region) => {
    setSelectedSubRegions('');
    setSelectedRegions(region);
    setShowRegionList(false);
    setSubShowRegionList(true);
  };

  const handleRegionClick2 = (region) => {
    setSelectedSubRegions(region);
    setSubShowRegionList(false);
  };

  const handleRegionRemove = (region) => {
      setSelectedRegions('');
  };

  const handleRegionRemove2 = (region) => {
    setSelectedSubRegions('');
  };

  return (
    <>
      {/* 1. 구분 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">구분</label>
        <select
          value={type}
          onChange={handleTypeChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="공사">공사</option>
          <option value="용역">용역</option>
        </select>
      </div>
      {/* 업종명 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">업종명(다중선택)</label>
        <button
          type="button"
          onClick={() => setShowIndustryList(v => !v)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="text-gray-900">
            전체
          </span>
          <span className="float-right text-gray-400">{showIndustryList ? '▲' : '▼'}</span>
        </button>
        {showIndustryList && (
          <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg">
            <div className="flex flex-wrap gap-2">
              {industryNames.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleIndustryClick(name)}
                  className={`px-3 py-1 rounded-md text-sm border transition-colors
                    ${selectedIndustries.includes(name)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                    ${name === "전체" ? 'font-semibold' : ''}
                  `}
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
              onClick={() => setShowIndustryList(false)}
            >
              닫기
            </button>
          </div>
        )}
        {/* 선택된 업종명 태그 */}
        {selectedIndustries.length > 0 && !(selectedIndustries.length === 1 && selectedIndustries[0] === "전체") && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedIndustries.filter(name => name !== "전체").map(name => (
              <span key={name} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                {name}
                <button
                  type="button"
                  className="ml-2 text-blue-600 hover:text-red-500 transition-colors"
                  onClick={() => handleIndustryRemove(name)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 지역 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">시도</label>
        <button
          type="button"
          onClick={() => setShowRegionList(v => !v)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="text-gray-900">
           {selectedRegions !== '전국' ? selectedRegions : '전국'}
          </span>
          <span className="float-right text-gray-400">{showRegionList ? '▲' : '▼'}</span>
        </button>
        {showRegionList && (
          <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg">
            <div className="flex flex-wrap gap-1">
            {regions.map(region => {
                const mappedRegion = regionNameMap[region] || region;
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => handleRegionClick(region)}
                    className={`px-3 py-1 rounded-md text-sm border transition-colors
                      ${selectedRegions === mappedRegion
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                      ${region === "전국" ? 'font-semibold' : ''}
                    `}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
              onClick={() => setShowRegionList(false)}
            >
              닫기
            </button>
          </div>
        )}
      </div>


      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">시군구</label>
        <button
          type="button"
          onClick={() => setSubShowRegionList(v => !v)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="text-gray-900">
          {selectedSubRegions !== '시군구' ? selectedSubRegions : '시군구'}
          </span>
          <span className="float-right text-gray-400">{showSubRegionList ? '▲' : '▼'}</span>
        </button>
        {showSubRegionList && (
          <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg">
            <div className="flex flex-wrap gap-1">
            {hselectedRegion && hselectedRegion.subRegions.map(region => { // hselectedRegion이 존재할 때만 맵핑
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => handleRegionClick2(region)}
                    className={`px-3 py-1 rounded-md text-sm border transition-colors
                      ${selectedSubRegions === region
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                      ${region === "시군구" ? 'font-semibold' : ''}
                    `}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
              onClick={() => setSubShowRegionList(false)}
            >
              닫기
            </button>
          </div>
        )}
      </div>


      {/* 날짜/시간 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">조회 시작일</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">조회 종료일</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      {/* 가격 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">가격(시작)</label>
        <input
          type="text"
          value={presmptPrceBgn}
          onChange={e => setPresmptPrceBgn(formatPrice(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="예: 10,000,000"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">가격(종료)</label>
        <input
          type="text"
          value={presmptPrceEnd}
          onChange={e => setPresmptPrceEnd(formatPrice(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="예: 20,000,000"
        />
      </div>
    </>
  );
}

export default function NaraBidList() {
  // 날짜/시간
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [endTime, setEndTime] = useState('23:59');

  // 업종/지역 다중선택
  const [selectedIndustries, setSelectedIndustries] = useState(["전체"]);
  const [selectedRegions, setSelectedRegions] = useState('전국');
  const [selectedSubRegions, setSelectedSubRegions] = useState('');

  // 가격
  const [presmptPrceBgn, setPresmptPrceBgn] = useState('');
  const [presmptPrceEnd, setPresmptPrceEnd] = useState('');
  const formatPrice = useCallback(v => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','), []);

  // 구분(공사/용역)
  const [type, setType] = useState('공사');
  const [isConstruction, setIsConstruction] = useState(true);

  // 데이터/로딩/페이지네이션
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const numOfRows = 50;
  const totalPages = useMemo(() => Math.ceil(totalCount / numOfRows), [totalCount, numOfRows]);

  // Drawer(모바일) 상태
  const [showDrawer, setShowDrawer] = useState(false);

  // 정렬 상태
  const [sortBy, setSortBy] = useState('date'); // date, amount

  // Redux currentUser
  const { currentUser } = useSelector((state) => state.user);
  const router = useRouter();

  // 사용자 찜 목록 상태 (users/{uid} 문서의 'nara' 배열)
  const [userFavoritedNaraIds, setUserFavoritedNaraIds] = useState([]);

  // Drawer 열릴 때 body 스크롤 허용 (터치 포함)
  useEffect(() => {
    if (showDrawer) {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showDrawer]);

  // API URL
  const SERVICE_KEY = process.env.NEXT_PUBLIC_API_SERVICE_KEY;
  const API_URL = isConstruction
    ? "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getScsbidListSttusCnstwkPPSSrch"
    : "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoServcPPSSrch";

  // 업종명 다중선택 핸들러
  const handleIndustryClick = useCallback((name) => {
    if (name === "전체") {
      setSelectedIndustries(["전체"]);
    } else {
      setSelectedIndustries(prev => {
        let next = prev.includes(name)
          ? prev.filter(n => n !== name)
          : [...prev.filter(n => n !== "전체"), name];
        if (next.includes("전체") && next.length > 1) next = next.filter(n => n !== "전체");
        if (next.length === 0) return ["전체"];
        return next;
      });
    }
  }, []);

  const handleIndustryRemove = useCallback((name) => {
    setSelectedIndustries(prev => {
      let next = prev.filter(n => n !== name);
      if (next.includes("전체") && next.length > 1) next = next.filter(n => n !== "전체");
      if (next.length === 0) return ["전체"];
      return next;
    });
  }, []);

  const regionNameMap = useMemo(() => ({
    "충북": "충청북도",
    "충남": "충청남도",
    "경북": "경상북도",
    "경남": "경상남도",
    "전북": "전라북도",
    "전남": "전라남도",
    "광주": "광주광역시",
  }), []);

  const handleRegionClick = useCallback((region) => {
      setSelectedSubRegions('');
      setSelectedRegions(region);
  }, []);

  const handleRegionClick2 = useCallback((region) => {
    setSelectedSubRegions(region);
  }, []);

  const hselectedRegion = useMemo(() => {
    return hierarchicalRegions.find(region => region.name === selectedRegions) || { name: selectedRegions, subRegions: [] };
  }, [selectedRegions, hierarchicalRegions]);


  // 구분(공사/용역) 변경
  const handleTypeChange = useCallback((e) => {
    const value = e.target.value;
    setType(value);
    setIsConstruction(value === '공사');
  }, []);

  // **나라장터 찜하기 토글 함수 (users/{uid} 문서의 `nara` 배열과 `users/{uid}/nara/{id}` 서브컬렉션 모두 업데이트)**
  const toggleFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = currentUser.uid;
    const userDocRef = doc(db, "users", userId); // users/{uid} 문서 참조
    const naraDocId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`; // 서브컬렉션 문서 ID
    const userNaraSubCollectionDocRef = doc(collection(userDocRef, "nara"), naraDocId); // users/{uid}/nara/{id} 문서 참조

    // UI 즉시 업데이트 (옵티미스틱 업데이트)
    const isCurrentlyFavorited = userFavoritedNaraIds.includes(naraDocId);
    setUserFavoritedNaraIds(prevIds =>
      isCurrentlyFavorited
        ? prevIds.filter(id => id !== naraDocId)
        : [...prevIds, naraDocId]
    );

    try {
      if (isCurrentlyFavorited) {
        // 찜 해제:
        // 1. users/{uid} 문서의 'nara' 배열에서 ID 제거
        await updateDoc(userDocRef, {
          nara: arrayRemove(naraDocId)
        });
        // 2. users/{uid}/nara 서브컬렉션에서 해당 문서 삭제
        await deleteDoc(userNaraSubCollectionDocRef);
        console.log(`사용자 ${userId}의 nara 배열 및 서브컬렉션에서 ${naraDocId} 제거 성공`);
      } else {
        // 찜 설정:
        // 1. users/{uid} 문서의 'nara' 배열에 ID 추가
        await updateDoc(userDocRef, {
          nara: arrayUnion(naraDocId)
        });
        // 2. users/{uid}/nara 서브컬렉션에 낙찰 항목 전체 데이터 저장
        await setDoc(userNaraSubCollectionDocRef, {
          ...item, // 낙찰 항목의 모든 데이터 저장
          favoritedAt: new Date(), // 찜한 시간 기록
          userId: userId // 찜한 사용자 ID 기록
        });
        console.log(`사용자 ${userId}의 nara 배열 및 서브컬렉션에 ${naraDocId} 추가 성공`);
      }
    } catch (error) {
      console.error("나라장터 찜하기/찜 해제 중 오류 발생: ", error);
      // 오류 발생 시 UI 롤백
      setUserFavoritedNaraIds(prevIds =>
        isCurrentlyFavorited
          ? [...prevIds, naraDocId]
          : prevIds.filter(id => id !== naraDocId)
      );
      alert("나라장터 찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요. (콘솔 확인)");
    }
  }, [db, currentUser, router, userFavoritedNaraIds]);

  // `users/{uid}` 문서의 `nara` 배열을 초기 로드하는 useEffect
  useEffect(() => {
    const loadUserNaraFavorites = async () => {
      if (!currentUser?.uid) {
        setUserFavoritedNaraIds([]);
        setLoading(false); // 로딩 종료
        return;
      }

      const userId = currentUser.uid;
      const userDocRef = doc(db, "users", userId);

      try {
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // 'nara' 필드가 배열인지 확인하고, 아니면 빈 배열로 초기화
          setUserFavoritedNaraIds(Array.isArray(userData.nara) ? userData.nara : []);
        } else {
          console.log("사용자 문서가 존재하지 않습니다. 나라장터 찜 목록을 비워둡니다.");
          setUserFavoritedNaraIds([]);
        }
      } catch (error) {
        console.error("사용자 나라장터 찜 배열을 불러오는 중 오류 발생:", error);
        setUserFavoritedNaraIds([]);
      } finally {
        setLoading(false); // 사용자 찜 데이터 로딩 완료
      }
    };

    setLoading(true); // 사용자 찜 데이터 로딩 시작
    loadUserNaraFavorites();
  }, [currentUser?.uid]); // currentUser.uid가 변경될 때마다 실행

  // API 호출
  const handleFetch = useCallback(async () => {
    setLoading(true);
    setItems([]);
    try {
      const inqryBgnDt = startDate.replace(/-/g, '') + startTime.replace(':', '');
      const inqryEndDt = endDate.replace(/-/g, '') + endTime.replace(':', '');
      const params = [
        `serviceKey=${SERVICE_KEY}`,
        `pageNo=${pageNo}`,
        `numOfRows=${numOfRows}`,
        `inqryDiv=1`,
        `type=json`,
        `inqryBgnDt=${inqryBgnDt}`,
        `inqryEndDt=${inqryEndDt}`,
      ];
      if (selectedRegions === "전국" && (!selectedSubRegions || selectedSubRegions.length === 0)) {
        // '전국'일 때는 파라미터에서 제외 (빈 값으로 보내지 않음)
        // 아무것도 추가하지 않음
      } else if (selectedSubRegions && selectedSubRegions.length > 0) {
        // selectedSubRegions에 값이 있다면 해당 값으로 설정
        params.push(`prtcptLmtRgnNm=${encodeURIComponent(selectedSubRegions)}`);
      } else {
        // 그 외의 경우 (예: '서울' 같은 특정 시/도를 선택하고 하위 지역이 선택되지 않은 경우)
        // selectedRegions의 값을 사용
        params.push(`prtcptLmtRgnNm=${encodeURIComponent(selectedRegions)}`);
      }
      if (!(selectedIndustries.length === 1 && selectedIndustries[0] === "전체")) {
        params.push(`indstrytyNm=${selectedIndustries.map(encodeURIComponent).join(',')}`);
      }
      if (presmptPrceBgn) params.push(`presmptPrceBgn=${presmptPrceBgn.replace(/,/g, '')}`);
      if (presmptPrceEnd) params.push(`presmptPrceEnd=${presmptPrceEnd.replace(/,/g, '')}`);
      const url = `${API_URL}?${params.join('&')}`;
      const res = await fetch(url);
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        setTotalCount(data.response?.body?.totalCount || 0);
        const rawItems = data.response?.body?.items;
        const itemsArr = Array.isArray(rawItems)
          ? rawItems
          : rawItems ? [rawItems] : [];
        setItems(itemsArr);
      } else {
        const text = await res.text();
        alert('API 응답이 JSON이 아닙니다. 콘솔을 확인하세요.');
        console.error('API 응답이 JSON이 아닙니다:', text);
        return;
      }
    } catch (err) {
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, startTime, endDate, endTime, SERVICE_KEY, pageNo, numOfRows, selectedRegions, selectedSubRegions, selectedIndustries, presmptPrceBgn, presmptPrceEnd, API_URL]);


  useEffect(() => {
    handleFetch();
  }, [pageNo, handleFetch]);


  const handleSearch = useCallback(() => {
    setPageNo(1);
    handleFetch();
    setShowDrawer(false);
  }, [handleFetch]);

  // 정렬된 아이템
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.fnlSucsfDate ? parseInt(a.fnlSucsfDate, 10) : 0;
        const dateB = b.fnlSucsfDate ? parseInt(b.fnlSucsfDate, 10) : 0;
        return dateB - dateA;
      }
      if (sortBy === 'amount') {
        return Number(b.sucsfbidAmt || 0) - Number(a.sucsfbidAmt || 0);
      }
      return 0;
    });
  }, [items, sortBy]);

  // PC 필터 UI
  const PCFilterUI = (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 지역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시도</label>
          <div className="flex flex-wrap gap-1">
            {regions.map(region => {
              const mappedRegion = regionNameMap[region] || region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleRegionClick(mappedRegion)}
                  className={`px-3 py-1 text-sm border rounded-lg transition-colors
                    ${selectedRegions === mappedRegion
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                    ${region === "전국" ? 'font-semibold' : ''}
                  `}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시/군/구 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시/군/구</label>
          <div className="flex flex-wrap gap-1">
            {hselectedRegion && hselectedRegion.subRegions.map(region => {
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleRegionClick2(region)}
                  className={`px-3 py-1 text-sm border rounded-lg transition-colors
                    ${selectedSubRegions === region
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                    ${region === "전국" ? 'font-semibold' : ''}
                  `}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* 업종명 (2칸 통합) */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">업종명</label>
          <div className="flex flex-wrap gap-2">
            {industryNames.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => handleIndustryClick(name)}
                className={`px-3 py-1 text-sm border rounded-lg transition-colors
                  ${selectedIndustries.includes(name)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                  ${name === "전체" ? 'font-semibold' : ''}
                `}
              >
                {name}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 날짜/가격 (두 번째 줄) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">조회 시작일</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">조회 종료일</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">가격(시작)</label>
          <input
            type="text"
            value={presmptPrceBgn}
            onChange={e => setPresmptPrceBgn(formatPrice(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="예: 10,000,000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">가격(종료)</label>
          <input
            type="text"
            value={presmptPrceEnd}
            onChange={e => setPresmptPrceEnd(formatPrice(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="예: 20,000,000"
          />
        </div>
      </div>

      {/* 검색 버튼 (가격 종료 아래) */}
      <div className="flex flex-row justify-end mt-3 gap-3">
        <div>
          <select
            value={type}
            onChange={handleTypeChange}
            className="bg-gray-100 border border-gray-300 rounded-lg py-3.5 px-3 focus:outline-none"
          >
            <option value="공사">공사</option>
            <option value="용역">용역</option>
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-15">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">낙찰 목록</h1>

        {/* 모바일: Floating Action Button */}
        <div className="fixed bottom-6 right-6 md:hidden z-40">
          <button
            onClick={() => setShowDrawer(true)}
            className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </button>
        </div>

        {/* PC: 필터 영역 */}
        <div className="hidden md:block">
          {PCFilterUI}
        </div>

        {/* 결과 통계 및 정렬 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">총 <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span>건</span>
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-500">검색 중...</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1 text-sm border rounded-lg transition-colors
                  ${sortBy === 'date'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                `}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy('amount')}
                className={`px-3 py-1 text-sm border rounded-lg transition-colors
                  ${sortBy === 'amount'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                `}
              >
                금액순
              </button>
            </div>
          </div>
        </div>

        {/* 낙찰 목록 */}
        {loading && items.length === 0 ? (
          <div className="text-center py-10 text-gray-600">데이터를 불러오는 중입니다...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-gray-600">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item, index) => {
              const naraDocId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`;
              const isFavorited = userFavoritedNaraIds.includes(naraDocId);

              return (
                <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {item.prdctNm || '사업명 정보 없음'}
                    </h3>
                    <div className='flex flex-row gap-2'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                          toggleFavorite(item);
                        }}
                        className='rounded-full'
                      >
                        {isFavorited ? <IoIosHeart color='red' size={20} /> : <IoMdHeartEmpty size={20} />}
                      </button>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">낙찰</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">낙찰자명:</span>
                      <span className="font-medium">{item.bidwinnrNm || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">낙찰일자:</span>
                      <span className="font-medium">{item.fnlSucsfDate ? String(item.fnlSucsfDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">낙찰금액:</span>
                      <span className="font-semibold text-green-600">
                        {item.sucsfbidAmt ? Number(item.sucsfbidAmt).toLocaleString() + '원' : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">개찰일시:</span>
                      <span className="font-medium">{item.opengDt && item.opengTm ? `${String(item.opengDt).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')} ${String(item.opengTm).replace(/(\d{2})(\d{2})/, '$1:$2')}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">참여제한지역:</span>
                      <span className="font-medium">{item.prtcptLmtRgnNm || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">업종명:</span>
                      <span className="font-medium">{item.indstrytyNm || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalCount > 0 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPageNo(prev => Math.max(1, prev - 1))}
                disabled={pageNo === 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-sm font-medium text-gray-700">
                {pageNo} / {totalPages}
              </span>
              <button
                onClick={() => setPageNo(prev => Math.min(totalPages, prev + 1))}
                disabled={pageNo === totalPages || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* 모바일 Drawer */}
      <div
        className={`fixed inset-0 z-50 transform ${
          showDrawer ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out bg-white shadow-xl md:hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">필터</h2>
          <button onClick={() => setShowDrawer(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-120px)]"> {/* 헤더와 푸터 높이를 고려 */}
          <MobileFilterUI
            industryNames={industryNames}
            regions={regions}
            selectedIndustries={selectedIndustries}
            selectedRegions={selectedRegions}
            handleIndustryClick={handleIndustryClick}
            handleIndustryRemove={handleIndustryRemove}
            setSelectedSubRegions={setSelectedSubRegions}
            setSelectedRegions={setSelectedRegions}
            type={type}
            handleTypeChange={handleTypeChange}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endDate={endDate}
            setEndDate={setEndDate}
            endTime={endTime}
            setEndTime={setEndTime}
            presmptPrceBgn={presmptPrceBgn}
            setPresmptPrceBgn={setPresmptPrceBgn}
            presmptPrceEnd={presmptPrceEnd}
            setPresmptPrceEnd={setPresmptPrceEnd}
            formatPrice={formatPrice}
            timeOptions={timeOptions}
            regionNameMap={regionNameMap}
            hselectedRegion={hselectedRegion}
            hierarchicalRegions={hierarchicalRegions}
            selectedSubRegions={selectedSubRegions}
          />
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>
    </div>
  );
}