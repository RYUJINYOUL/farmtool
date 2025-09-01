"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import { Bell, HelpCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import dayjs from 'dayjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayRemove,
  getAggregateFromServer,
  count,
  startAfter,
  limit,
  orderBy
} from "firebase/firestore";
import { useSelector } from "react-redux";
import {
  Copyright,
  Tractor,
  LaptopMinimalCheck,
  Fence,
  BrickWallFire,
  X,
  Phone,
  MessageSquare,
  Dock,
  UserPen,
  Hammer,
  FileUser,
  LayoutGrid,
  Stamp,
} from "lucide-react";



export default function MainMenu() {
  const [openDialog, setOpenDialog] = useState(null);
  const [wishListCount, setWishListCount] = useState({
    general: 0,
    nara: 0,
    permit: 0
  });
  const [userInfo, setUserInfo] = useState({});
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [wishListDetails, setWishListDetails] = useState([]);
  const [myListDetails, setMyListDetails] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();
  const { push } = useRouter();
  const [counts, setCounts] = useState({
    construction: 0,
    equipment: 0,
    professionals: 0,
    materials: 0,
  });
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [endTime, setEndTime] = useState('23:59');
  const SERVICE_KEY = process.env.NEXT_PUBLIC_API_SERVICE_KEY;
  const API_URL = "https://apis.data.go.kr/1230000/as/ScsbidInfoService/getScsbidListSttusCnstwkPPSSrch";
  const [totalCount, setTotalCount] = useState(0);


  useEffect(() => {
    if (!API_URL || !SERVICE_KEY) return;

    const ac = new AbortController();
    const signal = ac.signal;

    const fetchTotal = async () => {
      try {

        const inqryBgnDt = startDate?.replace(/-/g, "") + (startTime?.replace(":", "") || "");
        const inqryEndDt = endDate?.replace(/-/g, "") + (endTime?.replace(":", "") || "");

        const params = [
          `serviceKey=${SERVICE_KEY}`,
          `inqryDiv=1`,
          `type=json`,
          `inqryBgnDt=${inqryBgnDt}`,
          `inqryEndDt=${inqryEndDt}`
        ];

        const url = `${API_URL}?${params.join('&')}`;

        const res = await fetch(url, { signal });
        if (!res.ok) {
          console.error("API error:", res.status, res.statusText);
          if (setTotalCount) setTotalCount(0);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          const total = Number(json.response?.body?.totalCount) || 0;
          if (setTotalCount) setTotalCount(total);
        } else {
          // JSON이 아닐 경우(간혹 문자열/XML 반환) 간단히 텍스트로 확인
          const text = await res.text();
          console.warn('응답이 JSON이 아닙니다. 응답 예시:', text.slice(0, 500));
          if (setTotalCount) setTotalCount(0);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // 요청이 취소됨
          return;
        }
        console.error("데이터 페치 중 오류:", err);
        if (setTotalCount) setTotalCount(0);
      } 
    };

    fetchTotal();

    return () => {
      ac.abort();
    };
    // 의존성: 파라미터가 바뀔 때마다 재요청
  }, [
    startDate,
    startTime,
    endDate,
    endTime,
    SERVICE_KEY,
    API_URL,
    setTotalCount,
  ]);

  

  const fetchCounts = async () => {
    const collections = ["construction", "equipment", "professionals", "materials"];

    const results = await Promise.all(
      collections.map(async (col) => {
        const snapshot = await getAggregateFromServer(collection(db, col), {
          total: count(),
        });
        return { [col]: snapshot.data().total };
      })
    );

    // 배열 → 객체 병합
    const mergedCounts = results.reduce((acc, cur) => ({ ...acc, ...cur }), {});
    setCounts(mergedCounts);
  };

  useEffect(() => {
    fetchCounts();
  }, []);



  const toggleFavorite = useCallback(async (itemId, middle, category, top) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    const wishlistItem = { itemId: itemId, category: category, top: top, middle: middle };

    try {
      setWishListDetails((prevDetails) =>
        prevDetails.filter((msg) => msg.itemId !== itemId)
      );
      setWishListCount(prev => ({ ...prev, general: prev.general - 1 }));

      const constructionDocRef = doc(db, top, itemId);
      const userDocRef = doc(db, "users", userId);

     const constructionDocSnap = await getDoc(constructionDocRef);

      if (constructionDocSnap.exists()) {
        await updateDoc(constructionDocRef, {
          favorites: arrayRemove(userId)
        });
      }

      await updateDoc(userDocRef, {
        wishList: arrayRemove(wishlistItem)
      });
    } catch (error) {
      console.error("일반 찜하기/찜 해제 중 오류 발생:", error);
      alert("찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      setWishListDetails((prevDetails) => [...prevDetails, { itemId, middle, category, top, companyName: "복구됨", topCategory: "" }]);
      setWishListCount(prev => ({ ...prev, general: prev.general + 1 }));
    }
  }, [uid, currentUser, router]);



  useEffect(() => {
    if (!uid) return;

    const fetchAllWishListCounts = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const generalWishList = userDoc.data()?.wishList || [];
        // Nara 찜 목록과 Permit 찜 목록의 개수를 서브컬렉션에서 직접 가져옵니다.
        const naraSnap = await userDoc.data()?.nara || [];
        const permitSnap = await userDoc.data()?.permit || [];
        const jobSnap = await userDoc.data()?.job || [];
        const myListSnap = await userDoc.data()?.myList || []

        setWishListCount({
          general: generalWishList.length,
          nara: naraSnap.length, // 서브컬렉션 문서의 개수
          permit: permitSnap.length, // 서브컬렉션 문서의 개수
          job: jobSnap.length,
          myList: myListSnap.length

        });
      } catch (err) {
        console.error("찜목록 카운트 로드 오류:", err);
      }
    };

    fetchAllWishListCounts();
  }, [uid, openDialog]);


  useEffect(() => {
    if (!uid || openDialog !== "favorites") return;

    const fetchWishListDetails = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.data();
        const wishList = userData?.wishList || [];

        const detailPromises = wishList.map(async (item) => {
          const itemRef = doc(db, item.top, item.itemId);
          const itemDoc = await getDoc(itemRef);

          if (itemDoc.exists()) {
            const data = itemDoc.data();
            return {
              ...item,
              companyName: data[`${item.top}_name`] || '알수없음',
              topCategory: data.TopCategories || "카테고리 없음",
              favorites: data.favorites || []
            };
          } else {
            return {
              ...item,
              companyName: "삭제된 항목",
              topCategory: "-",
              favorites: []
            };
          }
        });

        const details = await Promise.all(detailPromises);
        setWishListDetails(details);
      } catch (err) {
        console.error("찜 목록 세부정보 로드 오류:", err);
      }
    };

    fetchWishListDetails();
  }, [uid, openDialog]);


  useEffect(() => {
    if (!uid || openDialog !== "myText") return;

    const fetchMyListDetails = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.data();
        const myList = userData?.myList || [];

        const detailPromises = myList.map(async (item) => {
          const itemRef = doc(db, item.top, item.id || uid);
          const itemDoc = await getDoc(itemRef);

          if (itemDoc.exists()) {
            const data = itemDoc.data();
            return {
              ...item,
              companyName: data[`${item.top}_name`] || '알수없음',
              topCategory: data.TopCategories || "카테고리 없음",
              favorites: data.favorites || []
            };
          } else {
            return {
              ...item,
              companyName: "삭제된 항목",
              topCategory: "-",
            };
          }
        });

        const details = await Promise.all(detailPromises);
        setMyListDetails(details);
      } catch (err) {
        console.error("나의 글 목록 세부정보 로드 오류:", err);
      }
    };

    fetchMyListDetails();
  }, [uid, openDialog]);


  useEffect(() => {
    if (!uid) return;
    const fetchUserInfo = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        setUserInfo(userDoc.data());
        setNoticeEnabled(userDoc.data()?.notice || false);
      } catch (err) {
        console.error("회원정보 로드 오류:", err);
      }
    };
    fetchUserInfo();
  }, [uid]);

  const toggleNotice = async () => {
    try {
      const newValue = !noticeEnabled;
      await updateDoc(doc(db, "users", uid), { notice: newValue });
      setNoticeEnabled(newValue);
    } catch (err) {
      console.error("알림 설정 오류:", err);
    }
  };

  // 로그인 상태 확인 함수
  const checkLoginAndOpenDialog = (dialogName) => {
    if (!currentUser?.uid) {
      router.push('/login');
    } else {
      setOpenDialog(dialogName);
    }
  };


  function AnimatedCount({ target = 0, duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1); // 0~1 사이
      const current = Math.floor(progress * target);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [target, duration]);

  return <span>{count.toLocaleString()}</span>;
}

  return (
 
    <div className="flex flex-col items-center md:justify-center bg-gray-50 pt-5 md:w-[1100px] md:mx-auto">
      {/* 프로필 카드 */}
      <div className="w-full md:w-[1100px] bg-white shadow-md rounded-2xl p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
            {userInfo?.photoURL ? (
              <img
                src={userInfo.photoURL || "/new/unnamed.jpg"}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{userInfo?.displayName}</h2>
          <p className="text-sm text-gray-500">{userInfo?.email}</p>
        </div>

        {/* 메뉴 리스트 */}
        <div className="space-y-3">

          {/* 첫 번째 줄: 일반 찜 목록, 나라장터 찜 목록 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <button
                onClick={() => push("/construction")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <BrickWallFire className="w-5 h-5 text-pink-500" />
                  <span className="font-medium text-gray-800">건설업</span>
                </div>
               <span className="text-green-900 text-sm"><AnimatedCount target={counts.construction || 0} duration={1500} />개</span>
              </button>
            </div>

            <div className="w-full md:w-1/2">
              <button
                onClick={() => push("/equipment")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Tractor className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-gray-800">건설장비</span>
                </div>
              <span className="text-gray-400 text-sm">{counts.equipment ? counts.equipment.toLocaleString() : 0}개</span>
              </button>
            </div>
          </div>

          {/* 두 번째 줄: 인허가 찜 목록, 회원정보 수정 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <button
                onClick={() => push("/materials")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Fence className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-gray-800">건설자재</span>
                </div>
              <span className="text-gray-400 text-sm">{counts.materials ? counts.materials.toLocaleString() : 0}개</span>
              </button>
            </div>

            <div className="w-full md:w-1/2">
              <button
                onClick={() => push("/permit")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Copyright className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-800">인허가</span>
                </div>
                 <span className="text-gray-400 text-sm">12,358개(1달 기준)</span> 
              </button>
            </div>
          </div>

          {/* 세 번째 줄: 등록글과 신청글, 업체 등록 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <button
                onClick={() => push("nara")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <LaptopMinimalCheck className="w-5 h-5 text-red-400" />
                  <span className="font-medium text-gray-800">나라장터낙찰</span>
                </div>
                <span className="text-gray-400 text-sm">{totalCount ? totalCount.toLocaleString() : 0}개</span>
              </button>
            </div> 

             <div className="w-full md:w-1/2">
               <button
                onClick={() => push("/job")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <UserPen className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-gray-800">구인구직</span>
                </div>
                
              </button>
            </div>
          </div>

          {/* 네 번째 줄: 주문 신청, 알림 설정 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
               <button
                onClick={() => push("/professionals")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Hammer className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-800">전문인력</span>
                </div>
                <span className="text-gray-400 text-sm">{counts.professionals ? counts.professionals.toLocaleString() : 0}개</span>
              </button>
            </div>

            <div className="w-full md:w-1/2">
              <button
                onClick={() => push("/myinfo")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Dock className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-gray-800">내정보</span>
                </div>
              </button>
            </div>
          </div>

          {/* 다섯 번째 줄: 고객센터 (단일 버튼) */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2"> 
              <button
                onClick={() => push("/login")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium text-gray-800">알림 설정</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {noticeEnabled ? "ON" : "OFF"}
                </span>
              </button>
            </div>
            
            <div className="hidden md:block w-full md:w-1/2">
            <button
                onClick={() => push("/login")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-800">고객센터</span>
                </div>
              </button>
            </div> 
          </div>
        </div>
      </div>

     
    </div>

  );
}