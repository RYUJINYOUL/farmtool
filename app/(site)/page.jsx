"use client"
import React, {useState} from "react";
import MyInfo from "@/components/MyInfo"
import MainMenu from "@/components/MainMenu"
import Footer from '@/components/template/Footer';
import { FiSearch } from "react-icons/fi";
import { useSelector } from 'react-redux';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import ConUpload from '@/components/middle/construction/conUpload'


export default function MyPage() {
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const { currentUser } = useSelector(state => state.user);

  function openCategory () {
    if (currentUser?.uid) {
      setIsUserProfileModalOpen(true)
    } else {
      router.push('/login')
    } 
  }
  

  return (
    <div className="pt-10 md:-mt-12">
      <section className='flex justify-center items-center m-2 md:m-1 min-h-[calc(100vh-100px)]'>
        <div className="md:w-[1100px] w-full -mt-2 pt-6 md:pt-8 relative">
          {/* 배경 그라데이션 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-3xl opacity-50 -z-10" />
          
          <div className="relative bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl md:p-8 p-6 md:pt-12 pt-8 md:pb-12 pb-10 text-start border border-gray-100 z-10">
            <div className="space-y-2 mb-8">
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
                  className="flex-grow text-gray-800 placeholder-gray-400 focus:outline-none md:text-[18px] text-[15px]"
                />
                <Button
                  onClick={() => openCategory()} 
                  className="bg-black rounded-full p-2.5 flex items-center justify-center ml-2 hover:bg-gray-800 transition-colors duration-300"
                >
                  <FiSearch className="text-white text-xl" />
                </Button>
              </div>
            </div>

            <p className="mt-6 text-gray-600 text-sm md:text-base font-medium pl-1 flex items-center gap-2">
              <span className="text-blue-500">✨</span>
              정보를 입력하고, 여러 업체들의 응답을 받아보세요
            </p>

            <ConUpload
              isOpen={isUserProfileModalOpen} 
              onClose={() => setIsUserProfileModalOpen(false)} 
            />
          </div>

          <div className="mc:pt-8 pt-4 relative z-20">
            <MainMenu />
          </div>
        </div>
      </section>

    </div>
  );
}