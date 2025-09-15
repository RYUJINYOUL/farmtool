"use client"
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import moment from 'moment';
import Comment from '@/components/middle/construction/comment';
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
        const docRef = doc(db, 'construction', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data(); // 단일 문서의 데이터

          // ✨ 여기에서 명시적으로 원하는 데이터 구조를 만듭니다 ✨
          const formattedMessage = {
            id: docSnap.id, // 문서 ID
            address: data.address || '', // 필드가 없을 경우를 대비해 기본값 설정

            companyName: data.construction_name || data.construction_companyName || '',
            businessLicense: data.construction_businessLicense || '',
            constructionExperience: data.construction_constructionExperience || '',
            phoneNumber: data.construction_phoneNumber || '',
            contactPerson: data.construction_contactPerson || '',

            imageDownloadUrls: data.imageDownloadUrls || [], // 배열이 아닐 경우 빈 배열
            createdDate: data.createdDate ? data.createdDate.toDate() : null, // Timestamp 변환
            SubCategories: data.SubCategories || [], // 배열이 아닐 경우 빈 배열
            favorites: data.favorites || [], // 배열이 아닐 경우 빈 배열
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
            <div className='flex md:flex-row flex-col md:justify-between items-start lg:w-[1100px] w-full mb-6'>
              <div className='space-y-1'>
                <h1 className='lg:text-start font-bold text-center text-2xl md:text-3xl text-gray-900'>{message.companyName}</h1>
                <p className='text-gray-500 text-sm md:text-base'>등록일: {timeFromNow(message.createdDate)}</p>
              </div>
            </div>
            
            <div className="h-px w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-8" />
            <PlayListCarousel4
              playlistArray={message.imageDownloadUrls}
            />
               <div className={`overflow-x-auto ${message.imageDownloadUrls.length === 0 ? "" : "pt-10" }`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 overflow-hidden">
                    <div className="grid grid-cols-3 p-4 bg-gray-50/50">
                      <dt className="col-span-1 font-medium text-gray-600">대표자</dt>
                      <dd className="col-span-2 text-gray-900">{message.contactPerson || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 p-4 bg-gray-50/50">
                      <dt className="col-span-1 font-medium text-gray-600">사업자등록번호</dt>
                      <dd className="col-span-2 text-gray-900">{message.businessLicense || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 p-4 bg-gray-50/50">
                      <dt className="col-span-1 font-medium text-gray-600">해당업종</dt>
                      <dd className="col-span-2 text-gray-900">{(message.SubCategories || []).join(', ') || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 p-4 bg-gray-50/50">
                      <dt className="col-span-1 font-medium text-gray-600">주소</dt>
                      <dd className="col-span-2 text-gray-900">{message.address || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 p-4 bg-gray-50/50 md:col-span-2">
                      <dt className="col-span-1 font-medium text-gray-600">연락처</dt>
                      <dd className="col-span-2">
                        <a
                          href={`tel:${message.phoneNumber}`}
                          className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                        >
                          {message.phoneNumber || '-'}
                        </a>
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            <div className='mt-10' />
            <div className='text-[15px] h-full text-start leading-7 dark:text-gray-900'>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.constructionExperience}</p>
            </div>
            <div className='mt-10' />
          </div>
        </section>
        <div className='bg-[#fafafa]' />
        <Comment id={id} col="construction" path={`/construction/registration/${id}`} urls={message.imageDownloadUrls} />
        
        <div className='h-[150px]' />
      </div>
    </div>
  );
};

export default Page;