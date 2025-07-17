"use client";
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, setDoc } from "firebase/firestore";
import { storage } from '../../firebase';
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { ref as strRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"; // Keep these for image deletion
import { db } from '../../firebase';

// This component now handles post management (deletion) and quotations.
// It assumes the parent component (e.g., app/con/apply/[id]/page.jsx) passes:
// - id: The ID of the main post.
// - col: The Firestore collection name for the main post (e.g., "conApply").
// - postAuthorUid: The UID of the user who originally created the main post.
// - postImageUrls: An array of image URLs associated with the main post, to be deleted with the post.
// - listBasePath: The base path to navigate back to the list (e.g., "/con/apply").

const PostDetailWithQuotation = ({ id, col, postAuthorUid, postImageUrls, listBasePath }) => {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const timeFromNow = timestamp => moment(timestamp.toDate()).format('YYYY.MM.DD');
  const [quotations, setQuotations] = useState([]);
  const { currentUser } = useSelector(state => state.user);
  const { push } = useRouter();

  // --- Quotation Listeners and Logic ---
  useEffect(() => {
    // Only fetch quotations if id and col are provided
    if (!id || !col) {
      console.warn("Quotation: Missing id or col props.");
      return;
    }
    const unsubscribe = addQuotationsListener();
    return () => {
      unsubscribe();
    };
  }, [id, col]);

  const addQuotationsListener = () => {
    const quotationsQuery = query(collection(db, col, id, "quotations"), orderBy("createdDate", "desc"));

    const unsubscribe = onSnapshot(quotationsQuery, (snapshot) => {
      const quotationList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          companyName: data.companyName,
          content: data.content,
          price: data.price,
          createdDate: data.createdDate,
          uid: data.uid, // Quotation author UID
        };
      });
      setQuotations(quotationList);
    }, (error) => {
      console.error("Error fetching quotation data:", error);
    });

    return unsubscribe;
  };

  const isViewAllowed = (quotationUid) => {
    // Allow view if current user is the original post author OR the quotation author
    return currentUser && (currentUser.uid === postAuthorUid || currentUser.uid === quotationUid);
  };

  const onClickAddQuotationButton = async (data) => {
    console.log(id)
    console.log(db)
    console.log(col)
    console.log(data)
    console.log(currentUser.uid)
    if (!currentUser?.uid) {
      alert("로그인 후 견적서를 작성할 수 있습니다.");
      return;
    }
    if (window.confirm("견적서를 등록하시겠습니까?")) {
      try {
        await addDoc(collection(db, col, id, "quotations"), {
          "companyName": currentUser?.name ?? "익명", // Quotation author's name
          "content": data.content,
          "price": data.price,
          "createdDate": new Date(),
          "uid": currentUser.uid, // Save quotation author's UID
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
    // Only allow quotation author to delete their own quotation
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

  // --- Post Deletion Logic (from Comment component) ---
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

    if (!imageUrls || imageUrls.length === 0) {
      console.log("No images to delete.");
      return;
    }

    console.log("Attempting to delete associated images:", imageUrls);
    const deletePromises = imageUrls.map((url) => {
      const path = extractStoragePath(url);
      if (!path) {
        console.warn(`Invalid storage URL, skipping deletion: ${url}`);
        return Promise.resolve();
      }
      const fileRef = strRef(storage, path);
      return deleteObject(fileRef)
        .then(() => console.log(`Deleted image from storage: ${path}`))
        .catch((err) => {
          console.error(`Error deleting image ${path} from storage:`, err);
          // Don't re-throw, allow other deletions to proceed
        });
    });

    await Promise.all(deletePromises);
    console.log("All image deletion attempts completed.");
  };

  const deleteMainPost = async () => { // Renamed from deleteMainDocumentAndComments
    // Only allow original post author to delete the post
    if (currentUser?.uid !== postAuthorUid) {
      alert("게시물을 삭제할 권한이 없습니다.");
      return;
    }

    if (window.confirm("게시물과 모든 관련 데이터(견적서, 이미지)를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        // 1. Delete all quotations associated with this post
        const quotationsCollectionRef = collection(db, col, id, "quotations");
        const querySnapshot = await getDocs(quotationsCollectionRef);
        const deleteQuotationPromises = querySnapshot.docs.map(async (quotationDoc) => {
          await deleteDoc(doc(db, col, id, "quotations", quotationDoc.id));
        });
        await Promise.all(deleteQuotationPromises);
        console.log("All associated quotations deleted.");

        // 2. Delete associated images from Storage
        if (postImageUrls && postImageUrls.length > 0) {
          await deleteAssociatedImages(postImageUrls);
        }

        // 3. Delete the main post document
        await deleteDoc(doc(db, col, id));
        console.log("Main post document deleted.");

        alert("게시물과 모든 관련 데이터가 성공적으로 삭제되었습니다.");
        push(listBasePath); // Navigate back to the list page
      } catch (error) {
        console.error("Error deleting main post and its data:", error);
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
                onClick={() => push(listBasePath)}
              >목록</button>
              {/* Post Author Only: Delete Post Button */}
              {currentUser?.uid === postAuthorUid && (
                <button
                  className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200'
                  onClick={deleteMainPost}
                >게시물 삭제</button>
              )}
            </div>
          </div>
          <hr className="mt-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
        </div>
      </section>

      <section className='flex justify-center items-center w-full'>
        <div className='flex flex-col lg:w-[1100px] p-5 w-full bg-[#fafafa]'>

          {/* Quotation List */}
          {quotations.length === 0 ? (
            <div className="text-center text-gray-500 py-10">아직 등록된 견적서가 없습니다.</div>
          ) : (
            quotations.map((quotation) => {
              const viewAllowed = isViewAllowed(quotation.uid);

              return (
                <div key={quotation.id} className="border-b border-gray-200 py-4 last:border-b-0">
                  <div className='flex flex-col md:flex-row md:justify-between items-start w-full'>
                    <div className='text-[14px] font-semibold text-gray-800'>
                      업체명: {viewAllowed ? quotation.companyName : '*****'}
                    </div>
                    <div className='text-[13px] text-gray-500'>
                      등록일: {timeFromNow(quotation.createdDate)}
                    </div>
                  </div>
                  <div className='mt-2 text-[15px] text-[#666] leading-7 text-start'>
                    <p className='font-medium'>내용:</p>
                    <p>{viewAllowed ? quotation.content : '*****'}</p>
                  </div>
                  <div className='mt-2 text-[15px] text-[#666] leading-7 text-start'>
                    <p className='font-medium'>가격:</p>
                    <p>{viewAllowed ? `${quotation.price}원` : '*****'}</p>
                  </div>

                  {/* Quotation Author Only: Delete Button */}
                  {currentUser?.uid === quotation.uid && (
                    <button
                      className='mt-2 text-[12px] text-red-500 p-0.5 rounded-sm border border-gray-200 hover:bg-red-50'
                      onClick={() => { deleteQuotation(quotation.id, quotation.uid); }}
                    >삭제</button>
                  )}
                </div>
              );
            })
          )}

          <div className='mt-5' />

          {/* Quotation Input Form */}
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
                  placeholder="업체명 (자동 채워짐)"
                  readOnly
                  value={currentUser?.name || "익명"}
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
    </div>
  );
};

export default PostDetailWithQuotation;