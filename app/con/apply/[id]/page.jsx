"use client"
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import moment from 'moment';
import PostDetailWithQuotation from '@/components/template/Quotation';
import { doc, getDoc } from "firebase/firestore";
import PlayListCarousel4 from '@/components/PlayListCarousel4';
import { db } from '@/firebase'; // @/firebase에서 db 가져오기

const Page = (props) => {
  const { id } = props.params;
  const [postData, setPostData] = useState(null);
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
        const docRef = doc(db, 'conApply', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data(); // 단일 문서의 데이터

          // ✨ 여기에서 명시적으로 원하는 데이터 구조를 만듭니다 ✨
          const formattedMessage = {
            id: doc.id,
            address: data.address,
            imageDownloadUrls: data.imageDownloadUrls || [],
            SubCategories: data.SubCategories,
            favorites: data.favorites || [],
            createdDate: data.createdDate,
            constructionExperience: data.conApply_constructionExperience,
            document: data.conApply_documents,
            companyName: data.conApply_name,
            phoneNumber: data.conApply_phoneNumber,
            description: data.conApply_description,
            uid: data.uid || null, // 게시물을 생성할 때 저장한 사용자 UID
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
              
              <div className='lg:text-end text-center text-[14px]'>{message.document} | {message.SubCategories.join(', ')} | {timeFromNow(message.createdDate)} | {message.businessLicense} | {message.address} | {message.phoneNumber}
                </div>
            </div>
            
            <hr className="my-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
            <PlayListCarousel4
              playlistArray={message.imageDownloadUrls}
            />
            <div className='mt-10' />
            <div className='text-[15px] h-full text-start leading-7'>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.constructionExperience}</p>
            </div>
            <div className='text-[15px] h-full text-start leading-7'>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.description}</p>
            </div>
            <div className='mt-10' />
          </div>
        </section>
        <div className='bg-[#fafafa]' />
        <PostDetailWithQuotation
            id={id} // The post ID
            col="conApply" // The collection where your main posts are stored
            postAuthorUid={message.uid} // Crucial: The UID of the post's author
            postImageUrls={message.imageDownloadUrls} // Pass image URLs for deletion
            listBasePath={"/con"} // Pass the base path for navigation
          />

      <div className='h-[150px]' />
    </div>
    </div>
  );
};

export default Page;
