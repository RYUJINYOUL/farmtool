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
  arrayRemove 
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
  FileUser
} from "lucide-react";
import Link from "next/link";
import CategoryUpload from '@/components/categoryUpload';
import ConUpload from '@/components/conUpload';

export default function MyPage() {
  const [openDialog, setOpenDialog] = useState(null);
  const [wishList, setWishList] = useState([]);
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
        const constructionDocRef = doc(db, top, itemId);
        const userDocRef = doc(db, "users", userId);
          await updateDoc(constructionDocRef, {
            favorites: arrayRemove(userId)
          });
          await updateDoc(userDocRef, {
            wishList: arrayRemove(wishlistItem)
          });
          setWishListDetails((prevDetails) =>
            prevDetails.filter((msg) => msg.itemId !== itemId)
          );
          setWishList((prev) =>
            prev.filter((item) => item.itemId !== itemId)
          );
      } catch (error) {
        alert("찜하기/찜 해제 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }, [db, currentUser, router]);


  useEffect(() => {
  if (!uid) return;

  const fetchWishListCount = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      const wishList = userDoc.data()?.wishList || [];
      setWishList(wishList); // ✅ 버튼 표시용
    } catch (err) {
      console.error("찜목록 카운트 로드 오류:", err);
    }
  };

  fetchWishListCount();
}, [uid]);

  // 🟢 찜목록 가져오기
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

          console.log(itemDoc)

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
          {/* 찜 목록 */}
          <button
            onClick={() => setOpenDialog("favorites")}
            className="flex items-center justify-between w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-gray-800">찜 목록</span>
            </div>
            <span className="text-gray-400 text-sm">{wishList.length}개</span>
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

            {/* Dialog Content */}
            {openDialog === "favorites" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">찜 목록</Dialog.Title>
                {wishListDetails.length === 0 ? (
                  <p className="text-gray-500">찜한 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                  {wishListDetails.map((item) => {
                    const isWishListed =
                      Array.isArray(item.favorites) && uid
                        ? item.favorites.includes(uid)
                        : false;

                    return ( // ✅ 반드시 return 추가
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
                                  e.preventDefault(); // ✅ Link 클릭 막기
                                  e.stopPropagation(); // ✅ 카드 클릭 막기
                                  toggleFavorite(item.itemId, item.middle, item.category, item.top); // 🟢 item 정보 넘기기
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
                    } catch (err) {
                      console.error("회원정보 수정 오류:", err);
                      alert("회원정보 수정 중 오류가 발생했습니다.");
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    name="displayName" // 🟢 폼 데이터 키
                    placeholder="이름"
                    defaultValue={userInfo.displayName}
                    className="w-full border p-2 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white p-2 rounded-lg"
                  >
                    수정 완료
                  </button>
                </form>
              </div>
            )}

             {/* Dialog Content */}
            {openDialog === "myText" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">등록글과 신청글</Dialog.Title>
                {myListDetails.length === 0 ? (
                  <p className="text-gray-500">글이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                  {myListDetails.map((item) => {
                    return ( // ✅ 반드시 return 추가
                      <div
                        key={uid}
                        className="border p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Link
                          href={`/${item.category}/${item.middle}/${uid}`}
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

            {openDialog === "register" && (
                 <div>
                  <CategoryUpload
                    isOpen={true} // 무조건 열기
                    onClose={() => setOpenDialog(null)} // Dialog 닫기와 동일하게 처리
                  />
                </div>
              )}

            {openDialog === "apply" && (
                <div>
                  <ConUpload
                    isOpen={true} // 무조건 열기
                    onClose={() => setOpenDialog(null)} // Dialog 닫기와 동일하게 처리
                  />
                </div>
              )}

            {openDialog === "notifications" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">알림 설정</Dialog.Title>
                <div className="flex items-center gap-3">
                  <span className="text-gray-700">알림</span>
                  <button
                    onClick={toggleNotice}
                    className={`w-12 h-6 flex items-center rounded-full p-1 ${
                      noticeEnabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform ${
                        noticeEnabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            )}

            {openDialog === "help" && (
              <div>
                <Dialog.Title className="text-xl font-bold mb-4">고객센터</Dialog.Title>
                <div className="space-y-3">
                  <button
                    className="flex items-center justify-center w-full bg-blue-600 text-white p-2 rounded-lg"
                    onClick={() => window.location.href = "tel:123456789"}
                  >
                    <Phone className="mr-2" /> 전화하기
                  </button>
                  <button
                    className="flex items-center justify-center w-full bg-gray-800 text-white p-2 rounded-lg"
                    onClick={() => alert("1:1 문의하기로 이동")}
                  >
                    <MessageSquare className="mr-2" /> 1:1 문의하기
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
