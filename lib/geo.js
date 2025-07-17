// src/lib/geo.js
"use server"

export async function getAddress (addr){
    const baseUrl = process.env.V_URL // VWorld 검색 API URL
    const apiKey = process.env.V_KEY;

    const fetchVWorldSearch = async (type, query, categoryType = null) => {
        const params = {
            'key' : apiKey,
            'request': 'search',
            'type': type,
            'query': query,
            'size': "10",
        };

        if (categoryType) {
            params.category = categoryType;
        }

        const queryString = new URLSearchParams(params).toString();
        const requrl = `${baseUrl}?${queryString}`;
        console.log(`getAddress Request URL (Type: ${type}, Category: ${categoryType || 'N/A'}):`, requrl);

        try {
            const data = await fetch(requrl)
            if (!data.ok) {
                const errorBody = await data.text();
                console.error(`API call failed for Type: ${type}, Category: ${categoryType || 'N/A'} with status ${data.status}: ${errorBody}`);
                return [];
            }
            const posts = await data.json()

            console.log(`getAddress Response (Type: ${type}, Category: ${categoryType || 'N/A'}):`, posts) // 개발 시 디버깅용

            return posts.response?.result?.items || [];
        } catch (error) {
            console.error(`Error in getAddress for Type: ${type}, Category: ${categoryType || 'N/A'}:`, error);
            throw error;
        }
    };

    let allResults = [];

    try {
        const roadResults = await fetchVWorldSearch('ADDRESS', addr, 'ROAD');
        allResults = [...allResults, ...roadResults];

        const parcelResults = await fetchVWorldSearch('ADDRESS', addr, 'PARCEL');
        allResults = [...allResults, ...parcelResults];

        const placeResults = await fetchVWorldSearch('PLACE', addr);
        allResults = [...allResults, ...placeResults];

        const uniqueResults = [];
        const seenJuso = new Set();

        for (const item of allResults) {
            let juso = '';
            let x = ''; // 초기화
            let y = ''; // 초기화

            // ADDRESS 타입 응답 처리
            // item.address가 객체이고, 그 안에 category, road, parcel, bldnm 필드가 있는 경우
            if (item.address && typeof item.address === 'object') {
                if (item.address.category === 'ROAD' && item.address.road) {
                    juso = item.address.road;
                } else if (item.address.category === 'PARCEL' && item.address.parcel) {
                    juso = item.address.parcel;
                }
                // 주소가 정확히 로드/지번으로 매핑되지 않아도 건물명이라도 가져옴
                if (!juso && item.address.bldnm) {
                    juso = item.address.bldnm;
                }
                // address 객체 안에 point가 있다면 위경도 우선 사용
                if (item.address.point) {
                    x = item.address.point.x;
                    y = item.address.point.y;
                }
            }

            // PLACE 타입 또는 ADDRESS 타입에서 위 `item.address` 조건으로 juso를 찾지 못한 경우
            // VWorld API의 PLACE 검색 결과는 item.text, item.name 등에 주소/이름이 올 수 있습니다.
            // 위경도는 item.point에 직접 있을 가능성이 높습니다.
            if (!juso) { // 아직 juso를 찾지 못했다면
                if (item.text) {
                    juso = item.text;
                } else if (item.name) {
                    juso = item.name;
                } else if (item.bldnm) { // PLACE 타입에서 건물명 필드가 직접 노출될 수 있음
                    juso = item.bldnm;
                }
            }

            // 위경도 정보는 item.point에 직접 있거나, item.address.point에 있을 수 있습니다.
            // 이미 item.address.point에서 가져왔다면 덮어쓰지 않도록 `x`, `y`가 비어있을 때만 시도
            if (!x && !y && item.point) {
                x = item.point.x;
                y = item.point.y;
            }

            // 최종적으로 유효한 juso, x, y가 모두 존재하고, 이전에 처리된 juso가 아닌 경우에만 추가
            if (juso && x && y && !seenJuso.has(juso)) {
                seenJuso.add(juso);
                uniqueResults.push({
                    juso: juso,
                    x: x,
                    y: y
                });
            } else if (juso && (!x || !y)) {
                // 주소는 있는데 위경도가 없는 경우 경고 (디버깅용)
                console.warn(`Result found for "${juso}" but coordinates (x, y) are missing. Item:`, item);
            }
        }

        console.log("Final Unique Results:", uniqueResults); // 최종 반환될 결과 확인

        return uniqueResults;
    } catch (error) {
        console.error("Error in getAddress (overall):", error);
        throw error;
    }
}


