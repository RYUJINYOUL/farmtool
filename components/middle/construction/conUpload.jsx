'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { Button } from "@/components/ui/button";
import { doc, getDoc, writeBatch, collection, serverTimestamp, GeoPoint, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import UseCaseCarousel from '@/components/UseCaseCarousel'; // 이 컴포넌트는 사용되지 않는 것 같지만, 코드에 있으므로 유지합니다.
import { saveFcmToken } from "@/lib/fcm";

// ★ 새로 만든 커스텀 훅 임포트 ★
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { useCategorySelection } from '@/hooks/useCategorySelection';
import useImageUpload from '@/hooks/useImageUpload';

// 새로 만든 컴포넌트 임포트
import UserApplyModal from '@/components/UserApplyModal';
import AddressSearchModal from '@/components/AddressSearchModal';
import imageCompression from 'browser-image-compression';
import { uploadGrassImage } from '@/hooks/useUploadImage';
import { KOREAN_TO_ENGLISH_APPLY, CATEGORY_APPLY_FIELDS, CATEGORY_LINK } from '@/lib/constants';

// 데이터 클리닝 함수 (변화 없음)
const cleanAndConvertToNull = (data) => {
  const cleanedData = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof GeoPoint) { // <-- 이 조건 추가
        cleanedData[key] = value;
      }
      else if (typeof value === 'string' && value.trim() === '') {
        cleanedData[key] = null;
      }
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cleanedData[key] = cleanAndConvertToNull(value);
      }
      else {
        cleanedData[key] = value;
      }
    }
  }
  return cleanedData;
};


