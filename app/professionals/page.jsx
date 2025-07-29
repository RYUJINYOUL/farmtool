// app/con/page.jsx
"use client"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import React, { useState } from 'react' // useEffect, useRouter, useSearchParams는 이 파일에서 필요 없음
import ProList from "@/components/middle/professionals/ProList"
import ConOffer from "@/components/middle/professionals/ConOffer"
import { saram, regions, hierarchicalRegions } from '@/lib/constants';


const Page = ({ searchParams }) => {
  // 상태 변수들을 직접 관리
  const [showIndustryList, setShowIndustryList] = useState(false);
  const [showRegionList, setShowRegionList] = useState(false);
  const [showSubRegionList, setSubShowRegionList] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState("전체");
  const [selectedRegions, setSelectedRegions] = useState('전국');
  const [selectedSubRegions, setSelectedSubRegions] = useState('');
  const initialTabFromUrl = searchParams.tab || "account";
  const [pag, setPag] = useState(initialTabFromUrl)

  
  const hselectedRegion = hierarchicalRegions.find(region => region.name === selectedRegions) || { subRegions: [] };

  const handleIndustryClick = (name) => {
    setSelectedIndustries(name);
    setShowIndustryList(false);
  };
  
  const handleRegionClick = (region) => {
    setSelectedRegions(region);
    setSelectedSubRegions(''); // 시/도 변경 시 시/군/구 초기화
    setShowRegionList(false);
  };

  const handleRegionClick2 = (subRegion) => {
    setSelectedSubRegions(subRegion);
    setSubShowRegionList(false);
  };

  return (
    <div className='relative md:top-10 bg-gray-50 top-10'>
      <section className='flex justify-center items-center m-4'>
      <div className="md:w-[1100px] w-full lg:mt-10 pt-3.5">
        <Tabs value={pag} onValueChange={setPag} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">전문인력 구직</TabsTrigger>
          <TabsTrigger value="upload">전문인력 구인</TabsTrigger>
        </TabsList>

        <div className="flex md:flex-row flex-col gap-3 w-full">
          {/* 업종명 */}
          <div className="mb-1 flex-1 relative"> 
            <button
              type="button"
              onClick={() => setShowIndustryList(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="text-gray-900">
                {selectedIndustries === "전체" ? "전체" : selectedIndustries}
              </span>
              <span className="float-right text-gray-400">{showIndustryList ? '▲' : '▼'}</span>
            </button>
            {showIndustryList && (
              <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg absolute z-10 w-full]">
                <div className="flex flex-wrap gap-2">
                  {saram.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleIndustryClick(name)}
                      className={`px-3 py-1 rounded-md text-sm border transition-colors
                        ${selectedIndustries === name
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                        ${name === "전체" ? 'font-semibold' : ''}
                      `}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <button 
                  type="button" 
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline" 
                  onClick={() => setShowIndustryList(false)}
                >
                  닫기
                </button>
              </div>
            )}
          </div>

          {/* 지역 */}
          <div className="mb-1 flex-1 relative">
            <button
              type="button"
              onClick={() => setShowRegionList(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="text-gray-900">
              {selectedRegions === '전국' ? '전국' : selectedRegions}
              </span>
              <span className="float-right text-gray-400">{showRegionList ? '▲' : '▼'}</span>
            </button>
            {showRegionList && (
              <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg absolute z-10 w-full]">
                <div className="flex flex-wrap gap-1">
                {regions.map(region => {
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => handleRegionClick(region)}
                        className={`px-3 py-1 rounded-md text-sm border transition-colors
                          ${selectedRegions === region
                            ? 'bg-green-500 text-white border-green-500' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                          ${region === "전국" ? 'font-semibold' : ''}
                        `}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
                <button 
                  type="button" 
                  className="mt-3 text-sm text-green-600 hover:text-green-800 underline" 
                  onClick={() => setShowRegionList(false)}
                >
                  닫기
                </button>
              </div>
            )}
          </div>


          {/* 시군구 (Sub-Region) */}
          <div className="mb-1 flex-1 relative">
            <button
              type="button"
              onClick={() => setSubShowRegionList(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="text-gray-900">
              {selectedSubRegions || '시군구'}
              </span>
              <span className="float-right text-gray-400">{showSubRegionList ? '▲' : '▼'}</span>
            </button>
            {showSubRegionList && (
              <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg absolute z-10 w-full]">
                <div className="flex flex-wrap gap-1">
                {hselectedRegion.subRegions.length > 0 ? (
                  hselectedRegion.subRegions.map(subRegion => (
                      <button
                        key={subRegion}
                        type="button"
                        onClick={() => handleRegionClick2(subRegion)}
                        className={`px-3 py-1 rounded-md text-sm border transition-colors
                          ${selectedSubRegions === subRegion 
                            ? 'bg-green-500 text-white border-green-500' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                        `}
                      >
                        {subRegion}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500">선택된 지역에 대한 시군구가 없습니다.</p>
                  )}
                </div>
                <button 
                  type="button" 
                  className="mt-3 text-sm text-green-600 hover:text-green-800 underline" 
                  onClick={() => setSubShowRegionList(false)}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="account">
            {/* ProList 컴포넌트를 import 하여 props로 상태 전달 */}
            <ProList 
             selectedIndustries={selectedIndustries}
             selectedRegions={selectedRegions}
             selectedSubRegions={selectedSubRegions}
            />
        </TabsContent>


        <TabsContent value="upload">
           <ConOffer 
            selectedIndustries={selectedIndustries}
            selectedRegions={selectedRegions}
            selectedSubRegions={selectedSubRegions}
           />
        </TabsContent>


      </Tabs>
      </div>
      </section>
  </div>
  )
}

export default Page