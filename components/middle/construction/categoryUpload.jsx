'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, writeBatch, arrayUnion, GeoPoint, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { saveFcmToken } from "@/lib/fcm";
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { useCategorySelection } from '@/hooks/useCategorySelection';
import useImageUpload from '@/hooks/useImageUpload';
import UserProfileModal from '@/components/UserProfileModal';
import AddressSearchModal from '@/components/AddressSearchModal';
import imageCompression from 'browser-image-compression';
import { uploadGrassImage } from '@/hooks/useUploadImage';
import { KOREAN_TO_ENGLISH_CATEGORIES, CATEGORY_SPECIFIC_FIELDS } from '@/lib/constants';
import CheckoutPage from "@/app/payments/checkout/page"

// 데이터 클리닝 함수 (변화 없음)
const cleanAndConvertToNull = (data) => {
  const cleanedData = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];

      // GeoPoint 인스턴스인 경우, 그대로 반환하여 변환을 피합니다.
      // GeoPoint 클래스를 정확히 참조하려면 Firestore SDK에서 임포트해야 합니다.
      if (value instanceof GeoPoint) { // <-- 이 조건 추가
        cleanedData[key] = value;
      }
      // 문자열이 비어있으면 null로, 아니면 원래 값 사용
      else if (typeof value === 'string' && value.trim() === '') {
        cleanedData[key] = null;
      }
      // 객체인 경우 (GeoPoint가 아니며, null이 아니고, 배열이 아닌 경우) 재귀적으로 처리
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cleanedData[key] = cleanAndConvertToNull(value);
      }
      // 그 외의 경우 (숫자, boolean, 배열 등)는 원래 값 사용
      else {
        cleanedData[key] = value;
      }
    }
  }
  return cleanedData;
};