export default function ConUpload({ // 컴포넌트 이름을 카멜케이스로 수정했습니다.
  isOpen,
  onClose
}) {
  const { currentUser } = useSelector((state) => state.user);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { push } = useRouter();
  const timestamp = Date.now();


  const [formState, setFormState] = useState({
    username: '',
    TopCategories: '전체',
    SubCategories: ['전체'],
    address: '',
    geoFirePoint: null,
    region: '',
    subRegion: '',
    imageDownloadUrls: [],
    categorySpecificData: {
      proApply: {}, // '전문인력' 카테고리의 동적 필드
      conApply: {},  // '건설업' 카테고리의 동적 필드
      equipApply: {},     // '건설장비' 카테고리의 동적 필드
      matApply: {},     // '건설자재' 카테고리의 동적 필드
    }
  });


  const {
    addrList, locationError, isAddrModalOpen, isLocationLoading,
    setAddrList, setLocationError, setIsAddrModalOpen, setIsLocationLoading,
    addrs, handleCurrentLocationSearch, handleSelectAddr
  } = useAddressSearch(formState, setFormState);

  const {
    showRegionList, setShowRegionList, subShowRegionList, setSubShowRegionList,
    handleRegionClick, handleRegionClick2, handleSubRegionRemove,
  } = useCategorySelection(formState, setFormState);

  const {
    handleDrag, handleDrop, fileInputRef, dragActive, setImageFiles, setDragActive,
    imageFiles, removeImage, handleFileSelect, moveImage
  } = useImageUpload();


  const [error, setError] = useState(''); // 일반적인 폼 에러 메시지

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    setError('');

    const currentEnglishCategory = KOREAN_TO_ENGLISH_APPLY[formState.TopCategories];
    const isCategorySpecificField = CATEGORY_APPLY_FIELDS[currentEnglishCategory]?.some(
      (field) => field.id === id
    );

    if (isCategorySpecificField) {
      setFormState(prev => ({
        ...prev,
        categorySpecificData: {
          ...prev.categorySpecificData,
          [currentEnglishCategory]: {
            ...(prev.categorySpecificData[currentEnglishCategory] || {}),
            [id]: value
          }
        }
      }));
    } else {
      setFormState(prev => ({ ...prev, [id]: value }));
    }
  };


  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const fetchedUserData = userSnap.data();
          setUserData(fetchedUserData);
          setFormState(prev => ({
            ...prev,
            username: fetchedUserData.username || '',
            TopCategories: fetchedUserData.TopCategories || '전체',
            SubCategories: fetchedUserData.SubCategories || ['전체'],
            address: fetchedUserData.address || '',
            geoFirePoint: fetchedUserData.geoFirePoint || null,
            region: fetchedUserData.region || '',
            subRegion: fetchedUserData.subRegion || '',
            imageDownloadUrls: fetchedUserData.imageDownloadUrls || [],
            categorySpecificData: {
              professionals: fetchedUserData.categorySpecificData?.professionals || {},
              construction: fetchedUserData.categorySpecificData?.construction || {},
              equipment: fetchedUserData.categorySpecificData?.equipment || {},
              materials: fetchedUserData.categorySpecificData?.materials || {},
              ...(fetchedUserData.categorySpecificData || {}),
            }
          }));
        }
      } catch (e) {
        console.error("사용자 데이터 로딩 중 에러:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);


  const handleSaveUsernameAndProfile = async () => {
    if (!formState.address || !formState.geoFirePoint) {
      setError('주소 검색을 통해 정확한 위치를 설정하고 입력해주세요.');
      return;
    }
    if (formState.TopCategories === '전체') {
      setError('카테고리(대분류)를 선택해주세요.');
      return;
    }
    if (formState.SubCategories.length === 0 || (formState.SubCategories.length === 1 && formState.SubCategories[0] === '전체')) {
      setError('카테고리(소분류)를 선택해주세요.');
      return;
    }

    const currentEnglishCategory = KOREAN_TO_ENGLISH_APPLY[formState.TopCategories];
    const fieldsForCurrentCategory = CATEGORY_APPLY_FIELDS[currentEnglishCategory] || [];

    for (const field of fieldsForCurrentCategory) {
      if (field.required) {
        const fieldValue = formState.categorySpecificData[currentEnglishCategory]?.[field.id];
        if (!fieldValue || fieldValue.trim() === '') {
          setError(`${field.placeholder} (필수)를 입력해주세요.`);
          return;
        }
      }
    }


    setError(''); // 모든 유효성 검사 통과 시 에러 초기화

    let imageUrls = [];
    const batch = writeBatch(db);
    const userUid = currentUser.uid;
    const id = `${userUid}-${timestamp}`;

    // 1. 이미지 압축 단계
    let compressedFile;
    try {
  // 이미지를 압축하는 부분만 try 블록에 넣습니다.
  const compressedFile = await imageCompression(file, options);
  
  // 압축 후, 업로드하는 부분은 따로 처리하여 오류를 분리합니다.
  const url = await uploadGrassImage(compressedFile, userUid, currentEnglishCategory);
  imageUrls.push(url);
  
} catch (error) {
  // 오류 메시지를 분석하여 구체적인 원인을 알 수 있습니다.
  console.error("오류 발생:", error);
  
  if (error.message && error.message.includes('image-compression')) {
    alert("이미지 압축 오류: 파일이 너무 크거나 메모리가 부족합니다. 사진 크기를 줄여서 다시 시도해주세요.");
  } else if (error.code && error.code.startsWith('storage')) {
    alert("파일 업로드 오류: 네트워크가 불안정합니다. 잠시 후 다시 시도해주세요.");
  } else {
    alert("알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}
    
    // 2. 이미지 업로드 단계
    try {
        if (compressedFile) { // 압축된 파일이 있다면
            const url = await uploadGrassImage(compressedFile, userUid, currentEnglishCategory);
            imageUrls.push(url);
        }
    } catch (uploadError) {
      console.error("이미지 업로드 오류:", uploadError);
      alert("이미지 업로드 오류: " + (uploadError.message || JSON.stringify(uploadError)));
      return; // 업로드 실패 시 함수 종료
    }


    let fcmToken = null;
    try {
      fcmToken = await saveFcmToken(userUid);
    } catch (error) {
      console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
    }

 
    const initialDataToSave = {
      username: formState.username,
      TopCategories: formState.TopCategories,
      SubCategories: formState.SubCategories,
      address: formState.address,
      geoFirePoint: formState.geoFirePoint,
      favorites: [],
      fcmToken: fcmToken,
      region: formState.region,
      subRegion: formState.subRegion,
      imageDownloadUrls: imageUrls,
      categorySpecificData: formState.categorySpecificData,
      badge: 0,
      notice: false,
      pushTime: serverTimestamp(),
      createdDate: new Date()
    };

    const dataToSave = cleanAndConvertToNull(initialDataToSave);
    const selectedKoreanCategory = formState.TopCategories;
    const englishCategoryToSave = KOREAN_TO_ENGLISH_APPLY[selectedKoreanCategory];

    if (englishCategoryToSave && selectedKoreanCategory !== '전체') {
      const categoryUserDocRef = doc(db, englishCategoryToSave, id);   
      const specificCategoryDataForCategoryCollection = dataToSave.categorySpecificData[englishCategoryToSave] || {};

      const categoryCollectionData = {
          username: dataToSave.username, // dataToSave에서 가져옴
          address: dataToSave.address,   // dataToSave에서 가져옴
          userKey: userUid,
          favorites: dataToSave.favorites,
          TopCategories: dataToSave.TopCategories,
          SubCategories: dataToSave.SubCategories,
          geoFirePoint: dataToSave.geoFirePoint,
          fcmToken: dataToSave.fcmToken,
          region: dataToSave.region,
          subRegion: dataToSave.subRegion,
          imageDownloadUrls: dataToSave.imageDownloadUrls,
          badge: dataToSave.badge,
          notice: dataToSave.notice,
          pushTime: dataToSave.pushTime,
          createdDate: new Date(),
          confirmed: false,
          ...specificCategoryDataForCategoryCollection, // 동적 필드 데이터 병합

      };
      batch.set(categoryUserDocRef, categoryCollectionData, { merge: true });
  }


   if (englishCategoryToSave && selectedKoreanCategory !== '전체') {
      const categoryUserDocRef = doc(db, "users", userUid, englishCategoryToSave, id)   //id
      const specificCategoryDataForCategoryCollection = dataToSave.categorySpecificData[englishCategoryToSave] || {};

      const categoryCollectionData = {
          username: dataToSave.username, // dataToSave에서 가져옴
          address: dataToSave.address,   // dataToSave에서 가져옴
          userKey: userUid,
          favorites: dataToSave.favorites,
          TopCategories: dataToSave.TopCategories,
          SubCategories: dataToSave.SubCategories,
          geoFirePoint: dataToSave.geoFirePoint,
          fcmToken: dataToSave.fcmToken,
          region: dataToSave.region,
          subRegion: dataToSave.subRegion,
          imageDownloadUrls: dataToSave.imageDownloadUrls,
          ...specificCategoryDataForCategoryCollection, // 동적 필드 데이터 병합
          badge: dataToSave.badge,
          notice: dataToSave.notice,
          pushTime: dataToSave.pushTime,
          createdDate: new Date(),
          confirmed: false
      };
      batch.set(categoryUserDocRef, categoryCollectionData, { merge: true });
  }



  const userDocRef = doc(db, "users", userUid);
    const category = CATEGORY_LINK[englishCategoryToSave];
  
      const wishlistItem = { category: category, id: id, middle: 'apply', top: englishCategoryToSave };  //top 삭제 id로 저장
      if (englishCategoryToSave && selectedKoreanCategory !== '전체') {
          batch.update(userDocRef, {
              division: arrayUnion(
                  englishCategoryToSave
              ),
              myList: arrayUnion(
                  wishlistItem
              ),
          });
      }
  


    
    try {
      await batch.commit();
      onClose();
      push(`/`);
    } catch (err) {
      console.error("데이터 저장 중 오류 발생:", err);
      setError('정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <UserApplyModal
        isOpen={isOpen}
        onClose={onClose}
        formState={formState}
        setFormState={setFormState}
        handleInputChange={handleInputChange}
        error={error}
        handleSaveUsernameAndProfile={handleSaveUsernameAndProfile}
        setIsAddrModalOpen={setIsAddrModalOpen}
        showRegionList={showRegionList}
        setShowRegionList={setShowRegionList}
        subShowRegionList={subShowRegionList}
        setSubShowRegionList={setSubShowRegionList}
        handleRegionClick={handleRegionClick}
        handleRegionClick2={handleRegionClick2}
        handleSubRegionRemove={handleSubRegionRemove}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
        dragActive={dragActive}
        imageFiles={imageFiles}
        handleFileSelect={handleFileSelect}
        removeImage={removeImage}
        moveImage={moveImage}
        setImageFiles={setImageFiles}
        setDragActive={setDragActive}
      />

      <AddressSearchModal        
        isAddrModalOpen={isAddrModalOpen}
        setIsAddrModalOpen={setIsAddrModalOpen}
        addrList={addrList}
        locationError={locationError}
        isLocationLoading={isLocationLoading}
        formState={formState}
        handleInputChange={handleInputChange}
        addrs={addrs}
        handleCurrentLocationSearch={handleCurrentLocationSearch}
        handleSelectAddr={handleSelectAddr}
      />
    </div>
  );
}

