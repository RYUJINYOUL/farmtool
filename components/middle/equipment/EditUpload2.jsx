"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { db } from '@/firebase';
import { getDoc, updateDoc, query, doc, serverTimestamp, arrayRemove } from 'firebase/firestore';
import useAuth from '@/hooks/useAuth';
import { uploadGrassImage } from '@/hooks/useUploadImage';
import imageCompression from 'browser-image-compression';
import moment from 'moment';
import { Button } from "@/components/ui/button";
import AddressSearchModal from '@/components/AddressSearchModal';
import { Dialog } from '@headlessui/react'; 
import { category, subCategory, KOREAN_TO_ENGLISH_APPLY } from '@/lib/constants';
import { useCategorySelection } from '@/hooks/useCategorySelection';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { GeoPoint } from "firebase/firestore";
import { getStorage, ref, deleteObject } from 'firebase/storage';

const EditUpload2 = ({ isOpen, col, id, onClose }) => {
  const { user, loading } = useAuth();
  const [grassList, setGrassList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD'); 
  const [formState, setFormState] = useState({
    phoneNumber: '',
    address: '',
    isNotice: false,
    TopCategories: '전체',
    SubCategories: ['전체'],

    equipment_businessLicense: '', 
    equipment_career: '',             
    equipment_name: '',          
    equipment_phoneNumber: '',
    equipment_rentalRates: ''             
  });

   const [isLoadingPost, setIsLoadingPost] = useState(true);

   const {
      addrList, locationError, isAddrModalOpen, isLocationLoading,
      setAddrList, setLocationError, setIsAddrModalOpen, setIsLocationLoading,
      addrs, handleCurrentLocationSearch, handleSelectAddr
    } = useAddressSearch(formState, setFormState); 


  const {
      showRegionList, setShowRegionList, subShowRegionList, setSubShowRegionList,
      handleRegionClick, handleRegionClick2, handleSubRegionRemove,
    } = useCategorySelection(formState, setFormState);
    
  const hselectedRegion = subCategory.find(region => region.name === formState.TopCategories) || { subRegions: [] };    


   useEffect(() => {
    if (!col || !id) {
      console.warn("컬렉션 또는 문서 ID가 유효하지 않습니다:", { col, id });
      setIsLoadingPost(false);
      return;
    }

    const fetchPostData = async () => {
      setIsLoadingPost(true);
      try {
        const docRef = doc(db, col, id); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
      
          setFormState({
            equipment_businessLicense: data.equipment_businessLicense,    //사업자등록번호
            equipment_career: data.equipment_career,  //경력사항
            equipment_name: data.equipment_name || '',
            equipment_phoneNumber: data.equipment_phoneNumber,
            equipment_rentalRates : data.equipment_rentalRates,    //비용


            address: data.address || '',
            isNotice: data.isNotice || false,
            TopCategories: data.TopCategories || '전체',
            SubCategories: Array.isArray(data.SubCategories) ? data.SubCategories : ['전체'], 
            geoFirePoint: data.geoFirePoint || null, 
          });
          
         if (Array.isArray(data.imageDownloadUrls)) {
          setImageFiles([...data.imageDownloadUrls]);
        }

        } else {
          console.log("해당 문서가 존재하지 않습니다!");
        }
      } catch (error) {
        console.error("게시물 데이터를 가져오는 중 오류 발생:", error);
      } finally {
        setIsLoadingPost(false);
      }
    };
    fetchPostData();
  }, [col, id]); // col과 id가 변경될 때마다 이펙트를 다시 실행합니다.

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };


  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length + newFiles.length > 5) {
        alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length + newFiles.length > 5) {
        alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = async (indexToRemove) => {
    const removedItem = imageFiles[indexToRemove];
    setImageFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (typeof removedItem === 'string') {
        try {
            const url = new URL(removedItem);
            const imagePath = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
            const storageRef = ref(getStorage(), imagePath);

            await deleteObject(storageRef);

            if (col && id) {
                const docRef = doc(db, col, id);
                const docSnap = await getDoc(docRef); // Firestore 문서 존재 여부 다시 확인
                if (docSnap.exists()) {
                    await updateDoc(docRef, {
                        imageDownloadUrls: arrayRemove(removedItem), // 해당 URL만 배열에서 제거
                        updatedDate: serverTimestamp(), // 문서 수정 시간 업데이트
                    });
                } else {
                    alert('Firestore에서 해당 게시물을 찾을 수 없습니다. (콘솔 확인)');
                }
            } 
        } catch (error) {
            if (error.code) {
                console.error("Firebase Error Code:", error.code);
                console.error("Firebase Error Message:", error.message);
            }
            alert('이미지 삭제 중 오류가 발생했습니다. 다시 시도해주세요. (자세한 내용은 콘솔을 확인하세요)');
        }
    }
      
    if (typeof removedItem === 'string') { // 제거된 항목이 URL이었다면
        setFormState(prev => ({
            ...prev,
            // existingImageUrls: prev.existingImageUrls.filter(url => url !== removedItem)
        }));
    }
};

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= imageFiles.length) return;
    
    const newImages = [...imageFiles];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImageFiles(newImages);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!formState.equipment_name || !formState.TopCategories || !formState.address) {
      alert('제목, 대분류, 주소는 필수 입력 항목입니다.');
      return;
    }

    setIsUploading(true);
    let newUploadedImageUrls = []; 

    try {
        // imageFiles 배열에서 File 객체(즉, 새로 선택된 이미지)만 필터링하여 업로드
        const filesToUpload = imageFiles.filter(item => typeof item !== 'string');

        if (filesToUpload.length > 0) {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };

            for (const file of filesToUpload) {
                const compressedFile = await imageCompression(file, options);
                const url = await uploadGrassImage(compressedFile, user.uid, col);
                newUploadedImageUrls.push(url);
            }
        }

        const finalImageUrls = [
            ...(imageFiles.filter(item => typeof item === 'string')), 
            ...newUploadedImageUrls 
        ];

        const docDataToUpdate = {
            ...formState,
            imageDownloadUrls: finalImageUrls, 
            updatedDate: serverTimestamp(),
        };


      if (formState.geoFirePoint && formState.geoFirePoint.geopoint) {
        docDataToUpdate.geoFirePoint = {
          geopoint: new GeoPoint(
            formState.geoFirePoint.geopoint.latitude,
            formState.geoFirePoint.geopoint.longitude
          ),
          geohash: formState.geoFirePoint.geohash,
        };
      } else {
         delete docDataToUpdate.geoFirePoint; 
      }
      
      delete docDataToUpdate.userKey;
      delete docDataToUpdate.email;
      delete docDataToUpdate.name;
      delete docDataToUpdate.confirmed; 
      delete docDataToUpdate.numOfLikes; 

      const docRef = doc(db, col, id);
      await updateDoc(docRef, docDataToUpdate);

      alert('게시물이 성공적으로 수정되었습니다!');
      onClose(); 

    } catch (error) {
      alert('게시물 수정 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };
  

  return (
    <div className='w-full h-full'>
      <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* 모달 뒷배경 */}
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

        {/* Dialog.Panel은 모달의 실제 콘텐츠를 포함합니다. */}
        <Dialog.Panel className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-[600px] flex flex-col max-h-[90vh] relative">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl z-10" // z-index 추가
            aria-label="닫기"
          >
            &times;
          </button>

          {/* DialogHeader 역할을 하는 부분 */}
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">수정 게시판</h3>
            <p className="text-sm text-gray-500">아래 폼을 작성하여 새로운 정보를 등록하세요.</p>
          </div>
          
          {/* Apply overflow-y-auto to the form or a wrapper around the grid */}
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto py-4 pr-2"> {/* Added flex-grow and overflow-y-auto */}
            <div className="grid gap-4"> {/* py-4는 이미 form에 있으므로 제거 */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">이미지</Label>
                <div className="col-span-3">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="text-gray-500">
                      <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
                      <p className="text-sm">여러 이미지 선택 가능</p>
                    </div>
                  </div>
                  
                  {imageFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">선택된 이미지 ({imageFiles.length}개)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              width={100}
                              height={100}
                              className="rounded object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                            
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, index - 1)}
                                  disabled={index === 0}
                                  className="bg-white/80 text-black rounded-full w-6 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, index + 1)}
                                  disabled={index === imageFiles.length - 1}
                                  className="bg-white/80 text-black rounded-full w-6 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
               {/* 대분류 (카테고리) 선택 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="TopCategories" className="text-right">대분류</Label>
                   <div className="col-span-3 relative">
                          <button
                            type="button"
                            onClick={() => setShowRegionList(v => !v)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 col-span-3"
                          >
                            <span className="text-gray-900">
                            {formState.TopCategories === '전체' ? '카테고리(대분류) 선택' : formState.TopCategories}
                            </span>
                            <span className="float-right text-gray-400">{showRegionList ? '▲' : '▼'}</span>
                          </button>
                          {showRegionList && (
                            <div className="col-span-4 left-0 top-full mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg z-10 w-full">
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
                     </div>


              {/* 소분류 (업종) 선택 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="TopCategories" className="text-right">소분류</Label>
                   <div className="col-span-3 relative">
            <button
              type="button"
              onClick={() => setSubShowRegionList(v => !v)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 col-span-3"
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
              <div className="col-span-4 left-0 top-full mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto shadow-lg z-10 w-full">
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
         </div>    



                     

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equipment_name" className="text-right">이름</Label>
                <Input id="equipment_name" value={formState.equipment_name} onChange={handleInputChange} className="col-span-3" />
              </div>
              
              
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">주소</Label>
                  <Input
                id="address"
                value={formState.address}
                onChange={handleInputChange}
                onClick={() => {
                  setFormState(prev => ({ ...prev, address: '' })); // formState.address 초기화
                  setIsAddrModalOpen(true); // 주소 모달 열기
                }}
                placeholder="주소, 건물명 입력"
                className="col-span-3"
              />
               </div>
             
             
              

              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equipment_rentalRates" className="text-right">건설장비료</Label>
                <Input id="equipment_rentalRates" value={formState.equipment_rentalRates} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equipment_businessLicense" className="text-right">사업자등록번호</Label>
                <Input id="equipment_businessLicense" value={formState.equipment_businessLicense} onChange={handleInputChange} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equipment_phoneNumber" className="text-right">전화번호</Label>
                <Input id="equipment_phoneNumber" value={formState.equipment_phoneNumber} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equipment_career" className="text-right">경력사항</Label>
                <textarea id="equipment_career" value={formState.equipment_career} onChange={handleInputChange} className="col-span-3 border rounded p-2 min-h-[60px] resize-y" required />
              </div>
              {(user?.uid === 'PkVnwSuEg1WE071zAZDgxuVr2ro1' || user?.uid === 'anotherAdminUidHere') && ( // 두 번째 UID도 올바르게 확인되도록 수정
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isNotice" className="text-left">공지사항</Label>
                  <Input id="isNotice" type="checkbox" checked={formState.isNotice} onChange={handleInputChange} className="" />
                </div>
              )}
            </div>
            {/* Added a div for padding to ensure content doesn't get cut off by scrollbar */}
            <div className="h-4" /> 
          </form>
          {/* DialogFooter 역할을 하는 부분 */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button type="submit" disabled={isUploading} onClick={handleSubmit}> {/* 폼 제출 버튼에 onClick 추가 */}
              {isUploading ? '수정 중...' : '수정하기'}
            </Button>
          </div>
        </Dialog.Panel >
      </Dialog>


       <AddressSearchModal        
              isAddrModalOpen={isAddrModalOpen}
              setIsAddrModalOpen={setIsAddrModalOpen}
              addrList={addrList}
              locationError={locationError}
              isLocationLoading={isLocationLoading}
              formState={formState} // AddressSearchModal이 내부에서 자체 상태를 사용하므로 이 프롭은 제거할 수 있음
              handleInputChange={handleInputChange} // 이 프롭도 제거 가능 (모달 내부에서 직접 사용하지 않음)
              addrs={addrs}
              handleCurrentLocationSearch={handleCurrentLocationSearch}
              handleSelectAddr={handleSelectAddr}
            />
    </div>
    
  )
}

export default EditUpload2;