// app/construction/page.tsx
import { Suspense } from 'react';
import SearchControls from '@/components/SearchControls';
import { fetchCompanyData, CompanyItem } from '@/lib/ConsApi';
import ClientCompanyList from '@/components/ClientCompanyList'; // New client component for displaying list

interface ConstructionPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

const ITEMS_PER_PAGE = 25; // Change to 25 for this new behavior

export default async function ConstructionPage({ searchParams }: ConstructionPageProps) {
  // searchParams가 undefined 또는 null일 경우를 대비하여 빈 객체로 초기화합니다.
  // 이렇게 하면 searchParams의 속성에 접근하기 전에 항상 유효한 객체임을 보장할 수 있습니다.
  const params = searchParams || {};

  const currentMainRegion = (params.mainRegion as string) || '서울';
  const currentSubRegion = (params.subRegion as string) || '';
  const currentItemName = (params.itemName as string) || '';
  const currentPageNo = parseInt((params.pageNo as string) || '1', 10);

  // Server Component에서 직접 API 호출 (첫 페이지 데이터만 로드)
  const { data: initialCompanies, totalCount, error } = await fetchCompanyData(
    currentMainRegion,
    currentSubRegion,
    currentItemName,
    currentPageNo, // Will be 1 initially
    ITEMS_PER_PAGE
  );

  return (
    <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
      <h1 style={{ color: '#333', textAlign: 'center', marginBottom: '30px', fontSize: '2.2em' }}>건설업체 정보 조회</h1>
      <p style={{ textAlign: 'center', color: '#555', fontSize: '1.1em', marginBottom: '30px' }}>지역, 업종, 페이지를 선택하여 건설업체 정보를 조회하세요.</p>

      {/* 검색 컨트롤 컴포넌트 */}
      {/* SearchControls will now control the search and potentially trigger a client-side fetch */}
      <SearchControls
        initialMainRegion={currentMainRegion}
        initialSubRegion={currentSubRegion}
        initialItemName={currentItemName}
        initialPageNo={currentPageNo}
        totalCount={totalCount} // Still pass totalCount for the initial render, ClientCompanyList will manage its own.
        numOfRows={ITEMS_PER_PAGE} // Still pass for pagination calculation
      />
      
      <hr style={{ margin: '30px 0', borderColor: '#eee' }} />

      <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '1.8em' }}>조회 결과</h2>

      {error ? (
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em' }}>오류 발생: {error}</p>
      ) : (
        <ClientCompanyList
          initialCompanies={initialCompanies}
          initialTotalCount={totalCount}
          initialPageNo={currentPageNo}
          numOfRows={ITEMS_PER_PAGE}
          currentMainRegion={currentMainRegion}
          currentSubRegion={currentSubRegion}
          currentItemName={currentItemName}
        />
      )}
    </main>
  );
}