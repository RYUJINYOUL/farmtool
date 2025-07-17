export function parseRegionAndSubRegion(fullAddress) {
    let region = '';
    let subRegion = '';
  
    const regions = [
      "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
      "대전광역시", "울산광역시", "세종특별자치시", "강원특별자치도", "경기도",
      "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도",
      "제주특별자치도"
    ];
  
    // 1. 주소에서 Region 추출
    for (const r of regions) {
      if (fullAddress.startsWith(r)) {
        region = r;
        break;
      }
    }
  
    if (!region) {
      return { region: '', subRegion: '' };
    }
  
    // 2. Region을 제외한 나머지 주소에서 SubRegion 추출 시도 (기존 로직 동일)
    const addressWithoutRegion = fullAddress.substring(region.length).trim();
    const partsAfterRegion = addressWithoutRegion.split(' ');
  
    if (region === "세종특별자치시") {
      subRegion = region;
    } else if (region === "제주특별자치도") {
      if (partsAfterRegion.length > 0 && 
          (partsAfterRegion[0].endsWith('시') || partsAfterRegion[0].endsWith('군') || partsAfterRegion[0].endsWith('구'))) {
        subRegion = partsAfterRegion[0];
      } else {
        subRegion = ''; 
      }
    } else {
      if (partsAfterRegion.length > 0) {
        const firstPart = partsAfterRegion[0];
        if (firstPart.endsWith('시') || firstPart.endsWith('군') || firstPart.endsWith('구')) {
          subRegion = firstPart;
        }
      }
    }
  
    // ★★★★ 여기부터 Region 값 변환 로직 추가 ★★★★
    const regionMap = {
      "서울특별시": "서울",
      "부산광역시": "부산",
      "대구광역시": "대구",
      "인천광역시": "인천",
      "광주광역시": "광주",
      "대전광역시": "대전",
      "울산광역시": "울산",
      "세종특별자치시": "세종", // 세종은 이미 짧으니 그대로 두거나, 필요에 따라 "세종시" 등으로 변경 가능
      "강원특별자치도": "강원",
      "경기도": "경기",
      "충청북도": "충청북도", // 원하는 짧은 이름이 있다면 "충북" 등으로 변경
      "충청남도": "충청남도", // 원하는 짧은 이름이 있다면 "충남" 등으로 변경
      "전라북도": "전라북도", // "전북"
      "전라남도": "전라남도", // "전남"
      "경상북도": "경상북도", // "경북"
      "경상남도": "경상남도", // "경남"
      "제주특별자치도": "제주"
    };
  
    // 맵에서 변환된 이름을 찾고, 없으면 원본 region 사용
    const mappedRegion = regionMap[region] || region;
    // ★★★★ 변환된 region 값을 반환 ★★★★
    return { region: mappedRegion, subRegion };
  }