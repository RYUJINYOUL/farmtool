"use client"
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import moment from 'moment';
import Comment from '@/components/template/comment';
import { doc, getDoc } from "firebase/firestore";
import PlayListCarousel4 from '@/components/PlayListCarousel4';
import { db } from '@/firebase'; // @/firebase에서 db 가져오기

const Page = (props) => {
  const { id } = props.params;
  const [message, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeFromNow = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return moment(timestamp.toDate()).format('YYYY.MM.DD');
    }
    return moment(timestamp).format('YYYY.MM.DD');
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadConData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'equipment', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data(); // 단일 문서의 데이터

          // ✨ 여기에서 명시적으로 원하는 데이터 구조를 만듭니다 ✨
          const formattedMessage = {
            id: docSnap.id, // 문서 ID
            address: data.address || '', // 필드가 없을 경우를 대비해 기본값 설정
            imageDownloadUrls: data.imageDownloadUrls || [], // 배열이 아닐 경우 빈 배열
            SubCategories: data.SubCategories || [], // 배열이 아닐 경우 빈 배열
            createdDate: data.createdDate ? data.createdDate.toDate() : null, // Timestamp 변환
            favorites: data.favorites || [], // 배열이 아닐 경우 빈 배열
            
            businessLicense: data.equipment_businessLicense,    //사업자등록번호
            constructionExperience: data.equipment_career,  //경력사항
            companyName: data.equipment_name || '',
            phoneNumber: data.equipment_phoneNumber,
            rentalRates : data.equipment_rentalRates,    //비용
            
            title: data.title || '', // Firebase 문서에 title 필드가 있다면
            description: data.description || '', // Firebase 문서에 description 필드가 있다면
            name: data.name || '', // Firebase 문서에 name 필드가 있다면
          };
          
          setMessages(formattedMessage); // 명시적으로 만든 객체로 상태 업데이트
        } else {
          setMessages(null);
          console.warn(`문서 ID ${id}를 찾을 수 없습니다.`);
        }
      } catch (e) {
        console.error("데이터 로딩 중 에러:", e);
        setMessages(null);
      } finally {
        setLoading(false);
      }
    };

    loadConData();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-20">데이터 로딩 중입니다...</div>;
  }

  if (!message) {
    return <div className="text-center mt-20">데이터를 찾을 수 없거나 올바르지 않은 접근입니다.</div>;
  }

  return (
    <div>
      <div className='lg:my-10 p-3.5 w-full'>
        <section className="flex gap-[50px] min-h-1/2 flex-col justify-center items-center">
          <div className='mt-10' />
          <div className='flex flex-col lg:w-[1100px] w-full'>
            <div className='flex md:flex-row flex-col md:justify-between items-start lg:w-[1100px] w-full'>
              <div className='lg:text-start font-semibold text-center text-[20px]'>{message.companyName}</div>
              
              <div className='lg:text-end text-center text-[14px]'>{timeFromNow(message.createdDate)}
                </div>
            </div>
            
            <hr className="my-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
            <PlayListCarousel4
              playlistArray={message.imageDownloadUrls}
            />
               <div className={`overflow-x-auto ${message.imageDownloadUrls.length === 0 ? "" : "pt-10" }`}>
                <table className="min-w-full text-sm text-left text-gray-700 border border-gray-200 rounded-lg">
                  <tbody>
                     <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 bg-gray-50 font-medium">건설장비료</th>
                      <td className="px-4 py-2">{Number(message.rentalRates).toLocaleString() || '-'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 bg-gray-50 font-medium">사업자등록번호</th>
                      <td className="px-4 py-2">{message.businessLicense || '-'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 bg-gray-50 font-medium">보유장비</th>
                      <td className="px-4 py-2">{(message.SubCategories || []).join(', ') || '-'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 bg-gray-50 font-medium">주소</th>
                      <td className="px-4 py-2">{message.address || '-'}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 bg-gray-50 font-medium">전화번호</th>
                      <td className="px-4 py-2"><a
                            href={`tel:${message.phoneNumber}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {message.phoneNumber || '-'}
                          </a>
                          </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            <div className='mt-10' />
            <div className='text-[15px] h-full text-start leading-7'>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.constructionExperience}</p>
            </div>
            <div className='mt-10' />
          </div>
        </section>
        <div className='bg-[#fafafa]' />
        <Comment id={id} col="equipment" path={`/equipment/registration/${id}`} urls={message.imageDownloadUrls} />
        
        <div className='h-[150px]' />
      </div>
    </div>
  );
};

export default Page;