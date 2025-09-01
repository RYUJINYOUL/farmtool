import { useState } from 'react';
import { GeoPoint } from 'firebase/firestore'; // GeoPoint 임포트 (Firebase 설정에 따라 경로 다를 수 있음)
import * as geohash from 'ngeohash'; // geohash 임포트
import { parseRegionAndSubRegion } from '@/lib/addressParser'; // 주소 파싱 함수 임포트
import { getAddress, getAddressByLatLon } from '@/lib/geo'; // 주소 API 호출 함수 임포트 (가정)

export function useAddressSearch(formState, setFormState) {
  const [addrList, setAddrList] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // 일반 주소 검색
  async function addrs() {
    setAddrList([]);
    setLocationError('');
    if (!formState.address) {
      setLocationError("읍면동, 건물명 입력 후 주소 검색/현재 위치");
      setIsAddrModalOpen(true);
      return;
    }
    try {
      const res = await getAddress(formState.address); // getAddress 함수는 api.js에 있다고 가정
      // getAddress 함수는 이미 { juso, x, y } 형태의 객체 배열을 반환하므로,
      // 추가적인 map 처리가 필요 없습니다.
      const result = res; // <-- 이 부분을 수정했습니다.
      setAddrList(result);
      setIsAddrModalOpen(true);
      if (result.length === 0) {
        setLocationError("검색 결과가 없습니다.");
      }
    } catch (apiError) {
      console.error("주소 API 호출 에러:", apiError);
      setLocationError("주소 정보를 가져오는 데 실패했습니다.");
      setIsAddrModalOpen(true);
    }
  }

  // 현재 위치 검색
  const handleCurrentLocationSearch = () => {
    setAddrList([]);
    setLocationError('');
    setIsLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationError("브라우저가 지오로케이션을 지원하지 않습니다.");
      setIsLocationLoading(false);
      setIsAddrModalOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const result = await getAddressByLatLon(lon, lat); 
          setAddrList(result); 
          setIsAddrModalOpen(true);
        } catch (apiError) {
          console.error("주소 API 호출 에러:", apiError);
          setLocationError("주소 정보를 가져오는 데 실패했습니다.");
          setIsAddrModalOpen(true);
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        setIsLocationLoading(false);
        let errorMessage = "위치 정보를 가져올 수 없습니다.";
        if (error.code === 1) {
          errorMessage = "위치 권한이 거부되었습니다. 브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭해 '위치' 권한을 허용해 주세요. 권한을 허용한 후, 다시 '현재 위치 검색' 버튼을 눌러주세요.";
        } else if (error.code === 2) {
          errorMessage = "위치 정보를 사용할 수 없습니다.";
        } else if (error.code === 3) {
          errorMessage = "위치 정보 요청이 시간 초과되었습니다.";
        }
        setLocationError(errorMessage);
        setIsAddrModalOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 주소 검색 결과 선택 핸들러
  function handleSelectAddr(item) {
    const lat = Number(item.y);
    const lng = Number(item.x);
    const hash = geohash.encode(lat, lng);
    const { region, subRegion } = parseRegionAndSubRegion(item.juso);

    setFormState(prev => ({
      ...prev,
      address: item.juso,
      geoFirePoint: {
        geopoint: new GeoPoint(lat, lng),
        geohash: hash,
      },
      region: region,
      subRegion: subRegion
    }));
    setAddrList([]);
    setIsAddrModalOpen(false);
  }

  return {
    addrList,
    locationError,
    isAddrModalOpen,
    isLocationLoading,
    setAddrList,
    setLocationError,
    setIsAddrModalOpen,
    setIsLocationLoading,
    addrs,
    handleCurrentLocationSearch,
    handleSelectAddr,
  };
}