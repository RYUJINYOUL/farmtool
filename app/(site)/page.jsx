'use client';

import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { Button } from "@/components/ui/button";
import { doc, getDoc, writeBatch, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import UseCaseCarousel from '@/components/UseCaseCarousel';



import CategoryUpload from '@/components/categoryUpload'

export default function Page({}) {
  const { currentUser } = useSelector((state) => state.user);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  // Dialog 상태
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false); // 명확성을 위해 'isOpen'에서 이름 변경

  
 
  const renderViewSiteButton = (type) => {
    const className = type === 'main'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-sky-500 hover:bg-sky-600';

    const label = type === 'main' ? '새로운 사이트 만들기' : '내 사이트 보기';

    if (currentUser?.uid) {
      return (
        <button
          onClick={() => setIsUserProfileModalOpen(true)} // 사용자 프로필 모달 열기
          className={`${className} text-white px-6 py-3.5 rounded-2xl text-[15px] transition-colors flex items-center justify-center`}
        >
          {label}
        </button>
      );
    } else {

    return (
      <Link
        href="/register"
        className={`${className} text-white px-6 py-3.5 rounded-2xl text-[15px] transition-colors flex items-center justify-center`}
      >
        {label}
      </Link>
    );
  }
};

function openCategory () {
  if (currentUser?.uid) {
    setIsUserProfileModalOpen(true)
  } else {
    router.push('/login')
  }  
}

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-black">
  //       <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
  //     </div>
  //   );
  // }

  return (
    <div className='pt-5'>
      <div className="flex flex-col items-center justify-center py-12 text-center mb-12">
        <h1 className="text-4xl font-bold text-black mb-4">건설톡</h1>
        <p className="text-lg text-black mb-10">나만의 특별한 한페이지를 만들어보세요</p>

        <div className="grid gap-3 w-full md:max-w-sm mx-auto mb-16">
          {renderViewSiteButton('main')}
          {renderViewSiteButton('sub')}
        </div>
        
        <Button
            onClick={() => openCategory()} // ★ 이렇게 수정하세요! ★
            className="fixed bottom-8 right-8 rounded-full w-16 h-16 text-3xl shadow-lg"
          >
            +
          </Button>

        <h2 className="md:hidden text-xl font-medium text-black mb-12 leading-relaxed">
          건설톡은 건설관련종사자들에게
          작지만 의미 있는 한페이지를 선물합니다.
        </h2>

        <h2 className="md:block hidden text-2xl font-medium text-black mb-12 leading-relaxed">
          건설톡은 건설관련종사자들에게<br />
          작지만 의미 있는 한페이지를 선물합니다.
        </h2>

        <UseCaseCarousel />
      </div>

      {/* UserProfileModal 컴포넌트 렌더링 */}
      <CategoryUpload
       isOpen={isUserProfileModalOpen} // 상태 변수 값 전달
       onClose={() => setIsUserProfileModalOpen(false)} // 닫기 함수 전달
      />
    </div>
  );
}