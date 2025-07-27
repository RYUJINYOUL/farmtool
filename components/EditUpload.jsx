"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { db } from '@/firebase';
import { getDoc, updateDoc, query, doc, serverTimestamp } from 'firebase/firestore';
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

const EditUpload = ({ isOpen, col, id, onClose }) => {
  const { user, loading } = useAuth();
  const [grassList, setGrassList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();
  // eslint-disable-next-line no-unused-vars
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD'); // 사용되지 않아 주석 처리됨
  const [formState, setFormState] = useState({
    category: '',
    detail: '',
    phoneNumber: '',
    title: '',
    address: '',
    isNotice: false,
    TopCategories: '전체',
    SubCategories: ['전체'],
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
        const docRef = doc(db, col, id); // 'col'과 'id'를 사용하여 문서 참조 생성
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // 가져온 데이터를 formState에 채웁니다.
          // Firestore에서 불러온 데이터를 초기 상태로 설정
          setFormState({
            category: data.category || '',
            detail: data.detail || '',
            phoneNumber: data.phoneNumber || '',
            title: data.title || '',
            address: data.address || '',
            isNotice: data.isNotice || false,
            TopCategories: data.TopCategories || '전체',
            // SubCategories는 배열임을 확인하고, 없으면 기본값으로 ['전체']
            SubCategories: Array.isArray(data.SubCategories) ? data.SubCategories : ['전체'], 
            existingImageUrls: Array.isArray(data.imageDownloadUrls) ? data.imageDownloadUrls : [],
            geoFirePoint: data.geoFirePoint || null, // 지리 정보도 불러옵니다.
          });
          // 기존 이미지를 imageFiles 상태에도 미리보기용으로 추가 (Blob 형태로 변환 필요)
          // 실제 이미지 파일이 아니므로, 미리보기만을 위해 URL을 직접 사용합니다.
          // 새 이미지가 추가될 때만 imageFiles에 넣고, 기존 이미지는 existingImageUrls로 관리하는 것이 더 좋습니다.
          // 여기서는 단순히 기존 URL을 보여주는 것으로 충분합니다.
        } else {
          console.log("해당 문서가 존재하지 않습니다!");
          // 문서가 없을 경우 처리 (예: 404 페이지로 리디렉션, 사용자에게 메시지 표시)
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

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= imageFiles.length) return;
    
    const newImages = [...imageFiles];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImageFiles(newImages);
  };


  const removeExistingImage = (indexToRemove) => {
    setFormState(prev => ({
      ...prev,
      existingImageUrls: prev.existingImageUrls.filter((_, idx) => idx !== indexToRemove)
    }));
  };


    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!formState.title || !formState.TopCategories || !formState.address) {
      alert('제목, 대분류, 주소는 필수 입력 항목입니다.');
      return;
    }

    setIsUploading(true);
    let newImageUrls = [];

    try {
      // 새로 추가된 이미지 파일들 업로드
      if (imageFiles.length > 0) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };

        for (const file of imageFiles) {
          const compressedFile = await imageCompression(file, options);
          const url = await uploadGrassImage(compressedFile, user.uid);
          newImageUrls.push(url);
        }
      }

      // 기존 이미지 URL과 새로 업로드된 이미지 URL을 합칩니다.
      const finalImageUrls = [...formState.existingImageUrls, ...newImageUrls];

      const docDataToUpdate = {
        ...formState,
        imageDownloadUrls: finalImageUrls, // 최종 이미지 URL 배열
        // createdDate는 수정 시 변경하지 않는 것이 일반적입니다.
        // serverTimestamp()를 사용하면 수정 시간을 기록할 수 있습니다.
        updatedDate: serverTimestamp(), // 수정 시간 기록
      };

      // geoFirePoint가 유효한 GeoPoint 객체인지 확인
      if (formState.geoFirePoint && formState.geoFirePoint.geopoint) {
        docDataToUpdate.geoFirePoint = {
          geopoint: new GeoPoint(
            formState.geoFirePoint.geopoint.latitude,
            formState.geoFirePoint.geopoint.longitude
          ),
          geohash: formState.geoFirePoint.geohash,
        };
      } else {
         // geoFirePoint가 없거나 유효하지 않으면 삭제하거나 null로 설정 (필요에 따라)
         delete docDataToUpdate.geoFirePoint; 
      }
      
      // 사용자 키, 이메일, 이름은 수정 시 변경하지 않습니다.
      delete docDataToUpdate.userKey;
      delete docDataToUpdate.email;
      delete docDataToUpdate.name;
      delete docDataToUpdate.confirmed; // 확정 여부 등은 별도 로직으로 관리할 수 있습니다.
      delete docDataToUpdate.numOfLikes; // 좋아요 수도 별도 관리

      // Firestore 문서 업데이트
      const docRef = doc(db, col, id);
      await updateDoc(docRef, docDataToUpdate);

      alert('게시물이 성공적으로 수정되었습니다!');
      // 수정 완료 후 모달 닫기
      onClose(); 
      // 필요하다면 페이지 리로드 또는 라우터 푸시
      // router.push('/grass'); 

    } catch (error) {
      console.error("게시물 수정 중 오류 발생: ", error);
      alert('게시물 수정 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };
  

  return (
    <div className='w-full h-full'>
      {/* + 버튼을 Dialog 바깥으로 이동시킵니다. */}
      {/* <Button 
        onClick={handleOpenDialog} // onClick으로 handleOpenDialog 호출
        className="fixed bottom-8 right-8 rounded-full w-16 h-16 text-3xl shadow-lg z-50" // z-index 추가
      >
        +
      </Button> */}

      {/* Dialog는 모달이 열렸을 때만 화면에 나타나야 합니다. */}
      <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* 모달 뒷배경 */}
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

        {/* Dialog.Panel은 모달의 실제 콘텐츠를 포함합니다. */}
        <Dialog.Panel className="bg-white p-6 rounded-lg shadow-xl w-full max-w-[600px] flex flex-col max-h-[90vh] relative">
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
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              width={100}
                              height={100}
                              className="rounded object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
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
                <Label htmlFor="title" className="text-right">제목</Label>
                <Input id="title" value={formState.title} onChange={handleInputChange} className="col-span-3" />
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
                <Label htmlFor="category" className="text-right">카테고리</Label>
                <Input id="category" value={formState.category} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="detail" className="text-right">상세 내용</Label>
                <textarea id="detail" value={formState.detail} onChange={handleInputChange} className="col-span-3 border rounded p-2 min-h-[60px] resize-y" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">연락처</Label>
                <Input id="phoneNumber" value={formState.phoneNumber} onChange={handleInputChange} className="col-span-3" />
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
              {isUploading ? '저장 중...' : '저장하기'}
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

export default EditUpload;