// app/components/SearchControls.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hierarchicalRegions, industryNames } from '@/lib/constants';

interface SearchControlsProps {
  initialMainRegion?: string;
  initialSubRegion?: string;
  initialItemName?: string;
  initialPageNo?: number; // Keep this for initial URL param sync
  totalCount: number; // Still passed, but not used for page calculation in this component
  numOfRows: number; // Still passed, but not used for page calculation in this component
}

export default function SearchControls({
  initialMainRegion = '서울',
  initialSubRegion = '강남구',
  initialItemName = '',
  initialPageNo = 1, // Keep for initial sync
  totalCount,
  numOfRows,
}: SearchControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedMainRegion, setSelectedMainRegion] = useState(
    searchParams.get('mainRegion') || initialMainRegion
  );
  const [selectedSubRegion, setSelectedSubRegion] = useState(
    searchParams.get('subRegion') || initialSubRegion
  );
  const [selectedItemName, setSelectedItemName] = useState(
    searchParams.get('itemName') || initialItemName
  );

  const [tempMainRegion, setTempMainRegion] = useState(selectedMainRegion);
  const [tempSubRegion, setTempSubRegion] = useState(selectedSubRegion);
  const [tempItemName, setTempItemName] = useState(selectedItemName);

  useEffect(() => {
    setTempMainRegion(selectedMainRegion);
    setTempSubRegion(selectedSubRegion);
    setTempItemName(selectedItemName);
  }, [selectedMainRegion, selectedSubRegion, selectedItemName]);

  const applySearchParams = (
    newMainRegion: string,
    newSubRegion: string,
    newItemName: string
  ) => {
    const newSearchParams = new URLSearchParams();

    newSearchParams.set('mainRegion', newMainRegion);
    if (newSubRegion) {
      newSearchParams.set('subRegion', newSubRegion);
    }
    if (newItemName && newItemName !== '전체') {
      newSearchParams.set('itemName', newItemName);
    }
    newSearchParams.set('pageNo', '1'); // Always reset to page 1 on new search

    setSelectedMainRegion(newMainRegion);
    setSelectedSubRegion(newSubRegion);
    setSelectedItemName(newItemName);

    router.push(`/construction/?${newSearchParams.toString()}`);
  };

  const handleTempMainRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mainRegionName = event.target.value;
    setTempMainRegion(mainRegionName);
    setTempSubRegion('');
  };

  const handleTempSubRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTempSubRegion(event.target.value);
  };

  const handleTempItemNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTempItemName(event.target.value);
  };

  const handleSearchClick = () => {
    applySearchParams(tempMainRegion, tempSubRegion, tempItemName); // No page number needed here for infinite scroll
  };

  // currentMainRegionData and subRegions calculation remain the same
  const currentMainRegionData = hierarchicalRegions.find(
    (region) => region.name === tempMainRegion
  );
  const subRegions = currentMainRegionData ? currentMainRegionData.subRegions : [];

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
        {/* 대분류 선택 드롭다운 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label htmlFor="main-region-select" style={{ fontWeight: 'bold' }}>대분류:</label>
          <select id="main-region-select" value={tempMainRegion} onChange={handleTempMainRegionChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
           
            {hierarchicalRegions.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* 소분류 선택 드롭다운 (전국이 아니고 소분류가 있는 경우에만 표시) */}
        {tempMainRegion && tempMainRegion !== '전국' && subRegions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label htmlFor="sub-region-select" style={{ fontWeight: 'bold' }}>소분류:</label>
            <select id="sub-region-select" value={tempSubRegion} onChange={handleTempSubRegionChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">전체</option>
              {subRegions.map((subRegion) => (
                <option key={subRegion} value={subRegion}>
                  {subRegion}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 업종명 선택 드롭다운 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label htmlFor="item-name-select" style={{ fontWeight: 'bold' }}>업종명:</label>
          <select id="item-name-select" value={tempItemName} onChange={handleTempItemNameChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {industryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearchClick}
          style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid #28a745', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', marginLeft: '10px' }}
        >
          검색
        </button>
      </div>

      {/* Pagination controls are removed from SearchControls for "load more" */}
    </div>
  );
}