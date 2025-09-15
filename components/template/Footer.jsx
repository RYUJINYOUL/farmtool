"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { usePathname } from 'next/navigation';
import {
  BrickWallFire,
  Tractor,
  Fence,
  Copyright,
  UserPen,
  Dock,
  Hammer,
  Home,
  ChevronDown,
  ChevronUp,
  LaptopMinimalCheck,
} from "lucide-react";

const Footer = () => {
  const pathname = usePathname();
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getActiveCategoryFromPath = (path) => {
    switch(path) {
      case '/': return '홈';
      case '/construction': return '건설업';
      case '/equipment': return '건설장비';
      case '/materials': return '건설자재';
      case '/professionals': return '전문인력';
      case '/permit': return '인허가';
      case '/nara': return '나라장터';
      case '/job': return '구인구직';
      case '/myinfo': return '내정보';
      default: return '홈';
    }
  };

  const categories = [
    { name: '홈', href: '/', icon: Home, color: 'text-gray-900' },
    { name: '건설업', href: '/construction', icon: BrickWallFire, color: 'text-pink-500' },
    { name: '건설장비', href: '/equipment', icon: Tractor, color: 'text-orange-500' },
    { name: '건설자재', href: '/materials', icon: Fence, color: 'text-blue-400' },
    { name: '전문인력', href: '/professionals', icon: Hammer, color: 'text-green-500' },
    { name: '인허가', href: '/permit', icon: Copyright, color: 'text-blue-500' },
    { name: '나라장터', href: '/nara', icon: LaptopMinimalCheck, color: 'text-red-400' },
    { name: '구인구직', href: '/job', icon: UserPen, color: 'text-red-500' },
    { name: '내정보', href: '/myinfo', icon: Dock, color: 'text-amber-500' },
  ];

  const companyInfo = [
    { title: '건설톡', value: '', isMain: true },
    { title: '대표자', value: '유준열' },
    { title: '전화번호', value: '1899-1651' },
    { title: '이메일', value: 'dalkomme@gmail.com' },
    { title: '주소', value: '경기도 화성시 동탄대로 706, 333호' },
    { title: '사업자정보', value: '338-30-00921' },
  ];

  useEffect(() => {
    setMounted(true);
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <section className="relative">
      {/* 푸터 정보 */}
      <div className='w-full flex flex-col justify-center items-center gap-3 mb-24'>
        <div className="w-full max-w-[1100px] px-4 pt-8 md:pt-12">
          {/* 기본 정보 */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">건설톡</span>
            <button 
              onClick={() => setShowAllInfo(!showAllInfo)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="text-xs text-gray-600">회사정보</span>
              {showAllInfo ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          </div>

          {/* 상세 정보 */}
          {showAllInfo && (
            <div className="py-5 space-y-3 animate-fadeIn bg-gray-50/50 mt-3 rounded-lg px-4">
              {companyInfo.slice(1).map((info) => (
                <div key={info.title} className="flex text-xs text-gray-600">
                  <span className="w-24 font-medium">{info.title}</span>
                  <span>{info.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 스티키 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200 z-50" style={{ height: mounted ? 'calc(var(--vh, 1vh) * 8)' : '64px' }}>
        <div className="max-w-[1100px] mx-auto h-full">
          {/* PC 네비게이션 */}
          <div className="hidden md:flex justify-around items-center h-full px-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link 
                  key={category.name}
                  href={category.href}
                  className={`flex flex-col items-center py-2 px-3 transition-all duration-200 relative group ${
                    getActiveCategoryFromPath(pathname) === category.name 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${category.color}`} />
                  <span className="text-sm">{category.name}</span>
                </Link>
              );
            })}
          </div>

          {/* 모바일 네비게이션 */}
             <div className="md:hidden h-full flex justify-center">
            <Swiper
              slidesPerView="auto"
              spaceBetween={16}
              className="h-full px-4"
              centeredSlides={false}
              slideToClickedSlide={true}
            >
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <SwiperSlide key={category.name} style={{ width: 'auto', height: '100%' }}>
                    <Link 
                      href={category.href}
                      className={`flex flex-col items-center justify-center h-full px-3 whitespace-nowrap transition-all duration-200 ${
                        getActiveCategoryFromPath(pathname) === category.name 
                        ? 'text-gray-900 font-semibold scale-105' 
                        : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-0.5 ${category.color}`} />
                      <span className="text-[10px]">{category.name}</span>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Footer;