export default function CategoryUpload({ // 컴포넌트 이름을 카멜케이스로 수정했습니다.
  isOpen,
  onClose
}) {
  const { currentUser } = useSelector((state) => state.user);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { push } = useRouter();
  const [isExpired, setIsExpired] = useState(false);

  // 폼 데이터 관리용 통합 상태
  const [formState, setFormState] = useState({
    username: '',
    TopCategories: '전체',
    SubCategories: ['전체'],
    address: '',
    // certificate, career, phoneNumber는 categorySpecificData 안에서만 관리
    geoFirePoint: null,
    region: '',
    subRegion: '',
    imageDownloadUrls: [],
    categorySpecificData: {
      professionals: {}, // '전문인력' 카테고리의 동적 필드
      construction: {},  // '건설업' 카테고리의 동적 필드
      equipment: {},     // '건설장비' 카테고리의 동적 필드
      materials: {},     // '건설자재' 카테고리의 동적 필드
    }
  });

  // ★ 커스텀 훅 사용 ★ (변화 없음)
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

  // 폼 입력 변경 핸들러 (변화 없음, 이미 categorySpecificData를 잘 처리하고 있음)
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setError('');

    const currentEnglishCategory = KOREAN_TO_ENGLISH_CATEGORIES[formState.TopCategories];
    const isCategorySpecificField = CATEGORY_SPECIFIC_FIELDS[currentEnglishCategory]?.some(
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

  // --- 기존 useEffect 로직 수정 ---
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
          let expirationDate = null;
          if (fetchedUserData.expirationDate && typeof fetchedUserData.expirationDate.toDate === 'function') {
            expirationDate = fetchedUserData.expirationDate.toDate();
          }
          console.log(expirationDate)
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
            // paymentKey: fetchedUserData.paymentKey || '',
            // amount: fetchedUserData.amount || 0,
            // method: fetchedUserData.method || '',
            // approvedAt: fetchedUserData.approvedAt || '',
            }
          }));

        
          const expirationDateValue = fetchedUserData.expirationDate?.toDate() || null;
          const now = new Date();
          if (!expirationDateValue || expirationDateValue < now) {
            setIsExpired(true);
          } else {
            setIsExpired(false);
          }}
      } catch (e) {
        console.error("사용자 데이터 로딩 중 에러:", e);
        setIsExpired(true); // 에러 발생 시 만료로 간주
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  // 최종 저장 핸들러
  const handleSaveUsernameAndProfile = async () => {
    // 1. 공통 필수 필드 유효성 검사
    if (loading || isExpired) {
      return;
    }
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

    // ★ 카테고리별 필수 필드 유효성 검사 ★ (변화 없음)
    const currentEnglishCategory = KOREAN_TO_ENGLISH_CATEGORIES[formState.TopCategories];
    const fieldsForCurrentCategory = CATEGORY_SPECIFIC_FIELDS[currentEnglishCategory] || [];

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

    try {
      if (imageFiles.length > 0) {
        const options = {
          maxSizeMB: 1, // 모바일은 더 작게
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };

        for (const file of imageFiles) {
          const compressedFile = await imageCompression(file, options);
          const url = await uploadGrassImage(compressedFile, userUid, englishCategoryToSave);
          imageUrls.push(url);
        }
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('데이터 저장 중 오류가 발생했습니다.');
    }

    let fcmToken = null;
    try {
      fcmToken = await saveFcmToken(userUid);
    } catch (error) {
      console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
    }
    

    // --- 여기부터 dataToSave 생성 로직 변경 ---
    const initialDataToSave = {
      username: formState.username,
      TopCategories: formState.TopCategories,
      SubCategories: formState.SubCategories,
      address: formState.address,
      // certificate, career, phoneNumber는 categorySpecificData 내부에 있으므로 여기서 제거
      geoFirePoint: formState.geoFirePoint,
      favorites: [],
      fcmToken: fcmToken,
      region: formState.region,
      subRegion: formState.subRegion,
      imageDownloadUrls: imageUrls,
      // categorySpecificData는 cleanAndConvertToNull이 마지막에 한 번만 적용될 것이므로 원본 그대로
      categorySpecificData: formState.categorySpecificData,
      badge: 0,
      notice: false,
      pushTime: serverTimestamp(),
      createdDate: new Date()
    };

    // 모든 데이터를 한 번에 클리닝하여 최종 dataToSave 생성
    const dataToSave = cleanAndConvertToNull(initialDataToSave);

    // 이제 dataToSave.certificate, dataToSave.career, dataToSave.phoneNumber 같은 개별 변환은 필요 없음
    // 왜냐하면 해당 필드들이 categorySpecificData 내부에 있다면,
    // cleanAndConvertToNull 함수가 initialDataToSave를 처리할 때 재귀적으로 찾아 들어가서 변환하기 때문입니다.


    // ★ 3. 선택된 한글 카테고리를 영어 이름으로 변환하여 해당 컬렉션에 문서 생성 ★
    const selectedKoreanCategory = formState.TopCategories;
    const englishCategoryToSave = KOREAN_TO_ENGLISH_CATEGORIES[selectedKoreanCategory];

    if (englishCategoryToSave && selectedKoreanCategory !== '전체') {
      const categoryUserDocRef = doc(db, englishCategoryToSave, userUid);
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const expirationDate = userData.expirationDate?.toDate() || null;
      // 해당 카테고리에 맞는 동적 필드 데이터만 가져와서 병합 (이미 cleanAndConvertToNull이 적용된 dataToSave에서 추출)
      // dataToSave.categorySpecificData가 이미 cleanAndConvertToNull이 적용된 상태이므로
      // 여기서 또 cleanAndConvertToNull을 호출하는 것은 불필요합니다.
      // (dataToSave.categorySpecificData[englishCategoryToSave] || {})는 이미 cleanedData입니다.
      const specificCategoryDataForCategoryCollection = dataToSave.categorySpecificData[englishCategoryToSave] || {};

      const categoryCollectionData = {
          username: dataToSave.username, // dataToSave에서 가져옴
          address: dataToSave.address,   // dataToSave에서 가져옴
          // certificate, career, phoneNumber는 specificCategoryDataForCategoryCollection에 포함됨
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
          expirationDate: expirationDate
      };
      batch.set(categoryUserDocRef, categoryCollectionData, { merge: true });
  }


   if (englishCategoryToSave && selectedKoreanCategory !== '전체') {
      const categoryUserDocRef = doc(db, "users", userUid, englishCategoryToSave, englishCategoryToSave)
      // 해당 카테고리에 맞는 동적 필드 데이터만 가져와서 병합 (이미 cleanAndConvertToNull이 적용된 dataToSave에서 추출)
      // dataToSave.categorySpecificData가 이미 cleanAndConvertToNull이 적용된 상태이므로
      // 여기서 또 cleanAndConvertToNull을 호출하는 것은 불필요합니다.
      // (dataToSave.categorySpecificData[englishCategoryToSave] || {})는 이미 cleanedData입니다.
      const specificCategoryDataForCategoryCollection = dataToSave.categorySpecificData[englishCategoryToSave] || {};

      const categoryCollectionData = {
          username: dataToSave.username, // dataToSave에서 가져옴
          address: dataToSave.address,   // dataToSave에서 가져옴
          // certificate, career, phoneNumber는 specificCategoryDataForCategoryCollection에 포함됨
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
      };
      batch.set(categoryUserDocRef, categoryCollectionData, { merge: true });
  }


  const userDocRef = doc(db, "users", userUid);
  const category = englishCategoryToSave;

    const wishlistItem = { category: category, top: englishCategoryToSave, middle: 'registration' };
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


   if (isExpired) {
    // const userUid = currentUser.uid;
    return <CheckoutPage />;
  }

  return (
    <div>
      <UserProfileModal
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