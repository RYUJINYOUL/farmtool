// lib/constants.js

export const saram = [
    "전체",
    "형틀목공", "철근공", "콘크리트공", "비계공", "해체공", "미장공", "조적공", "타일공", "석공", "도장공", "방수공", "도배공", "실내건축공", "목재창호공", "창호설치공", 
    "지붕판금공", "온돌공", "기계설비공", "전기공", "정보통신공", "소방설비공",  "상하수도설비공", "가스시설공", "조경공", "보링공/그라우팅공", "파일공", "포장공", "용접공",
    "중장비 운전원", "엘리베이터 설치공", "수중공"
  ];
  
  export const regions = [
    "전국", "서울", "인천", "부산", "광주광역시", "대전", "대구", "세종", "울산", "경기", "강원", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주"
  ];
  
 
  export const equipment = [
    "불도저", "모터그레이더", "로더", "스크레이퍼", "크레인형 굴착기", "굴착기", "항타기 및 항발기", "천공용 건설기계", "덤프트럭", "고소작업대",
        "샌드드레인머신, 페이퍼드레인머신, 팩드레인머신", "타이어롤러, 매커덤롤러, 탠덤롤러", "버킷준설선, 그래브준설선, 펌프준설선",
        "콘크리트 펌프카", "콘크리트 믹서 트럭", "아스팔트 살포기, 아스팔트 피니셔", "콘크리트 살포기, 콘크리트 피니셔", "지게차"
  ];

  export const hierarchicalRegions = [
    { name: "전국", code: "ALL", apiName: "", subRegions: [] }, // '전국'은 API에 지역 파라미터를 보내지 않으므로 apiName은 비워둠
    { name: "서울", code: "11", apiName: "서울", subRegions: ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"] },
    { name: "부산", code: "26", apiName: "부산", subRegions: ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"] },
    { name: "대구", code: "27", apiName: "대구", subRegions: ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"] },
    { name: "인천", code: "28", apiName: "인천", subRegions: ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"] },
    { name: "광주광역시", code: "29", apiName: "광주", subRegions: ["광산구", "남구", "동구", "북구", "서구"] }, // UI는 '광주', API는 '광주광역시'
    { name: "대전", code: "30", apiName: "대전", subRegions: ["대덕구", "동구", "서구", "유성구", "중구"] },
    { name: "울산", code: "31", apiName: "울산", subRegions: ["남구", "동구", "북구", "울주군", "중구"] },
    { name: "세종", code: "36", apiName: "세종시", subRegions: ["세종특별자치시"] }, // API는 '세종시'로 인식할 가능성 (확인 필요)
    { name: "경기", code: "41", apiName: "경기", subRegions: ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"] },
    { name: "강원", code: "42", apiName: "강원", subRegions: ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"] },
    { name: "충청북도", code: "43", apiName: "충북", subRegions: ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"] }, // UI는 '충북', API는 '충청북도'
    { name: "충청남도", code: "44", apiName: "충남", subRegions: ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"] }, // UI는 '충남', API는 '충청남도'
    { name: "전라북도", code: "45", apiName: "전북", subRegions: ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"] }, // UI는 '전북', API는 '전라북도'
    { name: "전라남도", code: "46", apiName: "전남", subRegions: ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"] }, // UI는 '전남', API는 '전라남도'
    { name: "경상북도", code: "47", apiName: "경북", subRegions: ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"] }, // UI는 '경북', API는 '경상북도'
    { name: "경상남도", code: "48", apiName: "경남", subRegions: ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "함천군"] }, // UI는 '경남', API는 '경상남도'
    { name: "제주", code: "50", apiName: "제주", subRegions: ["서귀포시", "제주시"] },
  ];


  export const industryNames = [
    "전체",
    "토목공사업", 
    "건축공사업", 
    "토목건축공사업", 
    "조경공사업", 
    "지반조성ㆍ포장공사업", 
    "정보통신공사업", 
    "환경전문공사업", 
    "전기공사업",
    "일반소방시설공사업", 
    "전문소방시설공사업", 
    "조경식재ㆍ시설물공사업", 
    "도장ㆍ습식ㆍ방수ㆍ석공사업",
    "실내건축공사업", 
    "철근ㆍ콘크리트공사업", 
    "금속창호ㆍ지붕건축물조립공사업지하수개발", 
    "구조물해체ㆍ비계공사업",
    "상ㆍ하수도설비공사업", 
    "철강구조물공사업", 
    "수중ㆍ준설공사업", 
    "승강기ㆍ삭도공사업", 
    "가스난방공사업",  
    "산림조합", 
    "산림사업법인(산림토목)",
    "산림사업법인(숲가꾸기 및 병해충방제)",
    "폐기물종합처분업", 
    "폐기물수집·운반업", 
    "건설폐기물 중간처리업"
  ];



  export const industryNames2 = [
  "기계설비ㆍ가스공사업",
  "건축공사업",
  "구조물해체ㆍ비계공사업",
  "철근ㆍ콘크리트공사업",
  "조경식재ㆍ시설물공사업",
  "지반조성ㆍ포장공사업",
  "실내건축공사업",
  "도장ㆍ습식ㆍ방수ㆍ석공사업",
  "상ㆍ하수도설비공사업",
  "산업ㆍ환경설비공사업",
  "가스ㆍ난방공사업",
  "금속ㆍ창호ㆍ지붕ㆍ건축물조립공사업",
  "철강구조물공사업",
  "수중ㆍ준설공사업",
  "조경공사업",
  "토목공사업",
  "승강기ㆍ삭도공사업",
  "토목건축공사업",

  "포장공사업",
  "조경식재공사업",
  "조경시설물설치공사업",
  "가스시설시공업 제2종",
  "가스시설시공업 제3종",
  "난방시공업 제2종",
  "철도ㆍ궤도공사업",
  "시설물유지관리업",
  "도장공사업",
  "석공사업",
  "습식ㆍ방수공사업",
  "토공사업",
  "기계설비공사업",
  "금속구조물ㆍ창호ㆍ온실공사업",
  
  "비계ㆍ구조물해체공사업",
  "보링ㆍ그라우팅공사업",
  "강구조물공사업",
  "승강기설치공사업",
  "난방시공업 제1종",
  "지붕판금ㆍ건축물조립공사업",
  "난방시공업 제3종",
  "가스시설시공업 제1종",
  "수중공사업",
  "삭도설치공사업",
  "준설공사업"
];




  export const category = [
    "전체", "건설업", "전문인력", "건설장비", "건설자재"
  ];


  export const KOREAN_TO_ENGLISH_CATEGORIES = {
    '전문인력': 'professionals',
    '건설업': 'construction',
    '건설장비': 'equipment',
    '건설자재': 'materials',
    // ... 필요한 다른 카테고리 매핑 추가
  };


  export const KOREAN_TO_ENGLISH_APPLY = {
    '전문인력': 'proApply',
    '건설업': 'conApply',
    '건설장비': 'equipApply',
    '건설자재': 'matApply',
    // ... 필요한 다른 카테고리 매핑 추가
  };
  
  export const subCategory = [
    { name: "건설업", code: "11", 
      subRegions: ["토목공사업", "건축공사업", "토목건축공사업", "조경공사업", "지반조성ㆍ포장공사업", "정보통신공사업", "환경전문공사업", "전기공사업",
      "일반소방시설공사업", "전문소방시설공사업", "조경식재ㆍ시설물공사업", "도장ㆍ습식ㆍ방수ㆍ석공사업",
      "실내건축공사업", "철근ㆍ콘크리트공사업", "금속창호ㆍ지붕건축물조립공사업지하수개발", "구조물해체ㆍ비계공사업",
      "상ㆍ하수도설비공사업", "철강구조물공사업", "수중ㆍ준설공사업", "승강기ㆍ삭도공사업", "가스난방공사업",  "산림조합", "산림사업법인(산림토목)", "산림사업법인(숲가꾸기 및 병해충방제)",
      "폐기물종합처분업", "폐기물수집·운반업", "건설폐기물 중간처리업"] },
  
    { name: "전문인력", code: "26", 
      subRegions: ["형틀목공", "철근공", "콘크리트공", "비계공", "해체공", "미장공", "조적공", "타일공", "석공", "도장공", "방수공", "도배공", "실내건축공", "목재창호공", "창호설치공", 
      "지붕판금공", "온돌공", "기계설비공", "전기공", "정보통신공", "소방설비공",  "상하수도설비공", "가스시설공", "조경공", "보링공/그라우팅공", "파일공", "포장공", "용접공",
      "중장비 운전원", "엘리베이터 설치공", "수중공"] },
  
    { name: "건설장비", code: "27", 
      subRegions: ["불도저", "모터그레이더", "로더", "스크레이퍼", "크레인형 굴착기", "굴착기", "항타기 및 항발기", "천공용 건설기계", 
        "샌드드레인머신, 페이퍼드레인머신, 팩드레인머신", "타이어롤러, 매커덤롤러, 탠덤롤러", "버킷준설선, 그래브준설선, 펌프준설선",
        "콘크리트 펌프카", "덤프트럭", "콘크리트 믹서 트럭", "아스팔트 살포기, 아스팔트 피니셔", "콘크리트 살포기, 콘크리트 피니셔", "고소작업대", "지게차"
      ] },
  
    { name: "건설자재", code: "28", 
      subRegions: ["토목공사업", "건축공사업", "토목건축공사업", "조경공사업", "지반조성ㆍ포장공사업", "정보통신공사업", "환경전문공사업", "전기공사업",
      "일반소방시설공사업", "전문소방시설공사업", "조경식재ㆍ시설물공사업", "도장ㆍ습식ㆍ방수ㆍ석공사업",
      "실내건축공사업", "철근ㆍ콘크리트공사업", "금속창호ㆍ지붕건축물조립공사업지하수개발", "구조물해체ㆍ비계공사업",
      "상ㆍ하수도설비공사업", "철강구조물공사업", "수중ㆍ준설공사업", "승강기ㆍ삭도공사업", "가스난방공사업",  "산림조합", "산림사업법인(산림토목)", "산림사업법인(숲가꾸기 및 병해충방제)",
      "폐기물종합처분업", "폐기물수집·운반업", "건설폐기물 중간처리업"] },
  ];


  // lib/constants.js

export const CATEGORY_SPECIFIC_FIELDS = {
  'professionals': [
    { id: 'professionals_name', placeholder: '성명 및 회사명', type: 'text', component: 'input' },
    { id: 'professionals_certificate', placeholder: '자격증 및 자격 여부', type: 'text', component: 'input'},
    { id: 'professionals_career', placeholder: '경력사항 및 간단 소개', type: 'textarea', component: 'textarea', rows: 3, required: true },
    { id: 'professionals_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
  ],
  'construction': [
    { id: 'construction_name', placeholder: '회사명', type: 'text', component: 'input' },
    { id: 'construction_businessLicense', placeholder: '사업자등록번호', type: 'text', component: 'input', required: true },
    { id: 'construction_constructionExperience', placeholder: '회사연혁및주요연혁', type: 'textarea', component: 'textarea', rows: 3 },
    { id: 'construction_contactPerson', placeholder: '대표자', type: 'text', component: 'input' },
    { id: 'construction_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
  ],
  'equipment': [
    { id: 'equipment_name', placeholder: '회사명', type: 'text', component: 'input' },
    { id: 'equipment_businessLicense', placeholder: '사업자등록번호', type: 'text', component: 'input', required: true },
    { id: 'equipment_rentalRates', placeholder: '장비 대여료 (시간당/일당)', type: 'text', component: 'input' },
    { id: 'equipment_career', placeholder: '경력사항 및 간단 소개', type: 'textarea', component: 'textarea', rows: 3, required: true },
    { id: 'equipment_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
  ],
  'materials': [
    { id: 'materials_name', placeholder: '회사명', type: 'text', component: 'input' },
    { id: 'materials_businessLicense', placeholder: '사업자등록번호', type: 'text', component: 'input', required: true },
    { id: 'materials_companyPhoneNumber', placeholder: '회사 연락처', type: 'tel', component: 'input', required: true },
    { id: 'materials_materialType', placeholder: '주요 자재 종류 (예: 시멘트, 철근)', type: 'text', component: 'input', required: true },
  ],
  // ... 필요한 다른 카테고리별 필드 정의
};


export const CATEGORY_APPLY_FIELDS = {
  'proApply': [
    { id: 'proApply_name', placeholder: '성명 또는 닉네임', type: 'text', component: 'input', required: true},
    { id: 'proApply_certificate', placeholder: '자격증유무', type: 'text', component: 'input'},
    { id: 'proApply_career', placeholder: '경력 3년 이상 등', type: 'text', component: 'input'},
    { id: 'proApply_rates', placeholder: '일당', type: 'text', component: 'input',  },
    { id: 'proApply_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
    { id: 'proApply_description', placeholder: '설명', type: 'textarea', component: 'textarea', rows: 3 },
  ],
  'conApply': [
    { id: 'conApply_name', placeholder: '회사명 또는 이름', type: 'text', component: 'input' },
    { id: 'conApply_constructionExperience', placeholder: '연혁 3년 이상 등', type: 'text', component: 'input', rows: 3 },
    { id: 'conApply_documents', placeholder: '서류 필요 시', type: 'text', component: 'input' },
    { id: 'conApply_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
    { id: 'conApply_description', placeholder: '설명', type: 'textarea', component: 'textarea', rows: 3 },
  ],
  'equipApply': [
    { id: 'equipApply_name', placeholder: '회사명', type: 'text', component: 'input', required: true },
    { id: 'equipApply_rentalRates', placeholder: '장비 대여료 (시간당/일당)', type: 'text', component: 'input' },
    { id: 'equipApply_career', placeholder: '경력 3년 이상 등', type: 'textarea', component: 'textarea', rows: 3},
    { id: 'equipApply_rental', placeholder: '운전원필요여부', type: 'text', component: 'input' },
    { id: 'equipApply_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
    { id: 'equipApply_description', placeholder: '설명', type: 'textarea', component: 'textarea', rows: 3 },
  ],
  'matApply': [
    { id: 'matApply_name', placeholder: '회사명 또는 성명', type: 'text', component: 'input' },
    { id: 'matApply_materialType', placeholder: '필요자재', type: 'textarea', component: 'textarea', rows: 3, required: true },
    { id: 'matApply_phoneNumber', placeholder: '연락처 (숫자만 입력)', type: 'tel', component: 'input', required: true },
    { id: 'matApply_description', placeholder: '설명 또는 자재설명', type: 'textarea', component: 'textarea', rows: 3 },
  ],
};


export const CATEGORY_LINK = {
    'proApply': 'professionals',
    'conApply': 'construction',
    'equipApply': 'equipment',
    'matApply': 'materials',
    // ... 필요한 다른 카테고리 매핑 추가
  };