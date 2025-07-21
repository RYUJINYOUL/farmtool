import { Suspense } from 'react';
import PermitSearchControls from './PermitSearchControls';
import { fetchArchitecturalPermitData, ArchitecturalPermitItem } from '@/lib/ArchPmsApi'; // ArchitecturalPermitItem 임포트
import ClientPermitList from './ClientPermitList';
import { hierarchicalRegions } from '@/lib/constants'; // 지역명 매핑을 위해 임포트

interface ArchitecturalPermitsPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ITEMS_PER_PAGE = 25; // 페이지당 항목 수

export default async function ArchitecturalPermitsPage({ searchParams }: ArchitecturalPermitsPageProps) {
  const params = await searchParams || {};

  // URL에서 파라미터 가져오기, 없으면 기본값 설정
  const currentMainRegion = (params.mainRegion as string) || '서울';
  const currentSubRegion = (params.subRegion as string) || '강남구';
  const dong = (params.dongne as string) || '강남구';
  const currentLegalDongCode = (params.legalDongCode as string) || '1168010300'; // 기본값: 서울 강남구 개포동
  
  // 날짜 기본값 설정 (오늘 날짜와 1년 전 날짜)
  const today = new Date(); 
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(today.getDate()).padStart(2, '0');
  const defaultEndDate = `${year}${month}${day}`; // YYYYMMDD
  const defaultStartDate = new Date(today.getFullYear() - 0.5, today.getMonth(), today.getDate()).toISOString().slice(0, 10).replace(/-/g, ''); // 1년 전

  const currentStartDate = defaultStartDate;
  const currentEndDate = defaultEndDate;
  const currentPageNo = parseInt((params.pageNo as string) || '1', 10);

  // initialPermits 변수에 명시적으로 타입 지정
  let initialPermits: ArchitecturalPermitItem[] = [];
  let totalCount = 0;
  let error: string | null = null;

  // 법정동 코드가 유효할 때만 API 호출
  // currentLegalLegalDongCode 오타 수정: currentLegalDongCode
  if (currentLegalDongCode && currentLegalDongCode.length === 10) {
    const sigunguCd = currentLegalDongCode.substring(0, 5);
    const bjdongCd = currentLegalDongCode.substring(5, 10);

    // 서버 컴포넌트에서 초기 데이터 로드
    const { data, totalCount: apiTotalCount, error: fetchError } = await fetchArchitecturalPermitData(
      sigunguCd,
      bjdongCd,
      currentStartDate,
      currentEndDate,
      currentPageNo,
      ITEMS_PER_PAGE
    );
    initialPermits = data;
    totalCount = apiTotalCount;
    error = fetchError;
  } else {
    error = "유효한 지역 정보가 선택되지 않았습니다. 시도, 시군구, 법정동을 선택해주세요.";
  }

  // UI 표시를 위한 법정동 이름 찾기
  let currentLegalDongName = "";
  if (currentLegalDongCode && currentLegalDongCode.length === 10) {
    const selectedRegionData = hierarchicalRegions.find(r => r.name === currentMainRegion);
    if (selectedRegionData) {
      currentLegalDongName = currentLegalDongCode.substring(5, 10); // 예: 10300
    }
  }


  return (
    <div className='min-h-screen bg-gray-50 pt-15'>
    <main style={{ maxWidth: '1100px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>

      {/* 검색 컨트롤 컴포넌트 */}
      <PermitSearchControls
        initialMainRegion={currentMainRegion}
        initialSubRegion={currentSubRegion}
        initialLegalDongCode={currentLegalDongCode}
        initialStartDate={currentStartDate}
        initialEndDate={currentEndDate}
      />
      
      <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

      {error ? (
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em' }}>오류 발생: {error}</p>
      ) : (
        <ClientPermitList
          initialPermits={initialPermits}
          initialTotalCount={totalCount}
          initialPageNo={currentPageNo}
          numOfRows={ITEMS_PER_PAGE}
          sigunguCd={currentLegalDongCode.substring(0, 5)}
          bjdongCd={currentLegalDongCode.substring(5, 10)}
          startDate={currentStartDate}
          endDate={currentEndDate}
          dong={dong}
          currentMainRegionName={currentMainRegion}
          currentSubRegionName={currentSubRegion}
          currentLegalDongName={currentLegalDongName} // 법정동 이름 전달
        />
      )}
    </main>
    </div>
  );
}