// app/components/ClientCompanyList.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCompanyData, CompanyItem } from '@/lib/ConsApi';

interface ClientCompanyListProps {
  initialCompanies: CompanyItem[];
  initialTotalCount: number; // 이 totalCount는 itemName 필터가 적용되지 않은 전체 개수
  initialPageNo: number;
  numOfRows: number;
  currentMainRegion: string;
  currentSubRegion: string;
  currentItemName: string; // 클라이언트 측 필터링에 사용
}

export default function ClientCompanyList({
  initialCompanies,
  initialTotalCount,
  initialPageNo,
  numOfRows,
  currentMainRegion,
  currentSubRegion,
  currentItemName,
}: ClientCompanyListProps) {
  // rawCompanies는 API에서 가져온 모든 회사 목록 (itemName 필터링 전)
  const [rawCompanies, setRawCompanies] = useState<CompanyItem[]>(initialCompanies);
  const [apiTotalCount, setApiTotalCount] = useState(initialTotalCount); // API가 반환한 총 개수 (itemName 필터링 전)
  const [currentPage, setCurrentPage] = useState(initialPageNo);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 선택된 itemName에 따라 필터링된 회사 목록을 useMemo로 캐싱
  const filteredCompanies = useMemo(() => {
    if (currentItemName && currentItemName !== '전체') {
      return rawCompanies.filter(company => company.ncrItemName === currentItemName);
    }
    return rawCompanies;
  }, [rawCompanies, currentItemName]);

  // 필터링된 회사 목록의 실제 개수 (현재 로드된 데이터 내에서)
  // const filteredTotalCount = filteredCompanies.length; // 이제 이 변수는 직접 사용하지 않습니다.

  // 새로운 검색 조건이 적용될 때마다 상태를 초기화합니다.
  useEffect(() => {
    setRawCompanies(initialCompanies);
    setApiTotalCount(initialTotalCount);
    setCurrentPage(initialPageNo);
    setError(null);
  }, [initialCompanies, initialTotalCount, initialPageNo, currentMainRegion, currentSubRegion, currentItemName]);

  const loadMoreCompanies = useCallback(async () => {
    if (isLoading) return;

    // rawCompanies의 길이가 apiTotalCount보다 크거나 같으면 더 이상 로드할 데이터가 없습니다.
    if (rawCompanies.length >= apiTotalCount && apiTotalCount > 0) {
      console.log("더 이상 로드할 데이터가 없습니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const { data, totalCount: newApiTotalCount, error: fetchError } = await fetchCompanyData(
        currentMainRegion,
        currentSubRegion,
        '', // itemName은 API 호출에서 제외 (클라이언트 필터링)
        nextPage,
        numOfRows
      );

      if (fetchError) {
        setError(fetchError);
      } else {
        setRawCompanies((prevCompanies) => [...prevCompanies, ...data]);
        setApiTotalCount(newApiTotalCount);
        setCurrentPage(nextPage);
      }
    } catch (err: any) {
      console.error("더 많은 회사 정보를 가져오는 데 실패했습니다:", err);
      setError(err.message || "더 많은 데이터를 로드하는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rawCompanies.length, apiTotalCount, isLoading, currentMainRegion, currentSubRegion, numOfRows]);

  // '더보기' 버튼 표시 여부: rawCompanies의 길이가 apiTotalCount보다 작아야 합니다.
  const hasMore = rawCompanies.length < apiTotalCount;

  return (
    <div>
      {error ? (
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em' }}>오류 발생: {error}</p>
      ) : filteredCompanies.length === 0 && !isLoading && rawCompanies.length === apiTotalCount ? ( // 필터링된 결과가 없고, 모든 데이터를 로드했으며, 로딩 중이 아닐 때
        <p style={{ fontSize: '1.1em', color: '#666' }}>선택된 조건에 해당하는 업체 정보가 없습니다.</p>
      ) : (
        <div>
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '20px', color: '#444' }}>
            총 {apiTotalCount}건 중 {filteredCompanies.length}건 표시 ({currentMainRegion || '전체'} {currentSubRegion || ''} - {currentItemName || '전체'})
          </p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {/* key를 ncrGsSeq와 index를 조합한 형태로 변경하여 고유성을 확보합니다. */}
            {filteredCompanies.map((company, index) => (
              <li 
                key={`${company.ncrGsSeq}-${index}`} // ncrGsSeq가 중복될 경우 index로 고유성을 보장
                style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginBottom: '15px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <h3 style={{ color: '#0056b3', marginTop: 0, marginBottom: '10px', fontSize: '1.5em' }}>{company.ncrGsKname}</h3>
                <p style={{ margin: '8px 0', fontSize: '1.05em' }}><strong>업종:</strong> {company.ncrItemName}</p>
                <p style={{ margin: '8px 0', fontSize: '1.05em' }}><strong>대표자명:</strong> {company.ncrGsMaster || '정보 없음'}</p>
                <p style={{ margin: '8px 0', fontSize: '1.05em' }}><strong>사업자등록번호:</strong> {company.ncrMasterNum || '정보 없음'}</p>
                <p style={{ margin: '8px 0', fontSize: '1.05em' }}><strong>주소:</strong> {company.ncrGsAddr} ({company.ncrAreaName} {company.ncrAreaDetailName})</p>
                <p style={{ margin: '8px 0', fontSize: '1.05em' }}><strong>전화번호:</strong> {company.ncrOffTel || '정보 없음'}</p>
                <p style={{ margin: '8px 0', fontSize: '0.95em', color: '#777' }}>
                  등록일: {company.ncrGsRegdate ? String(company.ncrGsRegdate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}
                </p>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={loadMoreCompanies}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#007bff',
                  color: 'white',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? '로딩 중...' : '더보기'}
              </button>
            </div>
          )}
          {!hasMore && filteredCompanies.length > 0 && !isLoading && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>모든 데이터를 불러왔습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
