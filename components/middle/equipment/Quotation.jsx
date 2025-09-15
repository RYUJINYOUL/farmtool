"use client";

import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDoc, getDocs, updateDoc, arrayRemove } from "firebase/firestore";
import { storage, db } from '../../../firebase';
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { ref as strRef, deleteObject } from "firebase/storage"; // 이미지 삭제
import Link from "next/link";
import EditUpload from "@/components/middle/equipment/EditUpload"

const PostDetailWithQuotation = ({ id, col, postAuthorUid, postImageUrls, listBasePath }) => {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const timeFromNow = timestamp => moment(timestamp.toDate()).format('YYYY.MM.DD');
  const [quotations, setQuotations] = useState([]);
  const { currentUser } = useSelector(state => state.user);
  const { push } = useRouter();
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false); // 명확성을 위해 'isOpen'에서 이름 변경

  // 🔥 유저의 division 가져오기
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

  // --- 견적서 데이터 가져오기 ---
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

  function openCategory () {
  if (currentUser?.uid) {
    setIsUserProfileModalOpen(true)
  } else {
    router.push('/login')
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
          const division = await getUserDivision(data.uid); // 🔥 division 가져오기
          return {
            id: docSnap.id,
            companyName: data.companyName,
            content: data.content,
            price: data.price,
            createdDate: data.createdDate,
            phoneNumber: data.phoneNumber,
            uid: data.uid, // 견적 작성자 uid
            division: division, // 🔥 division 포함
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
                      category: "equipment", 
                      top : 'equipApply',
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
      <section className="flex flex-col items-center mb-8">
        <div className='w-full max-w-[1100px]'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>견적서</h2>
            <div className='flex items-center gap-2'>
              <button
                className='px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md border border-gray-200 hover:border-gray-300 transition-colors bg-white'
                onClick={() => {
                  push(`${listBasePath}?tab=upload`);
                }}
              >목록</button>
              {currentUser?.uid === postAuthorUid && (
                <>
                  <button
                    className='px-3 py-1.5 text-sm text-red-600 hover:text-red-700 rounded-md border border-red-200 hover:border-red-300 transition-colors bg-white'
                    onClick={deleteMainPost}
                  >삭제</button>
                  <button
                    className='px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 rounded-md border border-blue-200 hover:border-blue-300 transition-colors bg-white'
                    onClick={() => openCategory()}
                  >수정</button>
                </>
              )}
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
        </div>
      </section>

      <section className='flex justify-center items-center w-full'>
        <div className='w-full max-w-[1100px] space-y-8'>
          {/* 견적서 리스트 */}
          <div className="space-y-4">
            {quotations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500">아직 등록된 견적서가 없습니다.</p>
              </div>
            ) : (
              quotations.map((quotation) => {
                const viewAllowed = isViewAllowed(quotation.uid);
                return (
                  <div
                    key={quotation.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-medium text-gray-900">
                            {viewAllowed ? quotation.companyName : '*****'}
                          </h3>
                          <p className="text-sm text-gray-500">{timeFromNow(quotation.createdDate)}</p>
                        </div>
                        {currentUser?.uid === quotation.uid && (
                          <button
                            onClick={() => { deleteQuotation(quotation.id, quotation.uid); }}
                            className="text-sm text-red-500 hover:text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <dt className="text-sm font-medium text-gray-500">가격</dt>
                          <dd className="text-base text-gray-900">
                            {viewAllowed ? `${quotation.price.toLocaleString()}원` : '*****'}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-sm font-medium text-gray-500">연락처</dt>
                          <dd className="text-base text-gray-900">
                            {viewAllowed ? (
                              <a
                                href={`tel:${quotation.phoneNumber}`}
                                className="text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {quotation.phoneNumber}
                              </a>
                            ) : '*****'}
                          </dd>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-gray-500">견적 내용</dt>
                        <dd className="text-base text-gray-900 whitespace-pre-wrap">
                          {viewAllowed ? quotation.content : '*****'}
                        </dd>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 견적 입력폼 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {currentUser ? (
              <form onSubmit={handleSubmit(onClickAddQuotationButton)} className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">견적서 작성</h3>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200
                        text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                        placeholder-gray-400 transition-colors"
                      placeholder={currentUser?.displayName || "업체명"}
                      {...register("companyName")}
                    />
                  </div>

                  <div>
                    <textarea
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200
                        text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                        placeholder-gray-400 transition-colors resize-y"
                      placeholder="견적 내용을 상세히 작성해주세요."
                      rows="4"
                      {...register("content", { required: "내용을 입력해주세요." })}
                    />
                    {errors.content && 
                      <p className="mt-1 text-sm text-red-600">*{errors.content.message}</p>
                    }
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200
                          text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                          placeholder-gray-400 transition-colors"
                        placeholder="가격 (숫자만 입력)"
                        {...register("price", { required: "가격을 입력해주세요.", valueAsNumber: true })}
                      />
                      {errors.price && 
                        <p className="mt-1 text-sm text-red-600">*{errors.price.message}</p>
                      }
                    </div>

                    <div>
                      <input
                        type="tel"
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200
                          text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                          placeholder-gray-400 transition-colors"
                        placeholder="연락처"
                        {...register("phoneNumber", { required: "연락처를 입력해주세요." })}
                      />
                      {errors.phoneNumber && 
                        <p className="mt-1 text-sm text-red-600">*{errors.phoneNumber.message}</p>
                      }
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                        rounded-lg shadow-sm hover:shadow transition-all duration-200"
                    >
                      견적서 등록
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center">
                <div className="py-8 px-4 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-gray-600">로그인 후 견적서를 작성할 수 있습니다.</p>
                </div>
              </div>
            )}
          </div>
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
