'use client';

import React, { useState } from 'react';

const API_BASE_URL = 'https://apis.data.go.kr/1230000/as/ScsbidInfoService';
const API_ENDPOINTS = {
  '공사': 'getScsbidListSttusCnstwk',
  '용역': 'getScsbidListSttusServc',
};
const SERVICE_KEY = 'YxEK%2F6QD5IwHBrY4oaoTzhXMTaKLqZJd6AmsBG0eKIHz8hp3EaO59cfalOxCr0jtXQhG3Qh1Mr4GdpBGHgYn9Q%3D%3D'; // 반드시 인코딩키 사용!

export default function NaraBidList() {
  const [type, setType] = useState('공사');
  const [inqryBgnDt, setInqryBgnDt] = useState('202507050000');
  const [inqryEndDt, setInqryEndDt] = useState('202507052359');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    setItems([]);
    try {
      const endpoint = API_ENDPOINTS[type];
      const typeParam = encodeURIComponent(type);
      const url = `${API_BASE_URL}/${endpoint}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=20&inqryDiv=1&type=${typeParam}&inqryBgnDt=${inqryBgnDt}&inqryEndDt=${inqryEndDt}&_type=json`;

      const res = await fetch(url);
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        // XML 파싱 또는 에러 메시지 출력
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
      <h1 className="text-2xl font-bold mb-4">나라장터 낙찰 목록 조회</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">구분</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="공사">공사</option>
            <option value="용역">용역</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">조회 시작일시 (YYYYMMDDHHmm)</label>
          <input
            type="text"
            value={inqryBgnDt}
            onChange={e => setInqryBgnDt(e.target.value)}
            className="border p-2 rounded"
            placeholder="예: 202507050000"
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
              <div className="font-semibold">{item.bidNtceNm || '공고명 없음'}</div>
              <div className="text-sm text-gray-600">
                공고번호: {item.bidNtceNo} | 낙찰일시: {item.scsbidDt}
              </div>
              <div>낙찰자: {item.scsbidPrnm || '정보 없음'}</div>
              {/* 필요에 따라 더 많은 필드 출력 */}
            </li>
          ))
        ) : (
          !loading && <div className="text-gray-500">데이터가 없습니다.</div>
        )}
      </ul>
    </div>
  );
}