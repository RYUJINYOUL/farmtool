"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import {
  Bell,
  Heart,
  UserCog,
  Building2,
  HelpCircle,
  X,
  Phone,
  MessageSquare,
  Dock,
  FileUser,
  LayoutGrid, // 새로운 아이콘 추가 (나라장터)
  Stamp,      // 새로운 아이콘 추가 (인허가)
} from "lucide-react";
import Link from "next/link";
import CategoryUpload from '@/components/categoryUpload';
import ConUpload from '@/components/conUpload';

export default function MyPage() {
  const [openDialog, setOpenDialog] = useState(null);
  const [wishListCount, setWishListCount] = useState({
    general: 0, // 일반 찜 목록 (업체/콘텐츠)
    nara: 0,    // 나라장터 찜 목록
    permit: 0   // 인허가 찜 목록
  });
  const [userInfo, setUserInfo] = useState({});
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [wishListDetails, setWishListDetails] = useState([]); // 일반 찜 목록
  const [naraWishListDetails, setNaraWishListDetails] = useState([]); // 나라장터 찜 목록
  const [permitWishListDetails, setPermitWishListDetails] = useState([]); // 인허가 찜 목록
  const [myListDetails, setMyListDetails] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();

  const closeDialog = () => setOpenDialog(null);

  // 찜하기/찜 해제 (일반 찜 목록 - 업체, 콘텐츠)
  const toggleFavorite = useCallback(async (itemId, middle, category, top) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    const wishlistItem = { itemId: itemId, category: category, top: top, middle: middle };

    try {
      // UI를 먼저 업데이트하여 사용자에게 즉각적인 피드백 제공
      setWishListDetails((prevDetails) =>
        prevDetails.filter((msg) => msg.itemId !== itemId)
      );
      setWishListCount(prev => ({ ...prev, general: prev.general - 1 }));

      const constructionDocRef = doc(db, top, itemId);
      const userDocRef = doc(db, "users", userId);

      await updateDoc(constructionDocRef, {
        favorites: arrayRemove(userId)
      });
      await updateDoc(userDocRef, {
        wishList: arrayRemove(wishlistItem)
      });
    } catch (error) {
      console.error("일반 찜하기/찜 해제 중 오류 발생:", error);
      alert("찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 오류 발생 시 UI 롤백 (이 경우, 제거된 항목을 다시 추가)
      // 정확한 롤백을 위해서는 원래 상태를 저장해두어야 하지만, 여기서는 간단히 처리
      setWishListDetails((prevDetails) => [...prevDetails, { itemId, middle, category, top, companyName: "복구됨", topCategory: "" }]);
      setWishListCount(prev => ({ ...prev, general: prev.general + 1 }));
    }
  }, [uid, currentUser, router]);


  // 나라장터 찜하기/찜 해제
  const toggleNaraFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    const naraDocId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`;
    const userDocRef = doc(db, "users", userId); // users/{uid} 문서 참조
    const naraDocRef = doc(collection(userDocRef, "nara"), naraDocId); // users/{uid}/nara/{id} 서브컬렉션 문서 참조

    try {
      // UI 옵티미스틱 업데이트: 목록에서 제거
      setNaraWishListDetails((prevDetails) =>
        prevDetails.filter((detail) => {
            const detailId = `${detail.bidwinnrBizno || 'unknown'}-${detail.fnlSucsfDate || 'unknown'}`;
            return detailId !== naraDocId;
        })
      );
      setWishListCount(prev => ({ ...prev, nara: prev.nara - 1 }));

      // Firestore에서 문서 삭제 (서브컬렉션)
      await deleteDoc(naraDocRef);
      // Firestore에서 users/{uid} 문서의 'nara' 배열 필드에서도 ID 제거
      await updateDoc(userDocRef, {
        nara: arrayRemove(naraDocId)
      });

      console.log(`나라장터 찜 항목 ${naraDocId} 제거 성공 (서브컬렉션 및 users 문서 배열)`);

    } catch (error) {
      console.error("나라장터 찜 해제 중 오류 발생:", error);
      alert("나라장터 찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 오류 발생 시 UI 롤백 (원래 항목을 다시 추가)
      setNaraWishListDetails((prevDetails) => [...prevDetails, item]);
      setWishListCount(prev => ({ ...prev, nara: prev.nara + 1 }));
    }
  }, [uid, currentUser, router]);

  // 인허가 찜하기/찜 해제
  const togglePermitFavorite = useCallback(async (item) => {
    if (!currentUser?.uid) {
      router.push('/login');
      return;
    }

    const userId = uid;
    const permitDocId = item.platPlc;
    const userDocRef = doc(db, "users", userId); // users/{uid} 문서 참조
    const permitDocRef = doc(collection(userDocRef, "permits"), permitDocId); // users/{uid}/permits/{id} 서브컬렉션 문서 참조

    try {
      // UI 옵티미스틱 업데이트: 목록에서 제거
      setPermitWishListDetails((prevDetails) =>
        prevDetails.filter((detail) => detail.platPlc !== permitDocId)
      );
      setWishListCount(prev => ({ ...prev, permit: prev.permit - 1 }));

      // Firestore에서 문서 삭제 (서브컬렉션)
      await deleteDoc(permitDocRef);
      // Firestore에서 users/{uid} 문서의 'permit' 배열 필드에서도 ID 제거
      await updateDoc(userDocRef, {
        permit: arrayRemove(permitDocId)
      });

      console.log(`인허가 찜 항목 ${permitDocId} 제거 성공 (서브컬렉션 및 users 문서 배열)`);

    } catch (error) {
      console.error("인허가 찜 해제 중 오류 발생:", error);
      alert("인허가 찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 오류 발생 시 UI 롤백 (원래 항목을 다시 추가)
      setPermitWishListDetails((prevDetails) => [...prevDetails, item]);
      setWishListCount(prev => ({ ...prev, permit: prev.permit + 1 }));
    }
  }, [uid, currentUser, router]);


  // 🟢 각 찜목록의 개수 가져오기 (초기 로딩 시)
  useEffect(() => {
    if (!uid) return;

    const fetchAllWishListCounts = async () => {
      try {
        // 1. 일반 찜 목록
        const userDoc = await getDoc(doc(db, "users", uid));
        const generalWishList = userDoc.data()?.wishList || [];

        // 2. 나라장터 찜 목록 (서브컬렉션 개수)
        const naraCollectionRef = collection(db, "users", uid, "nara");
        const naraSnapshot = await getDocs(naraCollectionRef);
        const naraWishListCount = naraSnapshot.size;

        // 3. 인허가 찜 목록 (서브컬렉션 개수)
        const permitsCollectionRef = collection(db, "users", uid, "permits");
        const permitsSnapshot = await getDocs(permitsCollectionRef);
        const permitWishListCount = permitsSnapshot.size;

        setWishListCount({
          general: generalWishList.length,
          nara: naraWishListCount,
          permit: permitWishListCount
        });
      } catch (err) {
        console.error("찜목록 카운트 로드 오류:", err);
      }
    };

    fetchAllWishListCounts();
  }, [uid]);


  // 🟢 일반 찜목록 세부 정보 가져오기
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
              favorites: data.favorites || [] // 해당 항목의 favorites 배열도 가져옴
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


  // 🟢 나의 글 가져오기
  useEffect(() => {
    if (!uid || openDialog !== "myText") return;

    const fetchMyListDetails = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.data();
        const myList = userData?.myList || [];

        const detailPromises = myList.map(async (item) => {
          const itemRef = doc(db, item.top, uid);
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
        console.error("찜 목록 세부정보 로드 오류:", err);
      }
    };

    fetchMyListDetails();
  }, [uid, openDialog]);


  // 🟢 나라장터 찜 목록 세부 정보 가져오기
  useEffect(() => {
    if (!uid || openDialog !== "naraFavorites") return;

    const fetchNaraWishListDetails = async () => {
      try {
        const naraCollectionRef = collection(db, "users", uid, "nara");
        const querySnapshot = await getDocs(naraCollectionRef);
        const details = querySnapshot.docs.map(doc => doc.data());
        setNaraWishListDetails(details);
      } catch (err) {
        console.error("나라장터 찜 목록 세부정보 로드 오류:", err);
      }
    };
    fetchNaraWishListDetails();
  }, [uid, openDialog]);

  // 🟢 인허가 찜 목록 세부 정보 가져오기
  useEffect(() => {
    if (!uid || openDialog !== "permitFavorites") return;

    const fetchPermitWishListDetails = async () => {
      try {
        const permitsCollectionRef = collection(db, "users", uid, "permits");
        const querySnapshot = await getDocs(permitsCollectionRef);
        const details = querySnapshot.docs.map(doc => doc.data());
        setPermitWishListDetails(details);
      } catch (err) {
        console.error("인허가 찜 목록 세부정보 로드 오류:", err);
      }
    };
    fetchPermitWishListDetails();
  }, [uid, openDialog]);

  // 🟢 회원정보 가져오기
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

  // 🔵 알림 토글
  const toggleNotice = async () => {
    try {
      const newValue = !noticeEnabled;
      await updateDoc(doc(db, "users", uid), { notice: newValue });
      setNoticeEnabled(newValue);
    } catch (err) {
      console.error("알림 설정 오류:", err);
    }
  };

  return (
    <div className="flex flex-col items-center md:justify-center min-h-screen bg-gray-50 pt-25 p-5">
      {/* 프로필 카드 */}
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
            {userInfo?.photoURL ? (
              <img
                src={userInfo.photoURL}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{userInfo?.name}</h2>
          <p className="text-sm text-gray-500">{userInfo?.email}</p>
        </div>

        {/* 메뉴 리스트 */}
        <div className="mt-6 space-y-3">
          {/* 일반 찜 목록 */}
          <button
            onClick={() => setOpenDialog("favorites")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-gray-800">일반 찜 목록</span>
            </div>
            <span className="text-gray-400 text-sm">{wishListCount.general}개</span>
          </button>

          {/* 나라장터 찜 목록 */}
          <button
            onClick={() => setOpenDialog("naraFavorites")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-800">나라장터 찜 목록</span>
            </div>
            <span className="text-gray-400 text-sm">{wishListCount.nara}개</span>
          </button>

          {/* 인허가 찜 목록 */}
          <button
            onClick={() => setOpenDialog("permitFavorites")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Stamp className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-gray-800">인허가 찜 목록</span>
            </div>
            <span className="text-gray-400 text-sm">{wishListCount.permit}개</span>
          </button>


          {/* 회원정보 수정 */}
          <button
            onClick={() => setOpenDialog("profile")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-800">회원정보 수정</span>
            </div>
          </button>

           {/* 나의 등록글 */}
          <button
            onClick={() => setOpenDialog("myText")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <FileUser className="w-5 h-5 text-red-500" />
              <span className="font-medium text-gray-800">등록글과 신청글</span>
            </div>
          </button>

          {/* 업체 등록 */}
          <button
            onClick={() => setOpenDialog("register")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-800">업체 등록</span>
            </div>
          </button>

           {/* 주문 신청 */}
          <button
            onClick={() => setOpenDialog("apply")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Dock className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-gray-800">주문 신청</span>
            </div>
          </button>

          {/* 알림 설정 */}
          <button
            onClick={() => setOpenDialog("notifications")}
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

          {/* 고객센터 */}
          <button
            onClick={() => setOpenDialog("help")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-gray-800">고객센터</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dialog UI */}
      <Dialog open={!!openDialog} onClose={closeDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white shadow-lg p-6 relative">
            <button
              onClick={closeDialog}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dialog Content: 일반 찜 목록 */}
            {openDialog === "favorites" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">일반 찜 목록</Dialog.Title>
                {wishListDetails.length === 0 ? (
                  <p className="text-gray-500">찜한 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {wishListDetails.map((item) => {
                      const isWishListed =
                        Array.isArray(item.favorites) && uid
                          ? item.favorites.includes(uid)
                          : false;

                      return (
                        <div
                          key={item.itemId}
                          className="border p-3 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Link
                            href={`/${item.category}/${item.middle}/${item.itemId}`}
                            className="block"
                          >
                            <div className="flex flex-row items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {item.companyName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.topCategory}
                                </div>
                              </div>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(item.itemId, item.middle, item.category, item.top);
                                  }}
                                  className="rounded-full"
                                >
                                  {isWishListed ? (
                                    <IoIosHeart color="red" size={20} />
                                  ) : (
                                    <IoMdHeartEmpty size={20} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dialog Content: 나라장터 찜 목록 */}
            {openDialog === "naraFavorites" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">나라장터 찜 목록</Dialog.Title>
                {naraWishListDetails.length === 0 ? (
                  <p className="text-gray-500">찜한 나라장터 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-3 max-h-1/2 overflow-y-auto">
                    {naraWishListDetails.map((item, index) => {
                       // 나라장터 아이템의 고유 ID를 다시 생성하여 일치 여부 확인
                       const naraItemId = `${item.bidwinnrBizno || 'unknown'}-${item.fnlSucsfDate || 'unknown'}`;
                       const isFavorited = true; // 목록에 있다는 것은 찜되어 있다는 의미
                      return (
                           <div key={naraItemId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                               <div className="flex justify-between items-start mb-4">
                                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                                    {item.bidwinnrNm || '낙찰자명 없음'}
                                  </h3>
                                <div className='flex flex-row gap-2'>
                                <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNaraFavorite(item);
                                    }}
                                    className="rounded-full"
                                  >
                                {isFavorited ? (
                                  <IoIosHeart color="red" size={20} />
                                ) : (
                                  <IoMdHeartEmpty size={20} />
                                )}
                              </button>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">낙찰</span>
                                        </div>
                                          </div>
                                          <div className="space-y-3 text-sm text-gray-600">
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">사업자번호:</span>
                                              <span className="font-medium">{item.bidwinnrBizno || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">대표자:</span>
                                              <span className="font-medium">{item.bidwinnrCeoNm || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">낙찰금액:</span>
                                              <span className="font-semibold text-green-600">
                                                {item.sucsfbidAmt ? Number(item.sucsfbidAmt).toLocaleString() + '원' : '-'}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">낙찰일자:</span>
                                              <span className="font-medium">{item.fnlSucsfDate ? String(item.fnlSucsfDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}</span>
                                            </div>
                                            {item.bidwinnrAdrs && (
                                              <div className="pt-2 border-t border-gray-100">
                                                <div className="text-gray-500 text-xs mb-1">주소:</div>
                                                <div className="text-xs text-gray-600 line-clamp-2">{item.bidwinnrAdrs}</div>
                                              </div>
                                            )}
                                            {item.bidwinnrTelNo && (
                                              <div className="pt-2 border-t border-gray-100">
                                                <div className="text-gray-500 text-xs mb-1">전화번호:</div>
                                                <div className="text-xs text-gray-600">{item.bidwinnrTelNo}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dialog Content: 인허가 찜 목록 */}
            {openDialog === "permitFavorites" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">인허가 찜 목록</Dialog.Title>
                {permitWishListDetails.length === 0 ? (
                  <p className="text-gray-500">찜한 인허가 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {permitWishListDetails.map((permit, index) => {
                      const isFavorited = true; // 목록에 있다는 것은 찜되어 있다는 의미
                      return (
                        <div key={permit.platPlc} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                                        <div className="flex justify-between items-start mb-4">
                                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                                            {permit.bldNm || '건물명 정보 없음'}
                                          </h3>
                                          <div className='flex flex-row gap-2'>
                                                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePermitFavorite(permit);
                                }}
                                className="rounded-full"
                              >
                                {isFavorited ? (
                                  <IoIosHeart color="red" size={20} />
                                ) : (
                                  <IoMdHeartEmpty size={20} />
                                )}
                              </button>
                                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">허가</span>
                                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-gray-600">
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">대지위치:</span>
                                            <span className="font-medium">{permit.platPlc || '-'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">허가일:</span>
                                            <span className="font-medium">{permit.archPmsDay ? String(permit.archPmsDay).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">착공일:</span>
                                            <span className="font-semibold text-green-600">
                                              {permit.realStcnsDay ? String(permit.realStcnsDay).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'N/A'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">건축구분:</span>
                                            <span className="font-medium">{permit.mainPurpsCdNm || '-'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">대지면적:</span>
                                            <span className="font-medium">{permit.platArea || '-'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">연면적:</span>
                                            <span className="font-medium">{permit.totArea || '-'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">건축면적:</span>
                                            <span className="font-medium">{permit.archArea || '-'}</span>
                                          </div>
                                           <div className="flex justify-between">
                                            <span className="text-gray-500">용적률:</span>
                                            <span className="font-medium">{permit.vlRat || '-'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">건폐율:</span>
                                            <span className="font-medium">{permit.bcRat || '-'}</span>
                                          </div>
                                        </div>
                                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}


            {openDialog === "profile" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">회원정보 수정</Dialog.Title>
                {/* 간단한 회원정보 수정 폼 */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newName = formData.get("displayName");

                    try {
                      // Firestore 업데이트
                      await updateDoc(doc(db, "users", uid), {
                        displayName: newName,
                      });
                      alert("회원정보 수정 완료!");
                      // 로컬 상태도 갱신
                      setUserInfo((prev) => ({ ...prev, displayName: newName }));
                      closeDialog();
                    } catch (error) {
                      console.error("회원정보 수정 오류:", error);
                      alert("회원정보 수정 중 오류가 발생했습니다.");
                    }
                  }}
                >
                  <div className="mb-4">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                      이름
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      defaultValue={userInfo?.displayName || ""}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      저장
                    </button>
                  </div>
                </form>
              </div>
            )}

            {openDialog === "notifications" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">알림 설정</Dialog.Title>
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">알림 받기</span>
                  <label htmlFor="toggle-notice" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="toggle-notice"
                        className="sr-only"
                        checked={noticeEnabled}
                        onChange={toggleNotice}
                      />
                      <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
                      <div
                        className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                          noticeEnabled ? "translate-x-full bg-blue-600" : ""
                        }`}
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {openDialog === "help" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">고객센터</Dialog.Title>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5" />
                    <span>전화 문의: 02-1234-5678</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MessageSquare className="w-5 h-5" />
                    <span>이메일 문의: support@example.com</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    궁금한 점이 있으시면 언제든지 문의해주세요.
                  </p>
                </div>
              </div>
            )}

            {openDialog === "register" && (
              <CategoryUpload closeDialog={closeDialog} />
            )}

            {openDialog === "apply" && (
              <ConUpload closeDialog={closeDialog} />
            )}

            {openDialog === "myText" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">등록글과 신청글</Dialog.Title>
                {myListDetails.length === 0 ? (
                  <p className="text-gray-500">등록/신청하신 글이 없습니다.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myListDetails.map((item) => (
                      <div
                        key={item.itemId}
                        className="border p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Link
                          href={`/${item.category}/${item.middle}/${item.itemId}`}
                          className="block"
                        >
                          <div className="font-semibold text-gray-800">
                            {item.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.topCategory}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}