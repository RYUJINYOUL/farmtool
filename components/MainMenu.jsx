import React, { useEffect, useState, useCallback } from "react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  collection,
  orderBy,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { fetchArchitecturalPermitData } from "../lib/ArchPmsApi";

// Reusable Widget Component (재사용 가능한 위젯 컴포넌트)
const ListWidget = ({ title, moreLink, posts, timeFromNow, onClickItem }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
      {/* 위젯 헤더 */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <a href={moreLink} className="text-[11px] font-medium text-gray-500 hover:text-blue-600 transition-colors">
          더보기
        </a>
      </div>

      {moreLink != "/job" 
      ? (
       <ul className="space-y-4 flex-grow overflow-y-auto">
        {posts.map((post, index) => (
          <li
            key={`post-${post.id}-${index}`}
            onClick={() => onClickItem(post.id)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            {/* 상태 배지: 건축 인허가 데이터에는 없을 수 있으므로 조건부 렌더링 */}
            {post.confirmed != null && (
                <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    post.confirmed ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                }`}
                >
                {post.confirmed ? "확정" : "대기"}
                </span>
            )}

            {/* 설명 */}
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate group-hover:text-blue-600 transition-colors">
              {post.description === "" ? post.name : post.description}
            </span>

            {/* 날짜 */}
            <span className="text-xs text-gray-400 font-light flex-shrink-0">
              {timeFromNow(post.createdDate)}
            </span>
          </li>
        ))}
      </ul>)
      : (
        <div className="text-center py-6">
          <div className="text-gray-400 text-md mb-2">준비중입니다.</div>
        </div>
      )}
    </div>
  );
};


export default function MainMenu() {
  const router = useRouter();
  const [conApplyMessages, setConApplyMessages] = useState([]); 
  const [equipApplyMessages, setEquipApplyMessages] = useState([]); 
  const [matApplyMessages, setMatApplyMessages] = useState([]); 
  const [proApplyMessages, setProApplyMessages] = useState([]); 
  const [jobMessages, setJobApplyMessages] = useState([]); 
  const [permitList, setPermitList] = useState([]);
  const [naraItems, setNaraItems] = useState([]);
  const [loading, setLoading] = useState(true); 

  const timeFromNow = (timestampObject) => {
    if (timestampObject && typeof timestampObject.seconds === 'number') {
      return moment.unix(timestampObject.seconds).format('YYYY.MM.DD');
    }
    if (typeof timestampObject === 'string') {
      return moment(timestampObject, 'YYYYMMDD').format('YYYY.MM.DD');
    }
    return '날짜 정보 없음';
  };

  
  

  const onClickItem = (id, collectionName) => {
    (collectionName != 'permit' && collectionName != 'nara')
    ? router.push(`/${collectionName}/apply/${id}`)
    : router.push(`/${collectionName}`);
  };


 const handleNaraFetch = useCallback(async (startDate, endDate) => {
    const API_URL = "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getScsbidListSttusCnstwkPPSSrch";
    try {
      const params = [
        `serviceKey=${process.env.NEXT_PUBLIC_API_SERVICE_KEY}`,
        `pageNo=1`,
        `numOfRows=5`,
        `inqryDiv=1`,
        `type=json`,
        `inqryBgnDt=${startDate}0000`,
        `inqryEndDt=${endDate}2359`,
      ];

      const url = `${API_URL}?${params.join("&")}`;
      console.log(url)
      const res = await fetch(url);
      console.log(res)
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        const rawItems = data.response?.body?.items;
        const itemsArr = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
        return itemsArr;
      } else {
        const text = await res.text();
        console.error('API 응답이 JSON이 아닙니다:', text);
        return [];
      }
    } catch (err) {
      console.error('데이터를 불러오는 중 오류가 발생했습니다:', err);
      return [];
    }
  }, []);



  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const q1 = query(collection(db, "conApply"), orderBy("createdDate", "desc"), limit(5));
        const q2 = query(collection(db, "equipApply"), orderBy("createdDate", "desc"), limit(5));
        const q3 = query(collection(db, "matApply"), orderBy("createdDate", "desc"), limit(5));
        const q4 = query(collection(db, "proApply"), orderBy("createdDate", "desc"), limit(5));
        const q5 = query(collection(db, "jobApply"), orderBy("createdDate", "desc"), limit(5));

        const endDate = moment().subtract(1, 'days').format('YYYYMMDD');
        const startDate = moment().subtract(3, 'months').format('YYYYMMDD');
         const startDate2 = moment().subtract(1, 'months').format('YYYYMMDD');

        const permitPromise = fetchArchitecturalPermitData("11680", "10300", startDate, endDate, 1, 5);
        const naraPromise = handleNaraFetch(startDate2, endDate);

        // Promise.all을 사용하여 두 쿼리를 병렬로 실행
        const [querySnapshot1, querySnapshot2, querySnapshot3, querySnapshot4, querySnapshot5, permitData, naraData] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
          getDocs(q3),
          getDocs(q4),
          getDocs(q5),
          permitPromise,
          naraPromise
        ]);

        // 'conApply' 컬렉션 데이터 처리
        const conApplyList = querySnapshot1.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            description: data.conApply_description,
            createdDate: data.createdDate,
            confirmed: data.confirmed,
            name: data.conApply_name
          };
        });

        // 'equipApply' 컬렉션 데이터 처리 (필드명 수정)
        const equipApplyList = querySnapshot2.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            description: data.equipApply_description, // 올바른 필드명 사용
            createdDate: data.createdDate,
            confirmed: data.confirmed,
            name: data.equipApply_name
          };
        });

        const matApplyList = querySnapshot3.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            description: data.matApply_description,
            createdDate: data.createdDate,
            confirmed: data.confirmed,
            name: data.matApply_name
          };
        });

        // 'equipApply' 컬렉션 데이터 처리 (필드명 수정)
        const proApplyList = querySnapshot4.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            description: data.proApply_description, // 올바른 필드명 사용
            createdDate: data.createdDate,
            confirmed: data.confirmed,
            name: data.proApply_name
          };
        });

        const jobApplyList = querySnapshot5.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            description: data.conApply_description,
            createdDate: data.createdDate,
            confirmed: data.confirmed,
            name: data.proApply_name
          };
        });

        const formatNaraData = (items) => {
          if (!items || items.length === 0) return [];
          return items.map((item, index) => ({
            id: item.bidNtceNo || `nara-${index}`,
            description: item.bidNtceNm || "제목 없음",
            createdDate: item.fnlSucsfDate || null,
            name: item.bidNtceNm,
            confirmed: null,
            collectionName: 'nara',
          }));
        };

        if (permitData.data) {
          const formattedPermits = permitData.data.map((item, index) => ({
            id: item.mgmPmsrgstPk || `permit-${index}`, // 고유 키가 없으면 인덱스로 대체
            description: item.platPlc,
            createdDate: item.archPmsDay,
            confirmed: null, // confirmed 상태가 없으므로 null
            collectionName: 'permits' // 라우팅을 위한 컬렉션 이름
          }));
          setPermitList(formattedPermits);
        } else {
          console.error("건축 인허가 데이터 로딩 오류:", permitData.error);
        }

       if (naraData && naraData.length > 0) {
          const formattedNaraData = formatNaraData(naraData);
          setNaraItems(formattedNaraData);
        } else {
          console.error("나라장터 데이터 로딩 오류: 데이터가 없거나 형식이 올바르지 않습니다.");
        }

        setConApplyMessages(conApplyList);
        setEquipApplyMessages(equipApplyList);
        setMatApplyMessages(matApplyList);
        setProApplyMessages(proApplyList);
        setJobApplyMessages(jobApplyList);
      } catch (error) {
        console.error("데이터를 가져오는 중 오류 발생:", error);
      } finally {
        // 모든 작업이 완료된 후 로딩 상태 종료
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);



  return (
    <div className="p-4 bg-gray-50">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : conApplyMessages.length > 0 || equipApplyMessages.length > 0 || matApplyMessages.length > 0 || proApplyMessages.length > 0 || jobMessages.length > 0 ? (
       <div className="grid grid-row-1 lg:grid-row-3 gap-6"> 
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListWidget
              title="건설견적리스트"
              moreLink="/construction?tab=upload"
              posts={conApplyMessages}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, "construction")}
            />
            <ListWidget
              title="장비견적리스트"
              moreLink="/equipment?tab=upload"
              posts={equipApplyMessages}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, "equipment")}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListWidget
              title="건설자재주문리스트"
              moreLink="/materials?tab=upload"
              posts={matApplyMessages}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, "materials")}
            />
            <ListWidget
              title="전문인력리스트"
              moreLink="/professionals?tab=upload"
              posts={proApplyMessages}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, "professionals")}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListWidget
              title="구인구직리스트"
              moreLink="/job"
              posts={jobMessages}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, "job")}
            />
            <ListWidget
              title="건축인허가리스트"
              moreLink="/permit"
              posts={permitList}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, 'permit')}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListWidget
              title="낙찰리스트"
              moreLink="/nara"
              posts={naraItems}
              timeFromNow={timeFromNow}
              onClickItem={(id) => onClickItem(id, "nara")}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">검색 결과가 없습니다.</div>
          <div className="text-gray-500 text-sm">다른 조건으로 검색해보세요.</div>
        </div>
      )}
    </div>
  );
}