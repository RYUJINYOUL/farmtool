"use client"
import React, { useEffect, useState } from 'react'
import Image from "next/image";
import { useParams } from 'next/navigation';
import moment from 'moment';

import Comment from '@/components/ui/comment'
import { getFirestore, collection, onSnapshot, doc } from "firebase/firestore";
import app from '@/firebase';
import PlayListCarousel4 from '@/components/ui/PlayListCarousel4.tsx';

const Page = () => {
  const params = useParams();
  const { id } = params;
  const db2 = getFirestore(app);
  const [message, setMessages] = useState(null);
  const timeFromNow = (timestamp) => moment(timestamp).format('YYYY.MM.DD');

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(collection(db2, "contree"), id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages({
          ...data,
          date: data.createdDate.toDate(),
        });
      }
    });
    return () => unsubscribe();
  }, [id]);

  if (!message) return <div className="text-center mt-20">ㅇㄹㅇㄹㄴㄹㅇㄴㄹ로딩 중...</div>;

  return (
    <div>
      <div className='lg:my-10 p-3.5 w-full'>
        <section className="flex gap-[50px] min-h-1/2 flex-col justify-center items-center">
          <div className='mt-10' />
          <div className='flex flex-col lg:w-[1100px] w-full'>
            <div className='flex md:flex-row flex-col md:justify-between items-start lg:w-[1100px] w-full'>
              <div className='lg:text-start font-semibold text-center text-[20px]'>{message.title}</div>
              <div className='lg:text-end text-center text-[14px]'>{message.name} | {timeFromNow(message.date)}</div>
            </div>
        
            <hr className="my-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
                 <PlayListCarousel4
                playlistArray={message.url}
              />
            <div className='mt-10' />
            <div className='text-[15px] h-full text-start leading-7'>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.description}</p>
              </div>
            <div className='mt-10' />
          </div>
        </section>
        <div className='bg-[#fafafa]' />
        <Comment id={id} col="contree" path="/con/tree" urls={message.url} />
      
        <div className='h-[150px]' />
      </div>
      {/* <Footer /> */}
    </div>
  )
}

export default Page;
