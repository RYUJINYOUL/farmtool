// MyPage.jsx
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
  LayoutGrid,
  Stamp,
} from "lucide-react";
import Link from "next/link";
import CategoryUpload from '@/components/categoryUpload';
import ConUpload from '@/components/conUpload';

// 새로 생성한 컴포넌트 import
import NaraWishList from '@/components/NaraWishList';
import PermitWishList from '@/components/PermitWishList';


export default function MyPage() {
  const [openDialog, setOpenDialog] = useState(null);
  const [wishListCount, setWishListCount] = useState({
    general: 0,
    nara: 0,
    permit: 0
  });
  const [userInfo, setUserInfo] = useState({});
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [wishListDetails, setWishListDetails] = useState([]);
  const [naraWishListDetails, setNaraWishListDetails] = useState([]);
  const [permitWishListDetails, setPermitWishListDetails] = useState([]);
  const [myListDetails, setMyListDetails] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();

  const closeDialog = () => setOpenDialog(null);

  // ... (toggleFavorite, toggleNaraFavorite, togglePermitFavorite 함수는 MyPage에서 제거하고 각 컴포넌트로 이동)
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
      setWishListDetails((prevDetails) => [...prevDetails, { itemId, middle, category, top, companyName: "복구됨", topCategory: "" }]);
      setWishListCount(prev => ({ ...prev, general: prev.general + 1 }));
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


  // 🟢 나라장터 찜 목록 세부 정보 가져오기 (MyPage에서는 데이터만 가져오고, 렌더링은 컴포넌트에 위임)
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

  // 🟢 인허가 찜 목록 세부 정보 가져오기 (MyPage에서는 데이터만 가져오고, 렌더링은 컴포넌트에 위임)
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

          <button
            onClick={() => setOpenDialog("profile")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-800">회원정보 수정</span>
            </div>
          </button>

           <button
            onClick={() => setOpenDialog("myText")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <FileUser className="w-5 h-5 text-red-500" />
              <span className="font-medium text-gray-800">등록글과 신청글</span>
            </div>
          </button>

          <button
            onClick={() => setOpenDialog("register")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-800">업체 등록</span>
            </div>
          </button>

           <button
            onClick={() => setOpenDialog("apply")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Dock className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-gray-800">주문 신청</span>
            </div>
          </button>

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
        <div className={openDialog === "naraFavorites" || openDialog === "permitFavorites" ? "fixed inset-0 flex md:items-center items-start justify-center p-4 overflow-y-auto" : "fixed p-4 inset-0 flex items-center justify-center overflow-y-auto"}>
          <Dialog.Panel
            className={`
              flex flex-col // 내부 요소를 세로로 배열
              w-full max-w-lg // 너비 100%, 데스크톱에서 최대 너비 제한
              relative // 자식 요소 (닫기 버튼)의 absolute 위치 기준
              bg-white rounded-xl shadow-lg p-6 // 기본 스타일

              max-h-[90vh] // 🚨 필수: 다이얼로그 패널의 최대 높이 제한
              h-full // 🚨 필수: 부모가 제공하는 공간을 최대한 활용
              overflow-y-auto // 🚨 핵심: 다이얼로그 패널 자체에 스크롤바 생성 🚨

              // 'register' 또는 'apply'일 때의 예외 스타일 (전체 화면)
              ${openDialog === "register" || openDialog === "apply"
                ? 'bg-transparent shadow-none rounded-none p-0 max-h-screen' // 전체 화면일 때는 최대 높이를 화면 전체로
                : ''
              }
            `}
          >
            <button
              onClick={closeDialog}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dialog Content: 일반 찜 목록 */}
            {openDialog === "favorites" && (
              <div className="flex-shrink-0">
                <Dialog.Title className="text-xl font-bold mb-4">일반 찜 목록</Dialog.Title>
                {wishListDetails.length === 0 ? (
                  <p className="text-gray-500">찜한 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
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

            {/* Dialog Content: 나라장터 찜 목록 (컴포넌트로 대체) */}
            {openDialog === "naraFavorites" && (
              <NaraWishList
                initialNaraWishListDetails={naraWishListDetails}
                initialNaraCount={wishListCount.nara}
                onClose={closeDialog}
              />
            )}

            {/* Dialog Content: 인허가 찜 목록 (컴포넌트로 대체) */}
            {openDialog === "permitFavorites" && (
              <PermitWishList
                initialPermitWishListDetails={permitWishListDetails}
                initialPermitCount={wishListCount.permit}
                onClose={closeDialog}
              />
            )}

            {openDialog === "profile" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">회원정보 수정</Dialog.Title>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newName = formData.get("displayName");

                    try {
                      await updateDoc(doc(db, "users", uid), {
                        displayName: newName,
                      });
                      alert("회원정보 수정 완료!");
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
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      저장
                    </button>
                  </div>
                </form>
              </div>
            )}

            {openDialog === "myText" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">등록글과 신청글</Dialog.Title>
                {myListDetails.length === 0 ? (
                  <p className="text-gray-500">등록/신청한 글이 없습니다.</p>
                ) : (
                  <div className="space-y-3"> {/* overflow-y-auto는 Panel에서 */}
                    {myListDetails.map((item) => (
                      <div key={item.itemId} className="border p-3 rounded-lg hover:bg-gray-50 transition">
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

            {openDialog === "register" && (
              <div className="w-full h-full">
                <CategoryUpload onClose={closeDialog} />
              </div>
            )}

            {openDialog === "apply" && (
              <div className="w-full h-full">
                <ConUpload onClose={closeDialog} />
              </div>
            )}

            {openDialog === "notifications" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">알림 설정</Dialog.Title>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">앱 알림 활성화</span>
                  <button
                    onClick={toggleNotice}
                    className={`px-4 py-2 rounded-md ${
                      noticeEnabled ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {noticeEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            )}

            {openDialog === "help" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">고객센터</Dialog.Title>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <a href="tel:010-1234-5678" className="text-gray-800 font-medium">
                      전화 문의: 010-1234-5678
                    </a>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-800 font-medium">
                      카카오톡 문의: @채널명
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}