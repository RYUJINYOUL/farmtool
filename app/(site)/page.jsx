"use client"
import React from 'react'
import useUIState from '@/hooks/useUIState';
import { dummyPlaylistArray, getPlaylistById } from "@/lib/dummyData";
import AuthLayout from '@/components/AuthLayout.jsx';





const page = async () => {

  
  const categoryList = [
    "조경수매물보기", "조경수매물등록", "조경수삽니다", "시설물질문", "조경공사요청", "파일업로드"
]
  const dummyPlaylistArray1 = [...dummyPlaylistArray];
  const dummyPlaylistArray2 = [...dummyPlaylistArray];
  const dummyPlaylistArray3 = [...dummyPlaylistArray];
  const dummyPlaylistArray4 = [...dummyPlaylistArray];

// eslint-disable-next-line react-hooks/rules-of-hooks
const { homeCategory, setHomeCategory } = useUIState();

  return (
    <AuthLayout />
  )
}

export default page
