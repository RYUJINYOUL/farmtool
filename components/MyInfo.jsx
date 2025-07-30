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
  arrayRemove,
  deleteDoc,
  query,
  startAfter,
  limit,
  orderBy
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
  UserPen,
  FileUser,
  LayoutGrid,
  Stamp,
} from "lucide-react";
import Link from "next/link";
import CategoryUpload from '@/components/middle/construction/categoryUpload';
import ConUpload from '@/components/middle/construction/conUpload';
import NaraWishList from '@/components/NaraWishList';
import JobWishList from '@/components/JobWishList';
import PermitWishList from '@/components/PermitWishList';


export default function MyInfo() {
  const [openDialog, setOpenDialog] = useState(null);
  const [wishListCount, setWishListCount] = useState({
    general: 0,
    nara: 0,
    permit: 0,
    job: 0,
    myList: 0
  });
  const [userInfo, setUserInfo] = useState({});
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [wishListDetails, setWishListDetails] = useState([]);
  const [myListDetails, setMyListDetails] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const uid = currentUser?.uid;
  const router = useRouter();
  const closeDialog = () => setOpenDialog(null);


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

  return (
 
    <div className="flex flex-col items-center md:justify-center bg-gray-50 pt-5 md:w-[1100px] md:mx-auto">
      {/* 프로필 카드 */}
      <div className="w-full max-w-md md:max-w-full md:w-[1100px] bg-white shadow-md rounded-2xl p-6 text-center">
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
        <div className="mt-6 space-y-3">

          {/* 첫 번째 줄: 일반 찜 목록, 나라장터 찜 목록 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <button
                onClick={() => checkLoginAndOpenDialog("favorites")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span className="font-medium text-gray-800">일반 찜 목록</span>
                </div>
                <span className="text-gray-400 text-sm">{wishListCount.general}개</span>
              </button>
            </div>

            <div className="w-full md:w-1/2">
              <button
                onClick={() => checkLoginAndOpenDialog("naraFavorites")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-gray-800">나라장터 찜 목록</span>
                </div>
                <span className="text-gray-400 text-sm">{wishListCount.nara}개</span>
              </button>
            </div>
          </div>

          {/* 두 번째 줄: 인허가 찜 목록, 회원정보 수정 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <button
                onClick={() => checkLoginAndOpenDialog("permitFavorites")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Stamp className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-gray-800">인허가 찜 목록</span>
                </div>
                <span className="text-gray-400 text-sm">{wishListCount.permit}개</span>
              </button>
            </div>

            <div className="w-full md:w-1/2">
              <button
                onClick={() => checkLoginAndOpenDialog("job")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <UserPen className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-800">구인구직 찜 목록</span>
                </div>
                 <span className="text-gray-400 text-sm">{wishListCount.job}개</span>
              </button>
            </div>
          </div>

          {/* 세 번째 줄: 등록글과 신청글, 업체 등록 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <button
                onClick={() => checkLoginAndOpenDialog("profile")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <UserCog className="w-5 h-5 text-red-400" />
                  <span className="font-medium text-gray-800">회원정보 수정</span>
                </div>
              </button>
            </div>

            <div className="w-full md:w-1/2">
               <button
                onClick={() => checkLoginAndOpenDialog("myText")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <FileUser className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-gray-800">등록글과 신청글</span>
                </div>
                <span className="text-gray-400 text-sm">{wishListCount.myList}개</span>
              </button>
            </div>
          </div>

          {/* 네 번째 줄: 주문 신청, 알림 설정 */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
               <button
                onClick={() => checkLoginAndOpenDialog("register")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-800">업체 등록</span>
                </div>
              </button>
            </div>

            <div className="w-full md:w-1/2">
              <button
                onClick={() => checkLoginAndOpenDialog("apply")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Dock className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-gray-800">주문 신청</span>
                </div>
              </button>
            </div>
          </div>

          {/* 다섯 번째 줄: 고객센터 (단일 버튼) */}
          <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row md:gap-2 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2"> {/* md:w-1/2를 유지하여 다른 버튼과 너비 통일 */}
              <button
                onClick={() => checkLoginAndOpenDialog("notifications")}
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
            {/* 여기에 필요한 경우 두 번째 컬럼을 위한 빈 div 또는 다른 요소를 추가할 수 있습니다. */}
            <div className="hidden md:block w-full md:w-1/2">
            <button
                onClick={() => checkLoginAndOpenDialog("help")}
                className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-800">고객센터</span>
                </div>
              </button>
            </div> {/* 데스크톱에서 공간 유지를 위한 빈 div */}
          </div>
        </div>
      </div>

      {/* Dialog UI */}
      <Dialog open={!!openDialog} onClose={closeDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className={openDialog === "naraFavorites" || openDialog === "permitFavorites" ? "fixed inset-0 flex md:items-center items-start justify-center p-4 overflow-y-auto" : "fixed p-4 inset-0 flex items-center justify-center overflow-y-auto"}>
          <Dialog.Panel
            className={`
              flex flex-col
              w-full max-w-lg
              relative
              bg-white rounded-xl shadow-lg p-6

              max-h-[90vh]
              h-full
              overflow-y-auto

              ${openDialog === "register" || openDialog === "apply"
                ? 'bg-transparent shadow-none rounded-none p-0 max-h-screen'
                : ''
              }
              ${(openDialog === "naraFavorites" || openDialog === "permitFavorites") ? "md:w-[1100px]" : ""}
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
                    {wishListDetails.map((item, idx) => {
                      const isWishListed =
                        Array.isArray(item.favorites) && uid
                          ? item.favorites.includes(uid)
                          : false;

                      return (
                        <div
                          key={idx}
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

            {/* Dialog Content: 구인구직 찜 목록 (컴포넌트로 대체) */}
            {openDialog === "job" && (
              <JobWishList
                onClose={closeDialog}
              />
            )}

            {/* Dialog Content: 나라장터 찜 목록 (컴포넌트로 대체) */}
            {openDialog === "naraFavorites" && (
              <NaraWishList
                onClose={closeDialog}
              />
            )}

            {/* Dialog Content: 인허가 찜 목록 (컴포넌트로 대체) */}
            {openDialog === "permitFavorites" && (
              <PermitWishList
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
                {wishListCount.myList.length === 0 ? (
                  <p className="text-gray-500">등록/신청한 글이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {myListDetails.map((item) => (
                      <div key={item.itemId || uid } className="border p-3 rounded-lg hover:bg-gray-50 transition">
                        <Link
                          href={`/${item.category}/${item.middle}/${item.id || uid}`}
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
                  <CategoryUpload
                    isOpen={true}
                    onClose={() => setOpenDialog(null)}
                  />
              )}

            {openDialog === "apply" && (
                  <ConUpload
                    isOpen={true}
                    onClose={() => setOpenDialog(null)}
                  />
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