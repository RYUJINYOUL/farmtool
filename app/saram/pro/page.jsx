"use client"
import React, { useEffect, useState } from 'react'
import moment from 'moment';
import { Card, Typography } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from 'react-redux';
import { GiSpeaker } from "react-icons/gi";
import { BsCardText } from "react-icons/bs";
import { getFirestore, collection, where, orderBy, onSnapshot, query} from "firebase/firestore";
import app from '../../../firebase';
import Image from "next/image";
import Link from 'next/link';



const page = (
  // {
  //   selectedIndustries,
  //   selectedRegions,
  //   selectedSubRegions
  // }
) => {
  const db2 = getFirestore(app);
  const [message, setMessages] = useState([]);
  const { push } = useRouter();
  const { currentUser } = useSelector(state => state.user)
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    // addMessagesListener(new Map(categoryList2).get(homeCategory), reg)
    setLoading(true);
    addMessagesListener()
    setLoading(false);
    return () => {
    }
  }, [])


  const addMessagesListener = async () => {

      const tweetsQuery = query(
          collection(db2, "contree"),
          orderBy("isNotice", "desc"),       // 공지사항이 먼저
          orderBy("createdDate", "desc")     // 최신순 정렬
       );

      await onSnapshot(tweetsQuery, (snapshot) => {
        const tweetList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            url: data.url,
            title: data.title,
            date: data.createdDate.toDate(),
            NumOfLikes: data.NumOfLikes,
            userKey: data.userKey,
            isNotice: data.isNotice ?? false,
          };
        });

      setMessages(tweetList);
    });
  };


  const onClickCard = ({ id }) => {     //url은 []
    push(`/qu/playlist?id=${id}`)
    // push(`/test/?name=${id}collection=${collection}`);
  };

 
  

  return (
    <div className='w-full h-full'>
        {/* 카드 리스트 */}
        {loading && message.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : message.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {message.map(({ title, name, isNotice, date, id, url }, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {title || '낙찰자명 없음'}
                  </h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">낙찰</span>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-500">사업자번호:</span>
                    <span className="font-medium">{"사업자번호" || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">대표자:</span>
                    <span className="font-medium">{name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">낙찰금액:</span>
                    <span className="font-semibold text-green-600">
                      {1000000 ? Number(1000000).toLocaleString() + '원' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">낙찰일자:</span>
                    <span className="font-medium">{timeFromNow(date)}</span>
                  </div>
                  {isNotice && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-gray-500 text-xs mb-1">주소:</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{"주소"}</div>
                    </div>
                  )}
                  {url && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-gray-500 text-xs mb-1">전화번호:</div>
                      <div className="text-xs text-gray-600">{"전화번호"}</div>
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
        
      </div>
  )
}

export default page
