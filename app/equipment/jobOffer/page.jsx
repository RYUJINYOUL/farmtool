"use client";

import React, { useState } from 'react';
import DefaultTable2 from '@/components/ui/DefaultTable2'
import Image from 'next/image';
import moment from 'moment';
import { GeoPoint } from "firebase/firestore";
import EditUpload from "@/components/EditUpload"

const GrassPostPage = () => {
  const TABLE_HEAD = ["이미지", "글제목", "글쓴이", "작성일"];
  // eslint-disable-next-line no-unused-vars
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD'); // 사용되지 않아 주석 처리됨
  const [formState, setFormState] = useState({
    category: '',
    detail: '',
    phoneNumber: '',
    title: '',
    address: '',
    isNotice: false,
    TopCategories: '전체',
    SubCategories: ['전체'],

  });

   

  return (
    <div className='w-full h-full'>
      <DefaultTable2 props={[TABLE_HEAD]} />

     <EditUpload />
    </div>
    
  )
}

export default GrassPostPage;