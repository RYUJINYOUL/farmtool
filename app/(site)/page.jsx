"use client"
import React, {useState} from "react";
import MyInfo from "@/components/MyInfo"
import MainMenu from "@/components/MainMenu"
import Footer from '@/components/template/Footer';
import { FiSearch } from "react-icons/fi";
import { useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import ConUpload from '@/components/middle/construction/conUpload'
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';


export default function MyPage() {
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const { currentUser } = useSelector(state => state.user);
  const router = useRouter();

  function openCategory () {
    if (currentUser?.uid) {
      setIsUserProfileModalOpen(true)
    } else {
      router.push('/login')
    } 
  }
  

  return (
    <div className="bg-gray-50">
      <section className='flex justify-center items-center m-2 md:m-1 pt-1 md:pt-2'>
        <div className="md:w-[1100px] w-full relative">
          {/* 배경 그라데이션 효과 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl opacity-70" />
          
          <div className="relative bg-white/80 backdrop-blur-sm shadow-md rounded-3xl p-6 md:p-8 text-start border border-gray-100 z-10">
            <div className="space-y-2 md:mb-6 mb-4">
              <h1 className="md:text-3xl text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                건설 견적, 클릭 한 번에!
              </h1>
              <p className="text-gray-500 text-sm md:text-base">
                필요한 모든 건설 서비스를 한 곳에서 쉽고 빠르게
              </p>
            </div>

            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 px-4 py-3 border border-gray-100">
                <input
                  type="text"
                  onClick={() => openCategory()} 
                  placeholder="건설, 장비, 자재, 전문인력, 구직 요청하기"
                  className="flex-grow text-gray-800 placeholder-gray-400 focus:outline-none md:text-[18px] text-[13px]"
                />
                <Button
                  onClick={() => openCategory()} 
                  className="bg-gray-900 hover:bg-gray-800 rounded-full p-2.5 flex items-center justify-center ml-2 transition-colors duration-300"
                >
                  <FiSearch className="text-white text-xl" />
                </Button>
              </div>
            </div>

            <p className="mt-6 text-gray-600 text-[13px] md:text-base font-medium pl-1 flex items-center gap-2">
              <span className="text-gray-500">✨</span>
              정보를 입력하고, 여러 업체들의 응답을 받아보세요
            </p>

            <ConUpload
              isOpen={isUserProfileModalOpen} 
              onClose={() => setIsUserProfileModalOpen(false)} 
            />
          </div>
        </div>
      </section>

      {/* 정보 캐러셀 섹션 */}
      <section className='flex justify-center items-center m-2 md:m-1 pt-2 md:pt-4'>
        <div className="md:w-[1100px] w-full relative">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              bulletActiveClass: 'swiper-pagination-bullet-active bg-gray-800',
            }}
            loop={true}
            className="rounded-2xl overflow-hidden shadow-md border border-gray-100"
          >
            {/* 나라장터 입찰정보 */}
            <SwiperSlide>
              <div className="bg-white/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">나라장터 입찰정보</h3>
                    <p className="text-sm text-gray-600">전국의 최신 입찰 정보를 확인하세요</p>
                  </div>
                  <Button
                    onClick={() => router.push('/nara')}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4"
                  >
                    자세히 보기
                  </Button>
                </div>
              </div>
            </SwiperSlide>

            {/* 전국 인허가 정보 */}
            <SwiperSlide>
              <div className="bg-white/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">전국 인허가 정보</h3>
                    <p className="text-sm text-gray-600">실시간 건축 인허가 현황을 확인하세요</p>
                  </div>
                  <Button
                    onClick={() => router.push('/permit')}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4"
                  >
                    자세히 보기
                  </Button>
                </div>
              </div>
            </SwiperSlide>

            {/* 전국 건설업 정보 */}
            <SwiperSlide>
              <div className="bg-white/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">전국 건설업 정보</h3>
                    <p className="text-sm text-gray-600">건설업 등록 및 현황 정보를 확인하세요</p>
                  </div>
                  <Button
                    onClick={() => router.push('/construction')}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4"
                  >
                    자세히 보기
                  </Button>
                </div>
              </div>
            </SwiperSlide>

            {/* 건설장비 제휴업체 */}
            <SwiperSlide>
              <div className="bg-white/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">건설장비 제휴업체</h3>
                    <p className="text-sm text-gray-600">전국 건설장비 임대 업체를 찾아보세요</p>
                  </div>
                  <Button
                    onClick={() => router.push('/equipment')}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4"
                  >
                    자세히 보기
                  </Button>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      <section className='flex justify-center items-center m-2 md:m-1 pt-3 md:pt-6'>
        <div className="md:w-[1100px] w-full relative z-20">
          <MainMenu />
        </div>
      </section>
    </div>
  );
}