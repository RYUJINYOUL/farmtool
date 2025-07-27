"use client"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import React, { useState } from 'react'
import Question from '@/components/ui/Question'
import { useRouter } from "next/navigation"
import Pro from "./pro/page"
import JobOffer from "./jobOffer/page"
import JobSearch from "./jobSearch/page"
import ConOffer from "@/components/ConOffer"
import { saram, regions, hierarchicalRegions } from '@/lib/constants';



const page = () => {
  const [showIndustryList, setShowIndustryList] = useState(false);
  const [showRegionList, setShowRegionList] = useState(false);
  const [showSubRegionList, setSubShowRegionList] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState(["전체"]);
  const [selectedRegions, setSelectedRegions] = useState('전국');
  const [selectedSubRegions, setSelectedSubRegions] = useState('');
  const hselectedRegion = hierarchicalRegions.find(region => region.name === selectedRegions) || { subRegions: [] }; // Ensure a default empty array if not found

  const handleIndustryClick = (name) => {
    setSelectedIndustries(name);
    setShowIndustryList(false)
  };
  

  const handleRegionClick = (region) => {
    setSelectedSubRegions('')
    setSelectedRegions(region)
    setShowRegionList(false)
    // Only show sub-region list if the selected region has sub-regions
    if (hierarchicalRegions.find(r => r.name === region)?.subRegions.length > 0) {
      setSubShowRegionList(true)
    } else {
      setSubShowRegionList(false)
    }
    };

    const handleRegionClick2 = (region) => {
      setSelectedSubRegions(region)
      setSubShowRegionList(false)
    };

   
  

  return (
    <div className='relative md:top-10 top-10'>
      <section className='flex justify-center items-center m-4'>
      <div className="md:w-[1100px] w-full lg:mt-10 pt-3.5">
        <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">전문인력</TabsTrigger>
          <TabsTrigger value="upload">구인</TabsTrigger>
          <TabsTrigger value="job">구직</TabsTrigger>
        </TabsList>

        <div className="flex md:flex-row flex-col gap-3 w-full">
          {/* 업종명 */}
          <div className="mb-1 flex-1"> {/* Use flex-1 to make them take equal width within the flex container */}
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
              <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg absolute z-10 w-full md:w-[calc(33.33%-0.5rem)]"> {/* Added absolute positioning and specific width for dropdown */}
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
          <div className="mb-1 flex-1"> {/* Use flex-1 */}
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
              <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg absolute z-10 w-full md:w-[calc(33.33%-0.5rem)]"> {/* Added absolute positioning and specific width for dropdown */}
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
          <div className="mb-1 flex-1"> {/* Use flex-1 */}
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
              <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg absolute z-10 w-full md:w-[calc(33.33%-0.5rem)]"> {/* Added absolute positioning and specific width for dropdown */}
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
            <Pro />
        </TabsContent>


        <TabsContent value="upload">
           <JobOffer />
        </TabsContent>


        <TabsContent value="job">
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

export default page