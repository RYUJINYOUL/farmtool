// app/lib/ArchPmsApi.ts
import { hierarchicalRegions } from '@/lib/constants'; // hierarchicalRegions 임포트

// 건축 인허가 정보 API 응답 데이터 타입 정의 (실제 응답에 맞춰 상세화)
export interface ArchitecturalPermitItem {
  rnum: number;
  platPlc: string; // 대지위치
  sigunguCd: string; // 시군구코드
  bjdongCd: string; // 법정동코드
  platGbCd: string; // 대지구분코드
  bun: string; // 번
  ji: string; // 지
  mgmPmsrgstPk: number; // 관리허가대장고유키
  bldNm: string; // 건물명
  splotNm: string; // 특수지명
  block: string; // 블록
  lot: string; // 로트
  jimokCdNm: string; // 지목코드명
  jiyukCdNm: string; // 지역코드명
  jiguCdNm: string; // 지구코드명
  guyukCd: string; // 구역코드
  guyukCdNm: string; // 구역코드명
  jimokCd: string; // 지목코드
  jiyukCd: string; // 지역코드
  jiguCd: string; // 지구코드
  archGbCd: string; // 건축구분코드

  archGbCdNm: string; // 건축구분코드명
  platArea: number; // 대지면적
  archArea: number; // 건축면적
  bcRat: number; // 건폐율
  totArea: number; // 연면적
  vlRatEstmTotArea: number; // 용적률산정연면적
  vlRat: number; // 용적률
  mainBldCnt: number; // 주건축물수
  atchBldDongCnt: number; // 부속건축물동수
  mainPurpsCd: string; // 주용도코드
  mainPurpsCdNm: string; // 주용도코드명
  hhldCnt: number; // 세대수
  hoCnt: number; // 호수
  fmlyCnt: number; // 가구수
  totPkngCnt: number; // 총주차대수
  stcnsSchedDay: string; // 착공예정일
  stcnsDelayDay: string; // 착공연기일
  realStcnsDay: string; // 실제착공일
  archPmsDay: string; // 건축허가일
  useAprDay: string; // 사용승인일
  crtnDay: string; // 생성일자
  mgmHsrgstPk: number,
  purpsCd: string,
  purpsCdNm: string,
  strctCd: string,
  strctCdNm: string,
  totHhldCnt: number,
  demolExtngGbCd: string,
  demolExtngGbCdNm: string,
  demolStrtDay: string,
  demolEndDay: string,
  demolExtngDay: string,
  apprvDay: string,
  stcnsDay: string,
  useInsptSchedDay: string,
  useInsptDay: string,
}

export interface ArchitecturalPermitApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: ArchitecturalPermitItem[] | ArchitecturalPermitItem;
      };
      numOfRows: string;
      pageNo: string;
      totalCount: string;
    };
  };
}

// 법정동 코드 API 응답 데이터 타입 정의
export interface LegalDongItem {
  platplc_admn_nm: string;
  region_cd: string; // 10자리 법정동 코드 (예: 1168010300)
  sido_cd: string; // 시도 코드 (예: 11)
  sgg_cd: string; // 시군구 코드 (예: 680)
  umd_cd: string; // 읍면동 코드 (예: 103)
  ri_cd: string; // 리 코드 (예: 00)
  locatadd_nm: string; // 지역주소명 (예: 서울특별시 강남구 개포동)
  locatlow_nm: string; // 하위지역명 (예: 개포동)
  // 기타 필드...
}

// LegalDongApiResponse 인터페이스 수정
export interface LegalDongApiResponse {
  // 최상위에 StanReginCd 배열이 직접 있는 구조
  StanReginCd: Array<{ head?: any[]; row?: LegalDongItem[] }>;
  // 혹시 모를 다른 최상위 필드를 위한 인덱스 시그니처
  [key: string]: any;
}


// 공공데이터포털에서 발급받은 서비스 키를 환경 변수에서 가져옵니다.
// .env.local 파일에 NEXT_PUBLIC_ARCH_PMS_SERVICE_KEY=YOUR_SERVICE_KEY 형태로 저장해야 합니다.
const ARCH_PMS_SERVICE_KEY = process.env.NEXT_PUBLIC_API_SERVICE_KEY;

