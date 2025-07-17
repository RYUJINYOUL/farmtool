"use client";
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs, getDoc } from "firebase/firestore"; // getDoc 추가
import { storage } from '../../firebase'; // storage만 가져옴
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { ref as strRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import useUIState from "@/hooks/useUIState";
import { db } from '../../firebase'; // Firestore db 인스턴스를 직접 가져오도록 변경


const Comment = ({ id, col, path, urls }) => {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const timeFromNow = timestamp => moment(timestamp.toDate()).format('YYYY.MM.DD');
  const [comments, setComments] = useState([]); // message 대신 comments로 변수명 변경 (더 명확)
  const [postAuthorUid, setPostAuthorUid] = useState(null); // 게시물 작성자 UID 상태
  const { currentUser } = useSelector(state => state.user);
  const { push } = useRouter();
  const { homeCategory, setHomeCategory, setHeaderImageSrc } = useUIState();

  // 현재 게시물 작성자 UID를 가져오는 useEffect (한 번만 실행)
  useEffect(() => {
    const fetchPostAuthor = async () => {
      if (!id || !col) return;
      try {
        const postRef = doc(db, col, id);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const data = postSnap.data();
          setPostAuthorUid(data.uid); // 게시물 데이터에서 UID 필드를 가져와 저장
        }
      } catch (error) {
        console.error("Error fetching post author UID:", error);
      }
    };
    fetchPostAuthor();
  }, [id, col]);


  useEffect(() => {
    const unsubscribe = addCommentsListener(); // 함수명 변경
    return () => {
      unsubscribe();
    };
  }, [id, col]);

  const addCommentsListener = () => { // 함수명 변경
    const commentsQuery = query(collection(db, col, id, "comments"), orderBy("createdDate", "desc"));

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name ?? "익명",
          description: data.description,
          createdDate: data.createdDate,
          uid: data.uid, // 댓글 작성자 UID도 가져옴 (필요시 삭제 버튼 노출에 사용)
        };
      });
      setComments(commentList); // setComments로 변경
    }, (error) => {
      console.error("댓글 실시간 데이터 로딩 중 에러:", error);
    });

    return unsubscribe;
  };

  const deleteComment = async (commentId, commentUid) => {
    // 댓글 작성자와 현재 로그인한 사용자의 UID가 일치할 때만 삭제 허용
    if (currentUser?.uid !== commentUid) {
      alert("댓글을 삭제할 권한이 없습니다.");
      return;
    }

    if (window.confirm("댓글을 삭제 하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, col, id, "comments", commentId));
        alert("댓글이 삭제되었습니다.");
      } catch (error) {
        console.error("댓글 삭제 중 에러:", error);
        alert("댓글 삭제에 실패했습니다.");
      }
    } else {
      alert("삭제를 취소합니다.");
    }
  };

  const onClickAddCommentButton = async (data) => {
    if (!currentUser?.uid) { // 로그인하지 않은 경우 댓글 작성 불가
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }
    try {
      await addDoc(collection(db, col, id, "comments"), {
        "name": currentUser?.name ?? "익명",
        "description": data.description,
        "createdDate": new Date(),
        "uid": currentUser.uid, // 댓글 작성자 UID 저장
      });
      reset();
      alert("댓글이 등록되었습니다!");
    } catch (error) {
      console.error("댓글 등록 중 에러:", error);
      alert("댓글 등록에 실패했습니다.");
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

    const deletePromises = imageUrls.map((url) => {
      const path = extractStoragePath(url);
      if (!path) {
        console.warn(`유효하지 않은 스토리지 URL: ${url}`);
        return Promise.resolve();
      }
      const fileRef = strRef(storage, path);
      return deleteObject(fileRef)
        .then(() => console.log(`Deleted image from storage: ${path}`))
        .catch((err) => console.error(`Error deleting image ${path} from storage:`, err));
    });

    await Promise.all(deletePromises);
  };

  const deleteMainDocumentAndComments = async (mainDocId) => {
    // 게시물 작성자와 현재 로그인한 사용자의 UID가 일치할 때만 삭제 허용
    if (currentUser?.uid !== postAuthorUid) {
      alert("게시물을 삭제할 권한이 없습니다.");
      return;
    }

    if (window.confirm("게시물과 모든 댓글을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        const commentsQuery = collection(db, col, mainDocId, "comments");
        const querySnapshot = await getDocs(commentsQuery);
        const deleteCommentPromises = querySnapshot.docs.map(async (commentDoc) => {
          await deleteDoc(doc(db, col, mainDocId, "comments", commentDoc.id));
        });
        await Promise.all(deleteCommentPromises);

        if (urls && urls.length > 0) {
          await deleteAssociatedImages(urls);
        }

        await deleteDoc(doc(db, col, mainDocId));

        alert("게시물과 모든 관련 데이터가 성공적으로 삭제되었습니다.");
        // path를 잘라 /con으로 이동
        const baseConPath = path.substring(0, path.indexOf('/', 1)); // '/con' 부분만 추출
        push(baseConPath);
      } catch (error) {
        console.error("게시물 삭제 중 에러:", error);
        alert("게시물 삭제에 실패했습니다.");
      }
    } else {
      alert("게시물 삭제를 취소합니다.");
    }
  };

  return (
    <div>
      <section className="flex gap-[25px] flex-col justify-center items-center">
        <div className='flex flex-col lg:w-[1100px] w-full'>
          <div className='flex flex-row items-center justify-between lg:w-[1100px] w-full'>
            <div className='font-semibold text-[20px]'>답변</div>
            <div className='flex flex-row items-center gap-3'>
              <button
                className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200'
                onClick={() => {
                  const baseConPath = path.substring(0, path.indexOf('/', 1)); // '/con' 부분만 추출
                  push(baseConPath);
                }}
              >목록</button>
              {/* 게시물 작성자(postAuthorUid)와 현재 로그인 사용자(currentUser?.uid)가 일치할 때만 삭제 버튼 표시 */}
              {currentUser?.uid === postAuthorUid && (
                <button
                  className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200'
                  onClick={() => { deleteMainDocumentAndComments(id) }}
                >게시물 삭제</button>
              )}
            </div>
          </div>
          <hr className="mt-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
        </div>
      </section>

      <section className='flex justify-center items-center w-full'>
        <div className='flex flex-col lg:w-[1100px] p-5 w-full bg-[#fafafa]'>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-10">아직 답변이 없습니다.</div>
          ) : (
            comments.map(({ name, description, createdDate, id: commentId, uid: commentUid }, index) => {
              return (
                <div key={commentId} className="border-b border-gray-200 py-4 last:border-b-0">
                  <div className='flex md:flex-row flex-col md:justify-between items-start w-full'>
                    <div className='text-[13px] text-gray-700'>{name}</div>
                    <div className='text-[13px] text-gray-500'>{timeFromNow(createdDate)}</div>
                  </div>
                  <div className='mt-2 text-[15px] text-[#666] leading-7 text-start'>{description}</div>
                  {/* 댓글 작성자 UID와 현재 로그인 사용자 UID가 일치할 때만 삭제 버튼 표시 */}
                  {currentUser?.uid === commentUid && (
                    <button
                      className='mt-2 text-[12px] text-red-500 p-0.5 rounded-sm border border-gray-200 hover:bg-red-50'
                      onClick={() => { deleteComment(commentId, commentUid) }}
                    >삭제</button>
                  )}
                </div>
              );
            })
          )}

          <div className='mt-3' />

          {/* 댓글 입력 폼 */}
          {currentUser ? (
            <form
              className='flex flex-col md:p-0 pr-10 w-full items-center justify-center'
              onSubmit={handleSubmit(onClickAddCommentButton)}
            >
              <div className='flex flex-row md:w-[1100px] w-full items-start justify-center'>
                <textarea
                  className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200
                     placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white resize-y"
                  placeholder="답변을 입력해주세요."
                  name="description"
                  rows="3"
                  cols="16"
                  {...register("description", { required: "내용을 입력해주세요." })}
                />
                <div className='w-1/11 h-[95px] flex items-center justify-center ml-2'>
                  <button
                    type="submit"
                    className="h-full text-white px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors
                                 text-[16px] text-center whitespace-nowrap"
                  >
                    등록
                  </button>
                </div>
              </div>
              {errors.description && <p className="text-red-500 text-xs mt-1 self-start ml-2">*{errors.description.message}</p>}
            </form>
          ) : (
            <div className="text-center text-gray-500 py-5 border border-gray-200 rounded-lg bg-white">
              로그인 후 답변을 작성할 수 있습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Comment;
