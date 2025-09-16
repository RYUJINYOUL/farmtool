'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, writeBatch, serverTimestamp, GeoPoint, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import UserApplyModal from '@/components/UserApplyModal';
import AddressSearchModal from '@/components/AddressSearchModal';

import { saveFcmToken } from "@/lib/fcm";
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { useCategorySelection } from '@/hooks/useCategorySelection';
import useImageUpload from '@/hooks/useImageUpload';
import imageCompression from 'browser-image-compression';
import { uploadGrassImage } from '@/hooks/useUploadImage';
import { KOREAN_TO_ENGLISH_APPLY, CATEGORY_APPLY_FIELDS, CATEGORY_LINK } from '@/lib/constants';

// 🔹 데이터 클리닝 함수
const cleanAndConvertToNull = (data) => {
  const cleanedData = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof GeoPoint) {
        cleanedData[key] = value;
      } else if (typeof value === 'string' && value.trim() === '') {
        cleanedData[key] = null;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cleanedData[key] = cleanAndConvertToNull(value);
      } else {
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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useRouter();
  const timestamp = Date.now();

  const [formState, setFormState] = useState<any>({
    username: '',
    TopCategories: '전체',
    SubCategories: ['전체'],
    address: '',
    geoFirePoint: null,
    region: '',
    subRegion: '',
    imageDownloadUrls: [],
    categorySpecificData: {
      proApply: {},
      conApply: {},
      equipApply: {},
      matApply: {},
    }
  });

  // hooks
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

  const [error, setError] = useState('');

  // 🔹 input 핸들러
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setError('');

    const englishCategory = KOREAN_TO_ENGLISH_APPLY[formState.TopCategories];
    const isCategorySpecificField = CATEGORY_APPLY_FIELDS[englishCategory]?.some(
      (field) => field.id === id
    );

    if (isCategorySpecificField) {
      setFormState((prev) => ({
        ...prev,
        categorySpecificData: {
          ...prev.categorySpecificData,
          [englishCategory]: {
            ...(prev.categorySpecificData[englishCategory] || {}),
            [id]: value
          }
        }
      }));
    } else {
      setFormState((prev) => ({ ...prev, [id]: value }));
    }
  };

  // 🔹 유저 데이터 로드
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
          setFormState((prev) => ({
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
              proApply: fetchedUserData.categorySpecificData?.proApply || {},
              conApply: fetchedUserData.categorySpecificData?.conApply || {},
              equipApply: fetchedUserData.categorySpecificData?.equipApply || {},
              matApply: fetchedUserData.categorySpecificData?.matApply || {},
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

  // 🔹 저장
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

    const englishCategory = KOREAN_TO_ENGLISH_APPLY[formState.TopCategories];
    const fieldsForCurrentCategory = CATEGORY_APPLY_FIELDS[englishCategory] || [];

    for (const field of fieldsForCurrentCategory) {
      if (field.required) {
        const fieldValue = formState.categorySpecificData[englishCategory]?.[field.id];
        if (!fieldValue || fieldValue.trim() === '') {
          setError(`${field.placeholder} (필수)를 입력해주세요.`);
          return;
        }
      }
    }

    setError('');
    let imageUrls = [];
    const batch = writeBatch(db);
    const userUid = currentUser.uid;
    const id = `${userUid}-${timestamp}`;

    // 이미지 업로드
    try {
      if (imageFiles.length > 0) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        for (const file of imageFiles) {
          const compressedFile = await imageCompression(file, options);
          const url = await uploadGrassImage(compressedFile, userUid, englishCategory);
          imageUrls.push(url);
        }
      }
    } catch (error) {
      console.error("이미지 업로드 에러:", error);
      alert("사진 업로드 에러: " + (error.message || JSON.stringify(error)));
    }

    // fcmToken
    let fcmToken = null;
    try {
      fcmToken = await saveFcmToken(userUid);
    } catch (error) {
      console.error("FCM 토큰 에러:", error);
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

    // 카테고리별 저장
    if (englishCategory && formState.TopCategories !== '전체') {
      // global category collection
      const categoryUserDocRef = doc(db, englishCategory, id);
      const specificCategoryData = dataToSave.categorySpecificData[englishCategory] || {};
      batch.set(categoryUserDocRef, {
        ...dataToSave,
        ...specificCategoryData,
        userKey: userUid,
        confirmed: false
      }, { merge: true });

      // user subcollection
      const categoryUserSubRef = doc(db, "users", userUid, englishCategory, id);
      batch.set(categoryUserSubRef, {
        ...dataToSave,
        ...specificCategoryData,
        userKey: userUid,
        confirmed: false
      }, { merge: true });

      // myList 업데이트
      const userDocRef = doc(db, "users", userUid);
      const category = CATEGORY_LINK[englishCategory];
      const wishlistItem = { category: category, id: id, middle: 'apply', top: englishCategory };
      batch.update(userDocRef, {
        division: arrayUnion(englishCategory),
        myList: arrayUnion(wishlistItem)
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
