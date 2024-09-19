"use client"
import React from 'react'
import Category from './components/Category' 
import useUIState from '@/hooks/useUIState';



const page = async () => {
  const categoryList = [
    "조경수매물보기", "조경수매물등록", "조경수삽니다", "시설물질문", "조경공사요청", "파일업로드"
]

// eslint-disable-next-line react-hooks/rules-of-hooks
const { homeCategory, setHomeCategory } = useUIState();

  return (
    <div>
    <div className='min-h-[600px]'>
      <div className='mt-9'></div>
      <Category category={categoryList}/>
    </div>
    <div>
      {homeCategory}
    </div>
    </div>
  )
}

export default page
