"use client";

import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { collection, addDoc, onSnapshot, getDoc, arrayRemove, query, orderBy, doc, deleteDoc, updateDoc, getDocs } from "firebase/firestore";
import { storage, db } from '../../firebase';
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { ref as strRef, deleteObject } from "firebase/storage";
import Link from "next/link";
import EditUpload from "@/components/middle/construction/EditUpload";
import useUserExpirationDate from '@/hooks/useUserExpirationDate'; // 훅 임포트

const PostDetailWithQuotation = ({ id, col, postAuthorUid, postImageUrls, listBasePath }) => {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const timeFromNow = timestamp => moment(timestamp.toDate()).format('YYYY.MM.DD');
  const [quotations, setQuotations] = useState([]);
  const { currentUser } = useSelector(state => state.user);
  const { push } = useRouter();
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // ✅ 훅을 사용하여 유료 회원 만료일자 가져오기
  const userExpirationDate = useUserExpirationDate();
  const Datetimenow = new Date();

  // ✅ 견적서 작성 권한 확인 함수
  const hasQuotationPermission = () => {
    // 1. 로그인했는지 확인
    if (!currentUser?.uid) return false;
    // 2. 현재 사용자가 게시글 작성자인지 확인
    if (currentUser.uid === postAuthorUid) return true;
    // 3. 유료 회원인지 확인 (유효 기간이 현재 날짜보다 크면 유료 회원)
    return userExpirationDate && userExpirationDate > Datetimenow;
  };

  const getUserDivision = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return userData.division || null;
      }
      console.warn(`User document for uid ${uid} not found.`);
      return null;
    } catch (error) {
      console.error("Error fetching division:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!id || !col) {
      console.warn("Quotation: Missing id or col props.");
      return;
    }
    const unsubscribe = addQuotationsListener();
    return () => {
      unsubscribe();
    };
  }, [id, col]);

  function openCategory() {
    if (currentUser?.uid) {
      setIsUserProfileModalOpen(true);
    } else {
      push('/login');
    }
  }

  const addQuotationsListener = () => {
    const quotationsQuery = query(
      collection(db, col, id, "quotations"),
      orderBy("createdDate", "desc")
    );

    const unsubscribe = onSnapshot(quotationsQuery, async (snapshot) => {
      const quotationList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const division = await getUserDivision(data.uid);
          return {
            id: docSnap.id,
            companyName: data.companyName,
            content: data.content,
            price: data.price,
            createdDate: data.createdDate,
            phoneNumber: data.phoneNumber,
            uid: data.uid,
            division: division,
          };
        })
      );
      setQuotations(quotationList);
    }, (error) => {
      console.error("Error fetching quotation data:", error);
    });

    return unsubscribe;
  };

  const isViewAllowed = (quotationUid) => {
    return currentUser && (currentUser.uid === postAuthorUid || currentUser.uid === quotationUid);
  };

  const onClickAddQuotationButton = async (data) => {
    if (!currentUser?.uid) {
      alert("로그인 후 견적서를 작성할 수 있습니다.");
      return;
    }
    
    // ✅ 유료 회원 여부 확인
    if (!hasQuotationPermission()) {
      if (window.confirm("유료 회원만 견적서 등록이 가능합니다. 결제 페이지로 이동하시겠습니까?")) {
        push('/payments/checkout');
      }
      return;
    }

    if (window.confirm("견적서를 등록하시겠습니까?")) {
      try {
        await addDoc(collection(db, col, id, "quotations"), {
          companyName: data.companyName || currentUser?.displayName,
          content: data.content,
          price: data.price,
          createdDate: new Date(),
          phoneNumber: data.phoneNumber,
          uid: currentUser.uid,
        });
        reset();
        alert("견적서가 등록되었습니다!");
      } catch (error) {
        console.error("Error adding quotation:", error);
        alert("견적서 등록에 실패했습니다.");
      }
    } else {
      alert("견적서 등록을 취소합니다.");
    }
  };

  const deleteQuotation = async (quotationId, quotationUid) => {
    if (currentUser?.uid !== quotationUid) {
      alert("견적서를 삭제할 권한이 없습니다.");
      return;
    }
    if (window.confirm("견적서를 삭제 하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, col, id, "quotations", quotationId));
        alert("견적서가 삭제되었습니다.");
      } catch (error) {
        console.error("Error deleting quotation:", error);
        alert("견적서 삭제에 실패했습니다.");
      }
    } else {
      alert("삭제를 취소합니다.");
    }
  };

  const deleteAssociatedImages = async (imageUrls) => {
    const extractStoragePath = (url) => {
      try {
        const decoded = decodeURIComponent(url);
        const match = decoded.match(/\/o\/(.+?)(?:\?alt=|%3Falt=)/);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    };

    if (!imageUrls || imageUrls.length === 0) return;

    const deletePromises = imageUrls.map((url) => {
      const path = extractStoragePath(url);
      if (!path) return Promise.resolve();
      const fileRef = strRef(storage, path);
      return deleteObject(fileRef)
        .then(() => console.log(`Deleted image: ${path}`))
        .catch((err) => console.error(`Error deleting image ${path}:`, err));
    });
    await Promise.all(deletePromises);
  };

  const deleteMainPost = async () => {
    if (currentUser?.uid !== postAuthorUid) {
      alert("게시물을 삭제할 권한이 없습니다.");
      return;
    }
    if (window.confirm("게시물과 모든 데이터를 삭제하시겠습니까?")) {
      try {
        const quotationsCollectionRef = collection(db, col, id, "quotations");
        const querySnapshot = await getDocs(quotationsCollectionRef);
        const deleteQuotationPromises = querySnapshot.docs.map(async (quotationDoc) => {
          await deleteDoc(doc(db, col, id, "quotations", quotationDoc.id));
        });
        await Promise.all(deleteQuotationPromises);

        if (postImageUrls && postImageUrls.length > 0) {
          await deleteAssociatedImages(postImageUrls);
        }

        const itemToRemove = {
          category: "construction",
          top: col, // 'conApply' 또는 'proApply'를 동적으로 사용
          middle: "apply",
          id: id,
        };

        const userDocRef = doc(db, "users", currentUser?.uid);
        await updateDoc(userDocRef, {
          myList: arrayRemove(itemToRemove),
        });

        await deleteDoc(doc(db, col, id));
        alert("게시물이 삭제되었습니다.");
        push(listBasePath);
      } catch (error) {
        console.error("Error deleting main post:", error);
        alert("게시물 삭제에 실패했습니다.");
      }
    } else {
      alert("게시물 삭제를 취소합니다.");
    }
  };

  return (
    <div>
      <section className="flex gap-[25px] flex-col justify-center items-center mt-10">
        <div className='flex flex-col lg:w-[1100px] w-full'>
          <div className='flex flex-row items-center justify-between lg:w-[1100px] w-full'>
            <div className='font-semibold text-[20px]'>견적서</div>
            <div className='flex flex-row items-center gap-3'>
              <button
                className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200'
                onClick={() => {
                  push(`${listBasePath}?tab=upload`);
                }}
              >목록</button>
              {currentUser?.uid === postAuthorUid && (
                <>
                  <button
                    className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200'
                    onClick={deleteMainPost}
                  >게시물 삭제</button>

                  <button
                    className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200'
                    onClick={() => openCategory()}
                  >게시물 수정</button>
                </>
              )}
            </div>
          </div>
          <hr className="mt-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
        </div>
      </section>

      <section className='flex justify-center items-center w-full'>
        <div className='flex flex-col lg:w-[1100px] p-5 w-full bg-[#fafafa]'>

          {/* 견적서 리스트 */}
          {quotations.length === 0 ? (
            <div className="text-center text-gray-500 py-10">아직 등록된 견적서가 없습니다.</div>
          ) : (
            quotations.map((quotation) => {
              const viewAllowed = isViewAllowed(quotation.uid);
              return (
                <div
                  key={quotation.id}
                  className="border border-gray-200 rounded-lg overflow-hidden mb-4"
                >
                  <table className="min-w-full text-sm text-left text-gray-700">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 w-32 bg-gray-50 font-medium">업체명</th>
                        <td className="px-4 py-2">{viewAllowed ? quotation.companyName : '*****'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 bg-gray-50 font-medium">등록일</th>
                        <td className="px-4 py-2">{timeFromNow(quotation.createdDate)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 bg-gray-50 font-medium">가격</th>
                        <td className="px-4 py-2">{viewAllowed ? `${quotation.price}원` : '*****'}</td>
                      </tr>
                      <tr>
                        <th className="px-4 py-2 bg-gray-50 font-medium">연락처</th>
                        <td className="px-4 py-2">
                          {viewAllowed ? (
                            <a
                              href={`tel:${quotation.phoneNumber}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {quotation.phoneNumber}
                            </a>
                          ) : (
                            '*****'
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-2 bg-gray-50 font-medium">내용</th>
                        <td className="px-4 py-2">{viewAllowed ? quotation.content : '*****'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {currentUser?.uid === quotation.uid && (
                    <button
                      className='px-4 py-2 mt-2 text-[12px] text-red-500 p-0.5 hover:bg-red-50'
                      onClick={() => { deleteQuotation(quotation.id, quotation.uid); }}
                    >삭제</button>
                  )}
                </div>
              );
            })
          )}

          <div className='mt-5' />

          {/* 견적 입력폼 */}
          {currentUser ? (
            <form
              className='flex flex-col md:p-0 pr-10 w-full items-center justify-center'
              onSubmit={handleSubmit(onClickAddQuotationButton)}
            >
              <h3 className='text-lg font-bold mb-3 self-start'>견적서 작성</h3>
              <div className='w-full mb-3'>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg font-medium bg-gray-100 border border-gray-200
                  placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                  placeholder={currentUser?.displayName}
                  {...register("companyName")}
                />
              </div>
              <div className='w-full mb-3'>
                <textarea
                  className="w-full px-4 py-2 rounded-lg font-medium bg-gray-100 border border-gray-200
                  placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white resize-y"
                  placeholder="견적 내용 (상세 설명)"
                  rows="4"
                  {...register("content", { required: "내용을 입력해주세요." })}
                />
                {errors.content && <p className="text-red-500 text-xs mt-1 self-start">*{errors.content.message}</p>}
              </div>
              <div className='w-full mb-3'>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg font-medium bg-gray-100 border border-gray-200
                  placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                  placeholder="가격 (숫자만 입력)"
                  {...register("price", { required: "가격을 입력해주세요.", valueAsNumber: true })}
                />
                {errors.price && <p className="text-red-500 text-xs mt-1 self-start">*{errors.price.message}</p>}
              </div>
              <div className='w-full mb-3'>
                <input
                  type="tel"
                  className="w-full px-4 py-2 rounded-lg font-medium bg-gray-100 border border-gray-200
                  placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                  placeholder="연락처"
                  {...register("phoneNumber", { required: "연락처를 입력해주세요." })}
                />
              </div>
              <div className='w-full flex justify-end'>
                <button
                  type="submit"
                  className="text-white px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-[16px] whitespace-nowrap"
                >
                  견적 등록
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center text-gray-500 py-5 border border-gray-200 rounded-lg bg-white">
              로그인 후 견적서를 작성할 수 있습니다.
            </div>
          )}
        </div>
      </section>

      <EditUpload
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        col={col}
        id={id}
      />
    </div>
  );
};

export default PostDetailWithQuotation;