export async function getAddressByLatLon(lon, lat) {
    const baseUrl = process.env.V_URL2;
    const apiKey = process.env.V_KEY;
  
    let allResults = [];
  
    // 1. 도로명 주소 검색 시도
    try {
      const roadParams = {
        service: 'address',
        request: 'getAddress',
        key: apiKey,
        point: `${lon},${lat}`,
        type: 'ROAD', // 도로명 주소
        crs: 'EPSG:4326' // 명시적으로 WGS84 좌표계 지정
      };
      const roadQueryString = new URLSearchParams(roadParams).toString();
      const roadReqUrl = `${baseUrl}?${roadQueryString}`;
      console.log("getAddressByLatLon Request URL (ROAD):", roadReqUrl);
  
      const roadRes = await fetch(roadReqUrl);
      if (!roadRes.ok) {
          const errorBody = await roadRes.text();
          console.error(`API call failed for ROAD with status ${roadRes.status}: ${errorBody}`);
          // 에러를 던지지 않고 다음 타입 시도
      } else {
          const roadData = await roadRes.json();
          console.log("getAddressByLatLon Response (ROAD):", roadData);
          if (roadData?.response?.status === 'OK' && roadData.response.result) {
              allResults = [...allResults, ...roadData.response.result];
          }
      }
    } catch (error) {
      console.error("Error fetching ROAD address:", error);
    }
  
    // 2. 지번 주소 검색 시도 (ROAD에서 못 찾았을 경우 대비)
    // VWorld reverse geocoding API가 type에 따라 응답 구조가 다를 수 있으므로,
    // 하나의 API 호출로 충분하다면 아래 PARCEL 호출은 생략할 수도 있습니다.
    // 하지만 명확히 분리하여 시도하는 것이 좋습니다.
    try {
      const parcelParams = {
        service: 'address',
        request: 'getAddress',
        key: apiKey,
        point: `${lon},${lat}`,
        type: 'PARCEL', // 지번 주소
        crs: 'EPSG:4326' // 명시적으로 WGS84 좌표계 지정
      };
      const parcelQueryString = new URLSearchParams(parcelParams).toString();
      const parcelReqUrl = `${baseUrl}?${parcelQueryString}`;
      console.log("getAddressByLatLon Request URL (PARCEL):", parcelReqUrl);
  
      const parcelRes = await fetch(parcelReqUrl);
      if (!parcelRes.ok) {
          const errorBody = await parcelRes.text();
          console.error(`API call failed for PARCEL with status ${parcelRes.status}: ${errorBody}`);
      } else {
          const parcelData = await parcelRes.json();
          console.log("getAddressByLatLon Response (PARCEL):", parcelData);
          if (parcelData?.response?.status === 'OK' && parcelData.response.result) {
              allResults = [...allResults, ...parcelData.response.result];
          }
      }
    } catch (error) {
      console.error("Error fetching PARCEL address:", error);
    }
  
  
    if (allResults.length === 0) {
        // 모든 시도 후에도 결과가 없으면 빈 배열 반환
        console.warn(`No address found for coordinates: ${lon}, ${lat}`);
        return [];
    }
  
    // 중복 제거 및 최종 결과 형식 맞추기
    const uniqueResults = [];
    const seenJuso = new Set();
  
    for (const item of allResults) {
        const roadAddress = item.structure?.road_address;
        const parcelAddress = item.structure?.parcel_address;
  
        let juso = "";
        let extractedX = item.x || lon; // item.x 필드가 있다면 사용, 없으면 초기론값 사용
        let extractedY = item.y || lat; // item.y 필드가 있다면 사용, 없으면 초기랏값 사용
  
        if (roadAddress) {
            // road_address의 full_road_name을 우선 사용하고, 없으면 address, text 순으로 시도
            juso = roadAddress.full_road_name || roadAddress.address || item.text || "";
            extractedX = roadAddress.x || extractedX;
            extractedY = roadAddress.y || extractedY;
        } else if (parcelAddress) {
            // parcel_address의 full_parcel_name을 우선 사용하고, 없으면 address, text 순으로 시도
            juso = parcelAddress.full_parcel_name || parcelAddress.address || item.text || "";
            extractedX = parcelAddress.x || extractedX;
            extractedY = parcelAddress.y || extractedY;
        } else {
            // structure가 없는 경우 item.text 등 직접적인 필드 확인 (PLACE 타입에서 얻은 주소일 수 있음)
            juso = item.text || "주소 정보 없음"; // 기본값 설정
        }
  
        if (juso && juso !== "주소 정보 없음" && extractedX && extractedY && !seenJuso.has(juso)) {
            seenJuso.add(juso);
            uniqueResults.push({
                juso: juso,
                x: extractedX,
                y: extractedY
            });
        }
    }
  
    // `map` 대신 `filter`를 사용하여 유효하지 않은 항목 제거
    return uniqueResults.filter(item => item.juso && item.juso !== "주소 정보 없음");
  }