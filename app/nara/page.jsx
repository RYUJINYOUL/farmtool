"use client"
import React, { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { industryNames, regions, hierarchicalRegions } from '@/lib/constants';



const timeOptions = Array.from({length: 48}, (_, i) => {
  const h = String(Math.floor(i/2)).padStart(2, '0');
  const m = i%2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

// 모바일 Drawer 전용 필터 UI 컴포넌트
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
  hierarchicalRegions,
  selectedSubRegions,
}) {
  const [showIndustryList, setShowIndustryList] = useState(false);
  const [showRegionList, setShowRegionList] = useState(false);
  const [showSubRegionList, setSubShowRegionList] = useState(false);
  const reverseRegionNameMap = Object.fromEntries(
    Object.entries(regionNameMap).map(([short, full]) => [full, short])
  );


  const handleRegionClick = (region) => {
    setSelectedSubRegions('')
    setSelectedRegions(region)
    setShowRegionList(false)
    setSubShowRegionList(true)
    };

    const handleRegionClick2 = (region) => {
      setSelectedSubRegions(region)
      setSubShowRegionList(false)
    };

    const handleRegionRemove = (region) => {
        setSelectedRegions('')
    };


    const handleRegionRemove2 = (region) => {
      setSelectedSubRegions('')
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
            {hselectedRegion.subRegions.map(region => {
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
  const formatPrice = v => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
  const [sigunguSearch, setSigunguSearch] = useState(""); 

  // 정렬 상태
  const [sortBy, setSortBy] = useState('date'); // date, amount

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
  const handleIndustryClick = (name) => {
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
  };
  const handleIndustryRemove = (name) => {
    setSelectedIndustries(prev => {
      let next = prev.filter(n => n !== name);
      if (next.includes("전체") && next.length > 1) next = next.filter(n => n !== "전체");
      if (next.length === 0) return ["전체"];
      return next;
    });
  };

  const regionNameMap = {
    "충북": "충청북도",
    "충남": "충청남도",
    "경북": "경상북도",
    "경남": "경상남도",
    "전북": "전라북도",
    "전남": "전라남도",
    "광주": "광주광역시",
  };
  
  const handleRegionClick = (region) => {
      setSelectedSubRegions('')
      setSelectedRegions(region)
  };

  const handleRegionClick2 = (region) => {
    setSelectedSubRegions(region)
};

  const handleRegionRemove = (region) => {
      setSelectedRegions('')
  };


  const handleRegionRemove2 = (region) => {
    setSelectedSubRegions('')
};

  const hselectedRegion = hierarchicalRegions.find(region => region.name === selectedRegions);

  // 구분(공사/용역) 변경
  const handleTypeChange = (e) => {
    const value = e.target.value;
    setType(value);
    setIsConstruction(value === '공사');
  };

  // API 호출
  const handleFetch = async () => {
    console.log(selectedRegions);
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
      // if (!(selectedRegions.length === 1 && selectedRegions[0] === "전국")) {
      //   params.push(`prtcptLmtRgnNm=${selectedRegions.map(encodeURIComponent).join(',')}`);
      // }
      if (presmptPrceBgn) params.push(`presmptPrceBgn=${presmptPrceBgn.replace(/,/g, '')}`);
      if (presmptPrceEnd) params.push(`presmptPrceEnd=${presmptPrceEnd.replace(/,/g, '')}`);
      const url = `${API_URL}?${params.join('&')}`;
      const res = await fetch(url);
      console.log(res)
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
  };

  useEffect(() => {
    handleFetch();
    // eslint-disable-next-line
  }, [pageNo]);

  const handleSearch = () => {
    setPageNo(1);
    handleFetch();
    setShowDrawer(false);
  };

  // 정렬된 아이템
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.fnlSucsfDate || 0) - new Date(a.fnlSucsfDate || 0);
      }
      if (sortBy === 'amount') {
        return Number(b.sucsfbidAmt || 0) - Number(a.sucsfbidAmt || 0);
      }
      return 0;
    });
  }, [items, sortBy]);

  // PC 필터 UI
  // PC 필터 UI
// PC 필터 UI
const PCFilterUI = (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 지역 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
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

      {/* 지역 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">시/군/구</label>
        <div className="flex flex-wrap gap-1">
          
            {hselectedRegion.subRegions.map(region => {
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
        
        {/* 카드 리스트 */}
        {loading && items.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {item.bidwinnrNm || '낙찰자명 없음'}
                  </h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">낙찰</span>
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
                    <span className="font-medium">{item.fnlSucsfDate || '-'}</span>
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">검색 결과가 없습니다.</div>
            <div className="text-gray-500 text-sm">다른 조건으로 검색해보세요.</div>
          </div>
        )}
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2 flex-wrap justify-center">
              {Array.from({length: Math.min(totalPages, 20)}, (_, i) => (
                <button
                  key={i+1}
                  onClick={() => setPageNo(i+1)}
                  className={`px-4 py-2 rounded-lg border transition-colors
                    ${pageNo === i+1 
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  {i+1}
                </button>
              ))}
              {totalPages > 20 && (
                <span className="px-4 py-2 text-gray-500">...({totalPages} pages)</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 모바일: Drawer */}
      {showDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center"
          style={{ touchAction: 'auto' }}
        >
          <div
            className="bg-white w-full max-w-md max-h-[90vh] p-6 rounded-xl shadow-xl overflow-y-auto"
            style={{ touchAction: 'auto' }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">필터</span>
              <button 
                onClick={() => setShowDrawer(false)} 
                className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSearch(); }}>
              <MobileFilterUI
                industryNames={industryNames}
                regions={regions}
                selectedIndustries={selectedIndustries}
                selectedRegions={selectedRegions}
                handleIndustryClick={handleIndustryClick}
                handleIndustryRemove={handleIndustryRemove}
                setSelectedSubRegions={setSelectedSubRegions}
                handleRegionRemove={handleRegionRemove}
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
                setSelectedRegions={setSelectedRegions}
              />
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? '검색 중...' : '적용'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
