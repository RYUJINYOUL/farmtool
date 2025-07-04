'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';

// 업종명/지역 목록
const industryNames = [
  "전체",
  "토목공사업", "건축공사업", "토목건축공사업", "조경공사업", "정보통신공사업", "환경전문공사업", "전기공사업",
  "일반소방시설공사업", "전문소방시설공사업", "산림사업법인(숲가꾸기 및 병해충방제)", "조경식재ㆍ시설물공사업",
  "실내건축공사업", "산림조합", "산림사업법인(산림토목)", "금속창호ㆍ지붕건축물조립공사업지하수개발",
  "폐기물종합처분업", "폐기물수집·운반업", "건설폐기물 중간처리업"
];
const regions = [
  "전국", "서울", "부산", "광주", "대전", "인천", "대구", "울산", "경기", "강원", "충북", "충남", "경북", "경남", "전북", "전남", "제주", "세종"
];

// 시간 옵션 생성 (00:00 ~ 23:30, 30분 단위)
const timeOptions = Array.from({length: 48}, (_, i) => {
  const h = String(Math.floor(i/2)).padStart(2, '0');
  const m = i%2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export default function NaraBidList() {
  // 날짜/시간
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  // Changed endTime default to '23:30' to match timeOptions
  const [endTime, setEndTime] = useState('23:30');

  // 업종/지역 다중선택
  const [selectedIndustries, setSelectedIndustries] = useState(["전체"]);
  const [selectedRegions, setSelectedRegions] = useState(["전국"]);

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

  // Mobile check state
  const [isMobile, setIsMobile] = useState(false);

  // API URL
  const SERVICE_KEY = 'YxEK%2F6QD5IwHBrY4oaoTzhXMTaKLqZJd6AmsBG0eKIHz8hp3EaO59cfalOxCr0jtXQhG3Qh1Mr4GdpBGHgYn9Q%3D%3D';
  const API_URL = isConstruction
    ? "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getScsbidListSttusCnstwkPPSSrch"
    : "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoServcPPSSrch";

  // Debounced API call for search button
  const handleFetch = useCallback(async () => {
    setLoading(true);
    setItems([]); // Clear items on new fetch
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

      if (!(selectedIndustries.length === 1 && selectedIndustries[0] === "전체")) {
        params.push(`indstrytyNm=${selectedIndustries.map(encodeURIComponent).join(',')}`);
      }
      if (!(selectedRegions.length === 1 && selectedRegions[0] === "전국")) {
        params.push(`prtcptLmtRgnNm=${selectedRegions.map(encodeURIComponent).join(',')}`);
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
      }
    } catch (err) {
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    pageNo, API_URL, SERVICE_KEY, startDate, startTime, endDate, endTime,
    selectedIndustries, selectedRegions, presmptPrceBgn, presmptPrceEnd, numOfRows
  ]);

  // Effect to fetch data when pageNo changes
  useEffect(() => {
    handleFetch();
  }, [pageNo, handleFetch]); // handleFetch is now stable due to useCallback

  // Check screen width for mobile/desktop UI
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed for 'mobile'
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handler for multi-select dropdowns
  const handleSelectChange = (e, setter, allOption) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    if (selectedOptions.includes(allOption) || selectedOptions.length === 0) {
      setter([allOption]);
    } else {
      setter(selectedOptions.filter(opt => opt !== allOption));
    }
  };

  // 조회 버튼 클릭 시 1페이지로 이동 후 조회
  const handleSearch = () => {
    setPageNo(1); // Setting pageNo to 1 will trigger the useEffect to call handleFetch
    // If pageNo is already 1, setPageNo(1) won't cause a re-render/useEffect trigger.
    // So, we explicitly call handleFetch for consistency.
    // If you always want to refetch on search button click, irrespective of pageNo,
    // explicitly calling handleFetch here is good.
    handleFetch();
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] p-6">
      <h1 className="text-2xl font-bold mb-4">나라장터 낙찰 목록 조회</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        {/* 구분 */}
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">구분</label>
          <select
            value={type}
            onChange={handleTypeChange}
            className="border p-2 rounded w-full"
          >
            <option value="공사">공사</option>
            <option value="용역">용역</option>
          </select>
        </div>

        {/* 업종명 (Conditional UI) */}
        <div className="w-full sm:w-auto flex-grow">
          <label className="block text-sm font-medium mb-1">업종명(다중선택)</label>
          {isMobile ? (
            <select
              multiple
              value={selectedIndustries}
              onChange={(e) => handleSelectChange(e, setSelectedIndustries, "전체")}
              className="border p-2 rounded w-full h-32" // Added height for multi-select
            >
              {industryNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-1 max-w-[300px]">
              {industryNames.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleIndustryClick(name)}
                  className={`px-2 py-1 rounded border text-xs
                    ${selectedIndustries.includes(name) ? 'bg-blue-500 text-white' : 'bg-white'}
                    ${name === "전체" ? 'font-bold' : ''}
                  `}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 지역 (Conditional UI) */}
        <div className="w-full sm:w-auto flex-grow">
          <label className="block text-sm font-medium mb-1">지역(다중선택)</label>
          {isMobile ? (
            <select
              multiple
              value={selectedRegions}
              onChange={(e) => handleSelectChange(e, setSelectedRegions, "전국")}
              className="border p-2 rounded w-full h-32" // Added height for multi-select
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-1 max-w-[300px]">
              {regions.map(region => (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleRegionClick(region)}
                  className={`px-2 py-1 rounded border text-xs
                    ${selectedRegions.includes(region) ? 'bg-green-500 text-white' : 'bg-white'}
                    ${region === "전국" ? 'font-bold' : ''}
                  `}
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 날짜/시간 */}
        <div className="w-full sm:w-auto flex-grow">
          <label className="block text-sm font-medium mb-1">조회 시작일</label>
          <div className="flex flex-col sm:flex-row gap-1">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border p-2 rounded flex-grow"
            />
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="border p-2 rounded"
            >
              {timeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full sm:w-auto flex-grow">
          <label className="block text-sm font-medium mb-1">조회 종료일</label>
          <div className="flex flex-col sm:flex-row gap-1">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border p-2 rounded flex-grow"
            />
            <select
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="border p-2 rounded"
            >
              {timeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 가격 */}
        <div className="w-full sm:w-auto flex-grow">
          <label className="block text-sm font-medium mb-1">가격(시작)</label>
          <input
            type="text"
            value={presmptPrceBgn}
            onChange={e => setPresmptPrceBgn(formatPrice(e.target.value))}
            className="border p-2 rounded w-full"
            placeholder="예: 10,000,000"
          />
        </div>
        <div className="w-full sm:w-auto flex-grow">
          <label className="block text-sm font-medium mb-1">가격(종료)</label>
          <input
            type="text"
            value={presmptPrceEnd}
            onChange={e => setPresmptPrceEnd(formatPrice(e.target.value))}
            className="border p-2 rounded w-full"
            placeholder="예: 20,000,000"
          />
        </div>

        {/* 조회 버튼 */}
        <div className="flex items-end w-full sm:w-auto">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full sm:w-auto"
          >
            {loading ? '조회 중...' : '조회'}
          </button>
        </div>
      </div>
      {/* 결과 리스트 */}
      <ul className="space-y-4">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <li key={idx} className="border p-4 rounded shadow">
              <div className="font-semibold">{item.bidwinnrNm || '낙찰자명 없음'}</div>
              <div className="text-sm text-gray-600">
                사업자번호: {item.bidwinnrBizno || '-'} | 대표자: {item.bidwinnrCeoNm || '-'}
              </div>
              <div className="text-sm text-gray-600">
                주소: {item.bidwinnrAdrs || '-'}
              </div>
              <div className="text-sm text-gray-600">
                전화번호: {item.bidwinnrTelNo || '-'}
              </div>
              <div className="text-sm text-gray-600">
                낙찰금액: {item.sucsfbidAmt ? Number(item.sucsfbidAmt).toLocaleString() + '원' : '-'}
              </div>
              <div className="text-sm text-gray-600">
                낙찰일자: {item.fnlSucsfDate || '-'}
              </div>
            </li>
          ))
        ) : (
          !loading && <div className="text-gray-500">데이터가 없습니다.</div>
        )}
      </ul>
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-6 flex-wrap justify-center">
          {/* Previous Button */}
          <button
            onClick={() => setPageNo(prev => Math.max(1, prev - 1))}
            disabled={pageNo === 1}
            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
          >
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 20) }, (_, i) => {
            // Determine the starting page number to show a "window" of pages
            const startPage = Math.max(1, pageNo - Math.floor(20 / 2));
            const endPage = Math.min(totalPages, startPage + 20 - 1);
            const actualPageNum = Math.min(totalPages, startPage + i);

            if (actualPageNum > endPage) return null; // Avoid rendering extra buttons if totalPages is small

            return (
              <button
                key={actualPageNum}
                onClick={() => setPageNo(actualPageNum)}
                className={`px-3 py-1 rounded border ${pageNo === actualPageNum ? 'bg-blue-600 text-white font-bold' : 'bg-white'}`}
              >
                {actualPageNum}
              </button>
            );
          })}
          {totalPages > 20 && pageNo + 10 < totalPages && ( // Show ellipsis if far from end
            <span className="ml-2 text-gray-500">...</span>
          )}
          {totalPages > 20 && (
            <button
              onClick={() => setPageNo(totalPages)}
              className={`px-3 py-1 rounded border ${pageNo === totalPages ? 'bg-blue-600 text-white font-bold' : 'bg-white'}`}
            >
              {totalPages}
            </button>
          )}
          {/* Next Button */}
          <button
            onClick={() => setPageNo(prev => Math.min(totalPages, prev + 1))}
            disabled={pageNo === totalPages}
            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}