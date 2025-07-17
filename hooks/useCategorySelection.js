
import { useState } from 'react';


export function useCategorySelection(formState, setFormState) {
  const [showRegionList, setShowRegionList] = useState(false); // 대분류 드롭다운
  const [subShowRegionList, setSubShowRegionList] = useState(false); // 소분류 드롭다운

  // 대분류 선택 핸들러
  const handleRegionClick = (region) => {
    setFormState(prev => ({
      ...prev,
      TopCategories: region,
      SubCategories: ['전체']
    }));
    setShowRegionList(false);
    // if (subCategory.find(r => r.name === region)?.subRegions.length > 0) {
    //   setSubShowRegionList(true);
    // } else {
    //   setSubShowRegionList(false);
    // }
  };

  // 소분류 선택 핸들러 (다중 선택 가능)
  const handleRegionClick2 = (name) => {
    setFormState(prev => {
      let nextSubRegions;
      if (name === "전체") {
        nextSubRegions = ["전체"];
      } else {
        nextSubRegions = prev.SubCategories.includes("전체") && prev.SubCategories.length === 1
          ? [name]
          : prev.SubCategories.includes(name)
            ? prev.SubCategories.filter(n => n !== name)
            : [...prev.SubCategories, name];

        if (nextSubRegions.length === 0) {
          nextSubRegions = ["전체"];
        }
      }
      return { ...prev, SubCategories: nextSubRegions };
    });
  };

  // 선택된 소분류 태그 제거 핸들러
  const handleSubRegionRemove = (nameToRemove) => {
    setFormState(prev => {
      let next = prev.SubCategories.filter(name => name !== nameToRemove);
      if (next.length === 0) {
        return { ...prev, SubCategories: ["전체"] };
      }
      return { ...prev, SubCategories: next };
    });
  };

  return {
    showRegionList,
    setShowRegionList,
    subShowRegionList,
    setSubShowRegionList,
    handleRegionClick,
    handleRegionClick2,
    handleSubRegionRemove,
    // subCategory // 필요하다면 subCategory 데이터도 함께 export
  };
}