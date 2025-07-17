// app/permit/PermitSearchControls.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hierarchicalRegions } from '@/lib/constants';
import { fetchLegalDongCodes, LegalDongItem } from '@/lib/ArchPmsApi';

interface PermitSearchControlsProps {
  initialMainRegion: string;
  initialSubRegion: string;
  initialLegalDongCode: string; // 10자리 법정동 코드 (예: 1168010300)
  initialStartDate: string;
  initialEndDate: string;
}

export default function PermitSearchControls({
  initialMainRegion,
  initialSubRegion,
  initialLegalDongCode,
  initialStartDate,
  initialEndDate,
}: PermitSearchControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 가져오기
  const [selectedMainRegion, setSelectedMainRegion] = useState(
    searchParams.get('mainRegion') || initialMainRegion
  );
  const [selectedSubRegion, setSelectedSubRegion] = useState(
    searchParams.get('subRegion') || initialSubRegion
  );
  const [selectedLegalDongCode, setSelectedLegalDongCode] = useState(
    searchParams.get('legalDongCode') || initialLegalDongCode
  );
  const [selectedStartDate, setSelectedStartDate] = useState(
    initialStartDate
  );
  const [selectedEndDate, setSelectedEndDate] = useState(
    initialEndDate
  );

  // 드롭다운 UI에 표시될 임시 상태
  const [tempMainRegion, setTempMainRegion] = useState(selectedMainRegion);
  const [tempSubRegion, setTempSubRegion] = useState(selectedSubRegion);
  const [tempLegalDongCode, setTempLegalDongCode] = useState(selectedLegalDongCode);
  const [tempStartDate, setTempStartDate] = useState(selectedStartDate);
  const [tempEndDate, setTempEndDate] = useState(selectedEndDate);

  const [legalDongs, setLegalDongs] = useState<LegalDongItem[]>([]);
  const [isFetchingDongs, setIsFetchingDongs] = useState(false);
  const [dongFetchError, setDongFetchError] = useState<string | null>(null);

  // URL 파라미터 변경 시 드롭다운 UI의 임시 상태를 동기화
  useEffect(() => {
    setTempMainRegion(selectedMainRegion);
    setTempSubRegion(selectedSubRegion);
    setTempLegalDongCode(selectedLegalDongCode);
    setTempStartDate(selectedStartDate);
    setTempEndDate(selectedEndDate);
  }, [selectedMainRegion, selectedSubRegion, selectedLegalDongCode, selectedStartDate, selectedEndDate]);

  // 선택된 시군구에 따라 법정동 목록을 가져오는 효과
  useEffect(() => {
    const getDongs = async () => {
      // 시도와 시군구가 유효하게 선택되었을 때만 법정동 목록을 가져옵니다.
      if (tempMainRegion && tempMainRegion !== '전국' && tempSubRegion && tempSubRegion !== '시군구 선택') {
        setIsFetchingDongs(true);
        setDongFetchError(null);
        try {
          const { data, error } = await fetchLegalDongCodes(tempMainRegion, tempSubRegion);
          console.log("가져온 법정동 데이터:", data); // 데이터 확인을 위한 로그
          if (error) {
            setDongFetchError(error);
            setLegalDongs([]);
            setTempLegalDongCode(''); // 오류 발생 시 법정동 선택 초기화
          } else {
            setLegalDongs(data);
            // 새로 가져온 법정동 목록에 현재 선택된 법정동 코드가 없거나,
            // 법정동 목록이 비어있으면 tempLegalDongCode를 초기화합니다.
            if (!data.some(d => d.region_cd === tempLegalDongCode) || data.length === 0) {
                setTempLegalDongCode('');
            }
            // 만약 초기 로드 시 initialLegalDongCode가 있고,
            // 해당 코드가 새로 가져온 data에 있다면 tempLegalDongCode를 그 값으로 설정합니다.
            // 이 로직은 URL에서 넘어온 initialLegalDongCode가 유효할 때만 실행되어야 합니다.
            if (initialLegalDongCode && data.some(d => d.region_cd === initialLegalDongCode)) {
                setTempLegalDongCode(initialLegalDongCode);
            }
          }
        } catch (err: any) {
          setDongFetchError(err.message || "법정동 목록을 가져오는 데 실패했습니다.");
          setLegalDongs([]);
          setTempLegalDongCode(''); // 오류 발생 시 법정동 선택 초기화
        } finally {
          setIsFetchingDongs(false);
        }
      } else {
        // 시도 또는 시군구가 선택되지 않았거나 '전국'인 경우 법정동 목록을 비웁니다.
        setLegalDongs([]);
        setTempLegalDongCode('');
      }
    };
    getDongs();
  }, [tempMainRegion, tempSubRegion]); // 의존성 배열에서 selectedLegalDongCode 제거

  const applySearchParams = (
    mainRegion: string,
    subRegion: string,
    legalDongCode: string,
    dongneParam: string,
    startDate: string,
    endDate: string
  ) => {
    const newSearchParams = new URLSearchParams();

    // 필수 파라미터는 항상 설정
    newSearchParams.set('mainRegion', mainRegion);
    newSearchParams.set('subRegion', subRegion);
    newSearchParams.set('legalDongCode', legalDongCode); // 10자리 코드 전체를 전달
    newSearchParams.set('dongne', dongneParam);
    newSearchParams.set('startDate', startDate);
    newSearchParams.set('endDate', endDate);
    newSearchParams.set('pageNo', '1'); // 새 검색 시 항상 페이지 1로 재설정

    // 상태 업데이트
    setSelectedMainRegion(mainRegion);
    setSelectedSubRegion(subRegion);
    setSelectedLegalDongCode(legalDongCode);
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);

    router.push(`/permit/?${newSearchParams.toString()}`);
  };

  const handleSearchClick = () => {
    // 필수 파라미터 유효성 검사
    if (!tempMainRegion || tempMainRegion === '전국' || tempMainRegion === '시도 선택') {
      alert('시도를 선택해주세요.');
      return;
    }
    if (!tempSubRegion || tempSubRegion === '전체' || tempSubRegion === '시군구 선택') {
      alert('시군구를 선택해주세요.');
      return;
    }
    if (!tempLegalDongCode) {
        alert('법정동을 선택해주세요.');
        return;
    }
    if (!tempStartDate || !tempEndDate) {
        alert('조회 기간을 선택해주세요.');
        return;
    }

    const selectedDongItem = legalDongs.find(dong => dong.region_cd === tempLegalDongCode);

    // 여기를 수정합니다:
    const dongneToSend: string = selectedDongItem
        ? (selectedDongItem.locatlow_nm || (selectedDongItem.locatadd_nm.split(' ').pop() || ''))
        : ''; // selectedDongItem이 없으면 빈 문자열

    applySearchParams(
      tempMainRegion,
      tempSubRegion,
      tempLegalDongCode,
      dongneToSend,
      tempStartDate,
      tempEndDate
    );
  };

  const currentMainRegionData = hierarchicalRegions.find(
    (region) => region.name === tempMainRegion
  );
  const subRegions = currentMainRegionData ? currentMainRegionData.subRegions || [] : [];

  // 날짜 입력 필드의 기본값을 오늘 날짜로 설정
  const today = new Date();
  const defaultEndDate = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const defaultStartDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10).replace(/-/g, ''); // 1년 전

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
        {/* 대분류 선택 드롭다운 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label htmlFor="main-region-select" style={{ fontWeight: 'bold' }}>시도:</label>
          <select id="main-region-select" value={tempMainRegion} onChange={(e) => {
            setTempMainRegion(e.target.value);
            setTempSubRegion(''); // 시도 변경 시 시군구 초기화
            setTempLegalDongCode(''); // 시도 변경 시 법정동 초기화
          }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">시도 선택</option>
            {hierarchicalRegions.filter(r => r.name !== '전국').map((region) => ( // '전국' 옵션 제외
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* 소분류 선택 드롭다운 (시도 선택 시 활성화) */}
        {tempMainRegion && tempMainRegion !== '전국' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label htmlFor="sub-region-select" style={{ fontWeight: 'bold' }}>시군구:</label>
            <select id="sub-region-select" value={tempSubRegion} onChange={(e) => {
              setTempSubRegion(e.target.value);
              setTempLegalDongCode(''); // 시군구 변경 시 법정동 초기화
            }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">시군구 선택</option>
              {subRegions.map((subRegion) => (
                <option key={subRegion} value={subRegion}>
                  {subRegion}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 법정동 선택 드롭다운 (시군구 선택 시 활성화) */}
        {tempSubRegion && tempSubRegion !== '시군구 선택' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label htmlFor="legal-dong-select" style={{ fontWeight: 'bold' }}>법정동:</label>
            <select id="legal-dong-select" value={tempLegalDongCode} onChange={(e) => setTempLegalDongCode(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">법정동 선택</option>
              {isFetchingDongs ? (
                <option value="" disabled>로딩 중...</option>
              ) : dongFetchError ? (
                <option value="" disabled>오류: {dongFetchError}</option>
              ) : legalDongs.length === 0 ? (
                <option value="" disabled>법정동 없음</option>
              ) : (
                legalDongs.map((dong) => (
                  <option key={dong.region_cd} value={dong.region_cd}>
                    {dong.locatlow_nm || dong.locatadd_nm.split(' ').pop()}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

       {/*날짜 선택 */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label htmlFor="start-date" style={{ fontWeight: 'bold' }}>시작일:</label>
          <input
            type="date"
            id="start-date"
            value={tempStartDate ? tempStartDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : defaultStartDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
            onChange={(e) => setTempStartDate(e.target.value.replace(/-/g, ''))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label htmlFor="end-date" style={{ fontWeight: 'bold' }}>종료일:</label>
          <input
            type="date"
            id="end-date"
            value={tempEndDate ? tempEndDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : defaultEndDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
            onChange={(e) => setTempEndDate(e.target.value.replace(/-/g, ''))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div> */}

        <button
          onClick={handleSearchClick}
          style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid #28a745', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', marginLeft: '10px' }}
        >
          검색
        </button>
      </div>
    </div>
  );
}

