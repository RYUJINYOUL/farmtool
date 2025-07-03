'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase';
import dayjs from 'dayjs';

type BidItem = {
  bidNtceNm: string;
  cntrctNo: string;
  cntrctCn: string;
  bidNtceDt: string;
  representative: string;
  enterprise: string;
  bizType: string;
};

const bizTypeMap: Record<string, string> = {
  '01': '공사',
  '02': '물품',
  '03': '일반용역',
  '04': '기술용역',
};

export default function BidResultsPage() {
  const [items, setItems] = useState<BidItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYYMMDD'));
  const [selectedType, setSelectedType] = useState('');

  const fetchData = async () => {
    const q = query(
      collection(db, 'g2b_results'),
      where('bidNtceDt', '==', selectedDate),
      ...(selectedType ? [where('bizType', '==', selectedType)] : []),
      orderBy('cntrctNo')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data() as BidItem);
    setItems(data);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedType]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">나라장터 최종낙찰자 목록</h1>

      {/* 날짜 + 공고 종류 필터 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">날짜</label>
          <input
            type="date"
            value={dayjs(selectedDate).format('YYYY-MM-DD')}
            onChange={(e) =>
              setSelectedDate(dayjs(e.target.value).format('YYYYMMDD'))
            }
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">공고 종류</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">전체</option>
            <option value="01">공사</option>
            <option value="02">물품</option>
            <option value="03">일반용역</option>
            <option value="04">기술용역</option>
          </select>
        </div>
      </div>

      {/* 리스트 */}
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li
            key={i}
            className="border p-4 rounded shadow hover:bg-gray-100 cursor-pointer transition"
            onClick={() => {
                const query = encodeURIComponent(
                  `${item.representative ?? ''} ${item.enterprise ?? ''}`
                );
                window.open(`https://www.google.com/search?q=${query}`, '_blank');
              }}
          >
            <div className="font-semibold text-lg">{item.bidNtceNm}</div>
            <div className="text-sm text-gray-600">
              계약번호: {item.cntrctNo} | 공고종류:{' '}
              {bizTypeMap[item.bizType] || item.bizType}
            </div>
            <div className="mt-1">
              <span className="text-gray-700">
                🧑‍💼 {item.representative} | 🏢 {item.enterprise}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <div className="mt-6 text-gray-500 text-center">데이터가 없습니다.</div>
      )}
    </div>
  );
}
