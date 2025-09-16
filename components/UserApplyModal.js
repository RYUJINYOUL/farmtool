'use client';

import { Dialog } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
// 기존 import 유지 및 KOREAN_TO_ENGLISH_CATEGORIES 추가
import { category, subCategory, KOREAN_TO_ENGLISH_APPLY } from '@/lib/constants';
// import Professional from './topCategory/professional' // 이 줄은 제거합니다.
import ImageUpload from '@/components/ImageUpload';
import CategoryApplyField from './CategoryApplyField'; // 새로 만든 컴포넌트 임포트

export default function UserApplyModal({
        isOpen,
        onClose,
        formState,
        setFormState,
        handleInputChange,
        error,
        handleSaveUsernameAndProfile,
        setIsAddrModalOpen,
        showRegionList,
        setShowRegionList,
        subShowRegionList,
        setSubShowRegionList,
        handleRegionClick,
        handleRegionClick2,
        handleSubRegionRemove,
        handleDrag,
        handleDrop,
        fileInputRef,
        dragActive,
        imageFiles,
        removeImage,
        moveImage,
        handleFileSelect,
        setImageFiles,
        setDragActive
}) {

  // 현재 선택된 서브 카테고리 데이터 (Page.js에서 이동)
  const hselectedRegion = subCategory.find(region => region.name === formState.TopCategories) || { subRegions: [] };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <Dialog.Panel className="bg-gray-100 p-8 rounded-2xl shadow-lg z-50 h-screen w-full relative overflow-y-auto max-h-[90vh]">
        <div className='pb-5'>
        <div className="absolute top-4 reft-4 text-black-400 text-[18px]">
          신청하기
          </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
          aria-label="닫기"
        >
          &times;
        </button>
       </div>

        <ImageUpload 
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          handleSaveUsernameAndProfile={handleSaveUsernameAndProfile}
          fileInputRef={fileInputRef}
          dragActive={dragActive}
          imageFiles={imageFiles}
          handleFileSelect={handleFileSelect}
          removeImage={removeImage}
          moveImage={moveImage}
          setImageFiles={setImageFiles}
          setDragActive={setDragActive}
      />

        <div className="flex flex-col gap-3 w-full">

          {/* 대분류 (카테고리) 선택 */}
          <div className="mb-1 flex-1 relative">
            <button
              type="button"
              onClick={() => setShowRegionList(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="text-gray-900">
              {formState.TopCategories === '전체' ? '카테고리(대분류) 선택' : formState.TopCategories}
              </span>
              <span className="float-right text-gray-400">{showRegionList ? '▲' : '▼'}</span>
            </button>
            {showRegionList && (
              <div className="absolute left-0 top-full mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg z-10 w-full">
                <div className="flex flex-wrap gap-2">
                    {category.map(region => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => handleRegionClick(region)}
                        className={`px-4 py-1 rounded-md text-sm border transition-colors
                          ${formState.TopCategories === region
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                          ${region === "전체" ? 'font-semibold' : ''}
                          min-w-[80px]
                        `}
                      >
                        {region}
                      </button>
                    ))}
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

          {/* 소분류 (업종) 선택 */}
          <div className="mb-1 flex-1 relative">
            <button
              type="button"
              onClick={() => setSubShowRegionList(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="text-gray-900">
              {formState.SubCategories.includes("전체") && formState.SubCategories.length === 1
                ? "카테고리(소분류) 선택"
                : formState.SubCategories.filter(name => name !== "전체").join(', ') || "카테고리(소분류) 선택"
              }
              </span>
              <span className="float-right text-gray-400">{subShowRegionList ? '▲' : '▼'}</span>
            </button>
            {subShowRegionList && (
              <div className="absolute left-0 top-full mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg z-10 w-full">
                <div className="flex flex-wrap gap-1">
                {/* "전체" 옵션 */}
                <button
                  key="전체"
                  type="button"
                  onClick={() => handleRegionClick2("전체")}
                  className={`px-3 py-1 rounded-md text-sm border transition-colors
                    ${formState.SubCategories.includes("전체")
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                    font-semibold
                  `}
                >
                  전체
                </button>
                {hselectedRegion.subRegions.length > 0 ? (
                  hselectedRegion.subRegions.map(subRegion => (
                      <button
                        key={subRegion}
                        type="button"
                        onClick={() => handleRegionClick2(subRegion)}
                        className={`px-3 py-1 rounded-md text-sm border transition-colors
                          ${formState.SubCategories.includes(subRegion)
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                        `}
                      >
                        {subRegion}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500">위 카테고리(대분류)를 먼저 설정하세요.</p>
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

          {/* 주소 검색 입력 필드 및 버튼 */}
          <div className="items-center">
              <Input
                id="address"
                value={formState.address}
                onChange={handleInputChange}
                onClick={() => {
                  setFormState(prev => ({ ...prev, address: '' })); // formState.address 초기화
                  setIsAddrModalOpen(true); // 주소 모달 열기
                }}
                placeholder="주소, 건물명 입력"
                className="col-span-2"
              />
          </div>



          <CategoryApplyField
            TopCategory={formState.TopCategories} 
            formState={formState}
            handleInputChange={handleInputChange}
            error={error}
          />


          <Button
            onClick={handleSaveUsernameAndProfile}
            className="mt-4 bg-black hover:bg-black-700 text-white py-2 rounded-lg text-lg font-semibold w-full"
          >
            신청하기
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}