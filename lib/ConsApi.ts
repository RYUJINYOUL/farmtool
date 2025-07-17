// app/lib/api.ts

import { hierarchicalRegions } from '@/lib/constants'; // hierarchicalRegions 임포트

// API 응답 데이터 타입 정의 (실제 응답에 맞춰 상세화)
export interface CompanyItem {
  ncrAreaDetailName: string; // 등록시군구
  ncrAreaName: string;       // 등록시도
  ncrGsAddr: string;         // 소재지
  ncrGsDate: number;         // 등록일자 (공시일자)
  ncrGsFlag: string;         // 공시내용구분
  ncrGsKname: string;        // 업체명
  ncrGsMaster: string;       // 업체대표자명 (추가)
  ncrGsNumber: string;       // 공고번호
  ncrGsReason: string;       // 변경사유철회
  ncrGsRegdate: number;      // 공시일자
  ncrGsSeq: number;          // 공시일련번호
  ncrItemName: string;       // 등록업종
  ncrItemregno: string;      // 업종등록번호
  ncrMasterNum: number;      // 사업자등록번호 (추가)
  ncrOffTel: string;         // 전화번호
}

export interface ApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: CompanyItem[] | CompanyItem; // 단일 객체일 경우도 대비
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 환경 변수에서 서비스 키를 가져옵니다.
// .env.local 파일에 NEXT_PUBLIC_API_SERVICE_KEY=YOUR_SERVICE_KEY 형태로 저장해야 합니다.
const SERVICE_KEY = process.env.NEXT_PUBLIC_API_SERVICE_KEY;
const BASE_URL = 'https://apis.data.go.kr/1613000/ConAdminInfoSvc1/GongsiReg';

export async function fetchCompanyData(
  mainRegion: string = '',
  subRegion: string = '',
  itemName: string = '',
  pageNo: number = 1,
  numOfRows: number = 20 // 한 페이지당 20개 항목으로 고정
): Promise<{ data: CompanyItem[], totalCount: number, error: string | null }> {
  try {
    // 선택된 mainRegion의 apiName을 찾습니다.
    const selectedRegionData = hierarchicalRegions.find(
      (region) => region.name === mainRegion
    );
    // '전국'이거나 찾지 못하면 apiName은 빈 문자열
    const apiRegionName = selectedRegionData ? selectedRegionData.apiName : '';

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY || '', // 환경 변수가 없을 경우 빈 문자열 처리 (안전장치)
      pageNo: String(pageNo),
      numOfRows: String(numOfRows),
      sDate: '20151201', // 고정된 시작 날짜
      eDate: '20250713', // 고정된 종료 날짜 (현재 날짜)
      _type: 'json',
    });

    // 지역 파라미터 추가 (apiName이 존재하고 '전국'이 아닐 때)
    if (apiRegionName && mainRegion !== '전국') {
      params.append('ncrAreaName', apiRegionName);
    }
    // 소분류 파라미터 추가
    if (subRegion && subRegion !== '전체') {
      params.append('ncrAreaDetailName', subRegion);
    }
    // 업종명 파라미터 추가
    if (itemName && itemName !== '전체') {
      params.append('ncrItemName', itemName);
    }

    const url = `${BASE_URL}?${params.toString()}`;
    console.log(`API 호출 URL: ${url}`); // 디버깅용

    const response = await fetch(url, { next: { revalidate: 3600 } }); // 1시간마다 데이터 재검증
    
    if (!response.ok) {
      const errorText = await response.text(); // 오류 응답의 텍스트 내용을 가져옴
      console.error(`HTTP 오류! 상태: ${response.status}, 응답 텍스트: ${errorText}`);
      throw new Error(`API 요청 실패: ${response.status} - ${errorText.substring(0, 100)}...`);
    }

    const responseText = await response.text();
    // console.log("API 응답 Raw Text:", responseText.substring(0, 500)); // 디버깅용: 응답 텍스트 확인

    let result: ApiResponse;
    try {
      result = JSON.parse(responseText); // 직접 JSON.parse를 사용하여 파싱 오류를 명확히 잡음
    } catch (jsonError: any) {
      console.error("JSON 파싱 오류:", jsonError);
      throw new Error(`응답이 유효한 JSON이 아닙니다. 응답 시작: ${responseText.substring(0, 100)}...`);
    }

    if (result.response.header.resultCode !== '00') {
      throw new Error(`API 오류: ${result.response.header.resultMsg}`);
    }

    let items: CompanyItem[] = [];
    let totalCount = 0;

    // API 응답 구조가 'item' 배열 또는 단일 객체일 수 있으므로 처리
    if (result.response.body.items && result.response.body.items.item) {
      const rawItems = result.response.body.items.item;
      items = Array.isArray(rawItems) ? rawItems : [rawItems];
      totalCount = result.response.body.totalCount;
    }

    // 서버 컴포넌트에서 추가 필터링 (API 필터링이 불완전할 경우 대비)
    // API가 정확히 필터링해주지 않는다면 이 로직은 여전히 유용합니다.
    let filteredItems = items;
    if (mainRegion && mainRegion !== '전국' && selectedRegionData) {
      filteredItems = filteredItems.filter(item => item.ncrAreaName === selectedRegionData.apiName);
    }
    if (subRegion && subRegion !== '전체') {
      filteredItems = filteredItems.filter(item => item.ncrAreaDetailName === subRegion);
    }
    if (itemName && itemName !== '전체') {
      filteredItems = filteredItems.filter(item => item.ncrItemName === itemName);
    }

    return { data: filteredItems, totalCount, error: null };

  } catch (error: any) {
    console.error('API 호출 또는 처리 중 심각한 오류 발생:', error);
    return { data: [], totalCount: 0, error: error.message || '데이터를 가져오는 데 실패했습니다.' };
  }
}