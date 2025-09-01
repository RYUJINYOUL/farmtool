"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
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
  const [activeCategory, setActiveCategory] = useState('홈');
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [mounted, setMounted] = useState(false);

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
        <div className="w-full max-w-[1100px] px-4">
          {/* 기본 정보 */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-900">건설톡</span>
            <button 
              onClick={() => setShowAllInfo(!showAllInfo)}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <span className="text-xs mr-1">회사정보</span>
              {showAllInfo ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 상세 정보 */}
          {showAllInfo && (
            <div className="py-4 space-y-2 animate-fadeIn">
              {companyInfo.slice(1).map((info) => (
                <div key={info.title} className="flex text-xs text-gray-500">
                  <span className="w-20">{info.title}</span>
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
                  className={`flex flex-col items-center py-2 px-3 transition-colors duration-200 hover:text-blue-500 ${
                    activeCategory === category.name 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-600'
                  }`}
                  onClick={() => setActiveCategory(category.name)}
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
                      className={`flex flex-col items-center justify-center h-full px-3 whitespace-nowrap transition-colors duration-200 ${
                        activeCategory === category.name 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-600'
                      }`}
                      onClick={() => setActiveCategory(category.name)}
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