// 건축 인허가 정보 API 기본 URL
const ARCH_PMS_BASE_URL = 'https://apis.data.go.kr/1613000/HsPmsHubService/getHpBasisOulnInfo';
// 표준 행정구역 코드 API 기본 URL
const STAN_REGIN_CD_BASE_URL = 'http://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList';

/**
 * 특정 시군구 내의 법정동 코드 목록을 가져옵니다.
 * @param mainRegionName 시도 이름 (예: 서울특별시) - 클라이언트 필터링에 사용됩니다.
 * @param subRegionName 시군구 이름 (예: 강남구) - API의 locatadd_nm 파라미터에 사용됩니다.
 * @returns LegalDongItem[] 법정동 목록
 */
export async function HouseDongCodes(mainRegionName: string, subRegionName: string): Promise<{ data: LegalDongItem[], error: string | null }> {
  try {
    const params = new URLSearchParams({
      serviceKey: ARCH_PMS_SERVICE_KEY || '',
      pageNo: '1',
      numOfRows: '100', // 충분히 큰 값 설정
      type: 'json',
      locatadd_nm: subRegionName, // '강서구' 등으로 전달하여 해당 이름의 모든 시군구 동을 가져옵니다.
    });

    const url = `${STAN_REGIN_CD_BASE_URL}?${params.toString()}`;
    console.log(`법정동 코드 API 호출 URL: ${url}`);

    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP 오류! 상태: ${response.status}, 응답 텍스트: ${errorText}`);
      throw new Error(`API 요청 실패: ${response.status} - ${errorText.substring(0, 100)}...`);
    }

    const responseText = await response.text();
    let result: LegalDongApiResponse;
    try {
      result = JSON.parse(responseText);
    } catch (jsonError: any) {
      // JSON 파싱 실패 시, 응답이 XML 에러 메시지인지 확인
      if (responseText.startsWith('<OpenAPI_ServiceResponse>')) {
        const errMsgMatch = responseText.match(/<errMsg>(.*?)<\/errMsg>/);
        const returnAuthMsgMatch = responseText.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
        const errorMessage = errMsgMatch ? errMsgMatch[1] : '알 수 없는 API 서비스 오류';
        const authMessage = returnAuthMsgMatch ? returnAuthMsgMatch[1] : '인증 오류 메시지 없음';
        console.error(`법정동 API 응답이 JSON이 아닌 XML 오류 메시지입니다: ${errorMessage}, 인증 메시지: ${authMessage}`);
        throw new Error(`법정동 API 서비스 오류: ${errorMessage}. 서비스 키 또는 요청 파라미터를 확인해주세요. (인증 메시지: ${authMessage})`);
      }
      console.error("JSON 파싱 오류 (법정동):", jsonError);
      throw new Error(`응답이 유효한 JSON이 아닙니다. 응답 시작: ${responseText.substring(0, 100)}...`);
    }

    let rawItems: LegalDongItem[] = [];

    // 'StanReginCd[1].row' 구조로 직접 접근합니다.
    if (result.StanReginCd && Array.isArray(result.StanReginCd) && result.StanReginCd.length > 1 && result.StanReginCd[1].row) {
        rawItems = result.StanReginCd[1].row;
    }
    // 예비적으로, 만약 단일 객체로 반환될 가능성도 있다면 (API 문서에 따라 다름)
    // else if (result.StanReginCd && !Array.isArray(result.StanReginCd) && result.StanReginCd.row) {
    //     rawItems = result.StanReginCd.row; // 이 부분은 실제 API 응답 구조를 확인해야 합니다.
    // }


    if (rawItems.length > 0) {
      const uniqueDongs = new Map<string, LegalDongItem>();
      rawItems.forEach(item => {
        const fullAddress = item.locatadd_nm; // '서울특별시 강남구 역삼동'
        const dongName = item.locatlow_nm || (fullAddress ? fullAddress.split(' ').pop() : '');

        // mainRegionName 포함 여부를 필터링합니다.
        if (dongName && fullAddress && fullAddress.includes(mainRegionName)) {
            uniqueDongs.set(dongName, item);
        }
      });
      return { data: Array.from(uniqueDongs.values()), error: null };
    } else {
      console.warn("법정동 코드 API에서 유효한 데이터가 없거나 필터링 후 데이터가 없습니다:", result);
      return { data: [], error: "법정동 데이터를 찾을 수 없습니다." };
    }

  } catch (error: any) {
    console.error('법정동 코드 API 호출 또는 처리 중 오류 발생:', error);
    return { data: [], error: error.message || '법정동 데이터를 가져오는 데 실패했습니다.' };
  }
}


/**
 * 건축 인허가 정보를 가져옵니다.
 * @param sigunguCd 시군구 코드 (예: 11680)
 * @param bjdongCd 법정동 코드 (예: 10300)

 * @param pageNo 페이지 번호
 * @param numOfRows 한 페이지 결과 수
 * @returns ArchitecturalPermitItem[] 건축 인허가 목록
 */
export async function fetchArchitecturalPermitData(
  sigunguCd: string,
  bjdongCd: string,
  startDate: string,
  endDate: string,
  pageNo: number = 1,
  numOfRows: number = 25
): Promise<{ data: ArchitecturalPermitItem[], totalCount: number, error: string | null }> {
  try {
    const params = new URLSearchParams({
      serviceKey: ARCH_PMS_SERVICE_KEY || '',
      sigunguCd: sigunguCd,
      bjdongCd: bjdongCd,
      pageNo: String(pageNo),
      numOfRows: String(numOfRows),
      _type: 'json', // JSON 형식 요청 유지
      startDate: startDate,
      endDate: endDate,
    });

    const url = `${ARCH_PMS_BASE_URL}?${params.toString()}`;
    console.log(`건축 인허가 API 호출 URL: ${url}`);

    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP 오류! 상태: ${response.status}, 응답 텍스트: ${errorText}`);
      throw new Error(`API 요청 실패: ${response.status} - ${errorText.substring(0, 100)}...`);
    }

    const responseText = await response.text();
    let result: ArchitecturalPermitApiResponse;
    try {
      result = JSON.parse(responseText);
    } catch (jsonError: any) {
      // JSON 파싱 실패 시, 응답이 XML 에러 메시지인지 확인
      if (responseText.startsWith('<OpenAPI_ServiceResponse>')) {
        const errMsgMatch = responseText.match(/<errMsg>(.*?)<\/errMsg>/);
        const returnAuthMsgMatch = responseText.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);

        const errorMessage = errMsgMatch ? errMsgMatch[1] : '알 수 없는 API 서비스 오류';
        const authMessage = returnAuthMsgMatch ? returnAuthMsgMatch[1] : '인증 오류 메시지 없음';

        console.error(`API 응답이 JSON이 아닌 XML 오류 메시지입니다: ${errorMessage}, 인증 메시지: ${authMessage}`);
        throw new Error(`API 서비스 오류: ${errorMessage}. 서비스 키 또는 요청 파라미터를 확인해주세요. (인증 메시지: ${authMessage})`);
      }
      // 그 외의 JSON 파싱 오류
      console.error("JSON 파싱 오류 (건축 인허가):", jsonError);
      throw new Error(`응답이 유효한 JSON이 아닙니다. 응답 시작: ${responseText.substring(0, 100)}...`);
    }

    if (result.response.header.resultCode !== '00') {
      throw new Error(`API 오류: ${result.response.header.resultMsg}`);
    }

    let items: ArchitecturalPermitItem[] = [];
    let totalCount = 0;

    if (result.response.body.items && result.response.body.items.item) {
      const rawItems = result.response.body.items.item;
      items = Array.isArray(rawItems) ? rawItems : [rawItems]; // 단일 객체일 경우 배열로 변환
      totalCount = parseInt(result.response.body.totalCount, 10);
    }

    return { data: items, totalCount, error: null };

  } catch (error: any) {
    console.error('건축 인허가 API 호출 또는 처리 중 오류 발생:', error);
    return { data: [], totalCount: 0, error: error.message || '건축 인허가 데이터를 가져오는 데 실패했습니다.' };
  }
}
