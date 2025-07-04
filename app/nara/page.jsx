'use client';

import React, { useState } from 'react';

const industryNames = [
  "토목공사업", "건축공사업", "토목건축공사업", "조경공사업", "정보통신공사업", "환경전문공사업", "전기공사업",
  "일반소방시설공사업", "전문소방시설공사업", "산림사업법인(숲가꾸기 및 병해충방제)", "조경식재ㆍ시설물공사업",
  "실내건축공사업", "산림조합", "산림사업법인(산림토목)", "금속창호ㆍ지붕건축물조립공사업지하수개발",
  "폐기물종합처분업", "폐기물수집·운반업", "건설폐기물 중간처리업"
];

const regions = [
  '전국', '서울', '부산', '광주', '대전', '인천', '대구', '울산', '경기', '강원', '충북', '충남', '경북', '경남', '전북', '전남', '제주', '세종'
];


export default function NaraBidList() {
  const [inqryBgnDt, setInqryBgnDt] = useState('202507010000');
  const [inqryEndDt, setInqryEndDt] = useState('202507052359');
  const [prtcptLmtRgnNm, setPrtcptLmtRgnNm] = useState('전국');
  const [presmptPrceBgn, setPresmptPrceBgn] = useState('');
  const [presmptPrceEnd, setPresmptPrceEnd] = useState('');
  const [indstrytyNm, setIndstrytyNm] = useState(industryNames[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isConstruction, setIsConstruction] = useState(true);
  const [type, setType] = useState('공사'); 


  const handleTypeChange = (e) => {
    const value = e.target.value;
    setType(value);
    setIsConstruction(value === '공사');
  };


  const SERVICE_KEY = 'YxEK%2F6QD5IwHBrY4oaoTzhXMTaKLqZJd6AmsBG0eKIHz8hp3EaO59cfalOxCr0jtXQhG3Qh1Mr4GdpBGHgYn9Q%3D%3D'; // 인코딩키
  const API_URL = isConstruction
  ? "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getScsbidListSttusCnstwkPPSSrch"
  : "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoServcPPSSrch";



  const handleFetch = async () => {
    setLoading(true);
    setItems([]);
    try {
      const params = [
        `serviceKey=${SERVICE_KEY}`,
        `pageNo=1`,
        `numOfRows=20`,
        `inqryDiv=1`,
        `type=json`
      ];
      if (inqryBgnDt) params.push(`inqryBgnDt=${inqryBgnDt}`);
      if (inqryEndDt) params.push(`inqryEndDt=${inqryEndDt}`);
      if (prtcptLmtRgnNm && prtcptLmtRgnNm !== '전국') params.push(`prtcptLmtRgnNm=${encodeURIComponent(prtcptLmtRgnNm)}`);
      if (presmptPrceBgn) params.push(`presmptPrceBgn=${presmptPrceBgn.replace(/,/g, '')}`);
      if (presmptPrceEnd) params.push(`presmptPrceEnd=${presmptPrceEnd.replace(/,/g, '')}`);
      if (indstrytyNm) params.push(`indstrytyNm=${encodeURIComponent(indstrytyNm)}`);

      const url = `${API_URL}?${params.join('&')}`;

      const res = await fetch(url);
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        const itemsArr = Array.isArray(data.response?.body?.items?.item)
          ? data.response.body.items.item
          : data.response?.body?.items?.item
            ? [data.response.body.items.item]
            : [];
        setItems(itemsArr);
      } else {
        const text = await res.text();
        console.error('API 응답이 JSON이 아닙니다:', text);
        alert('API 응답이 JSON이 아닙니다. 콘솔을 확인하세요.');
        return;
      }
    } catch (err) {
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">나라장터 용역 낙찰 목록 조회</h1>
      <div className="flex flex-wrap gap-4 mb-6">
      <div>
          <label className="block text-sm font-medium mb-1">구분</label>
          <select
            value={type}
            onChange={handleTypeChange}
            className="border p-2 rounded"
          >
            <option value="공사">공사</option>
            <option value="용역">용역</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">업종명</label>
          <select
            value={indstrytyNm}
            onChange={e => setIndstrytyNm(e.target.value)}
            className="border p-2 rounded"
          >
            {industryNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">조회 시작일시 (YYYYMMDDHHmm)</label>
          <input
            type="text"
            value={inqryBgnDt}
            onChange={e => setInqryBgnDt(e.target.value)}
            className="border p-2 rounded"
            placeholder="예: 202507010000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">조회 종료일시 (YYYYMMDDHHmm)</label>
          <input
            type="text"
            value={inqryEndDt}
            onChange={e => setInqryEndDt(e.target.value)}
            className="border p-2 rounded"
            placeholder="예: 202507052359"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">지역</label>
          <select
            value={prtcptLmtRgnNm}
            onChange={e => setPrtcptLmtRgnNm(e.target.value)}
            className="border p-2 rounded"
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">가격(시작)</label>
          <input
            type="text"
            value={presmptPrceBgn}
            onChange={e => setPresmptPrceBgn(e.target.value.replace(/[^0-9,]/g, ''))}
            className="border p-2 rounded"
            placeholder="예: 10000000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">가격(종료)</label>
          <input
            type="text"
            value={presmptPrceEnd}
            onChange={e => setPresmptPrceEnd(e.target.value.replace(/[^0-9,]/g, ''))}
            className="border p-2 rounded"
            placeholder="예: 20000000"
          />
        </div>
        <div>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? '조회 중...' : '조회'}
          </button>
        </div>
      </div>
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
    </div>
  );
}