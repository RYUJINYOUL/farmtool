"use client";
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { updateDoc, arrayRemove, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs, getDoc } from "firebase/firestore"; // getDoc 추가
import { storage } from '../../../firebase'; // storage만 가져옴
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { ref as strRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import useUIState from "@/hooks/useUIState";
import { db } from '../../../firebase'; // Firestore db 인스턴스를 직접 가져오도록 변경
import EditUpload from "@/components/middle/construction/EditUpload2"

const Comment = ({ id, col, path, urls }) => {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const timeFromNow = timestamp => moment(timestamp.toDate()).format('YYYY.MM.DD');
  const [comments, setComments] = useState([]); // message 대신 comments로 변수명 변경 (더 명확)
  const [postAuthorUid, setPostAuthorUid] = useState(null); // 게시물 작성자 UID 상태
  const { currentUser } = useSelector(state => state.user);
  const { push } = useRouter();
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // 현재 게시물 작성자 UID를 가져오는 useEffect (한 번만 실행)
  useEffect(() => {
    const fetchPostAuthor = async () => {
      if (!id || !col) return;
      try {
        const postRef = doc(db, col, id);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const data = postSnap.data();
          setPostAuthorUid(data.userKey); // 게시물 데이터에서 UID 필드를 가져와 저장
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
          name: data.name ?? "",
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
        "name": currentUser?.displayName ?? "알수없음",
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

        const itemToRemove = {
                      category: col, 
                      top : col,
                      middle: "registration",  
                    };
        
                  const userDocRef = doc(db, "users", currentUser?.uid);
                  await updateDoc(userDocRef, {
                    myList: arrayRemove(itemToRemove),
                  });

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


  function openCategory () {
      if (currentUser?.uid) {
        setIsUserProfileModalOpen(true)
      } else {
        push('/login') // router.push 대신 props로 받은 push 사용 또는 useRouter()로 가져오기
      }
    }


  return (
    <div>
      <section className="flex flex-col justify-center items-center space-y-6">
        <div className='w-full max-w-[1100px]'>
          <div className='flex items-center justify-between pb-4 border-b border-gray-200'>
            <h2 className='text-xl md:text-2xl font-bold text-gray-900'>답변</h2>
            <div className='flex items-center gap-2'>
              <button
                className='px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md border border-gray-200 hover:border-gray-300 transition-colors bg-white'
                onClick={() => {
                  const baseConPath = path.substring(0, path.indexOf('/', 1));
                  push(baseConPath);
                }}
              >목록</button>
              {currentUser?.uid === postAuthorUid && (
                <>
                  <button
                    className='px-3 py-1.5 text-sm text-red-600 hover:text-red-700 rounded-md border border-red-200 hover:border-red-300 transition-colors bg-white'
                    onClick={() => { deleteMainDocumentAndComments(id) }}
                  >삭제</button>
                  <button
                    className='px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 rounded-md border border-blue-200 hover:border-blue-300 transition-colors bg-white'
                    onClick={() => openCategory()}
                  >수정</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className='flex justify-center items-center w-full'>
        <div className='w-full max-w-[1100px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
          {/* 답변 입력 폼 */}
          {currentUser ? (
            <div className="border-b border-gray-100">
              <form
                className='p-6'
                onSubmit={handleSubmit(onClickAddCommentButton)}
              >
                <div className='space-y-4'>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200
                      placeholder-gray-400 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:bg-white
                      focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                    placeholder="답변을 입력해주세요."
                    name="description"
                    rows="3"
                    {...register("description", { required: "내용을 입력해주세요." })}
                  />
                  <div className='flex justify-end'>
                    <button
                      type="submit"
                      className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 
                        transition-colors duration-200 flex items-center gap-2"
                    >
                      답변 등록
                    </button>
                  </div>
                  {errors.description && 
                    <p className="text-red-500 text-xs">*{errors.description.message}</p>
                  }
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="py-8 px-4 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-gray-600">로그인 후 답변을 작성할 수 있습니다.</p>
              </div>
            </div>
          )}

          {/* 답변 목록 */}
          <div className="divide-y divide-gray-100">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">아직 답변이 없습니다.</div>
            ) : (
              comments.map(({ name, description, createdDate, id: commentId, uid: commentUid }) => (
                <div key={commentId} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className="text-sm text-gray-500">{timeFromNow(createdDate)}</span>
                    </div>
                    {currentUser?.uid === commentUid && (
                      <button
                        className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors"
                        onClick={() => { deleteComment(commentId, commentUid) }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>
                </div>
              ))
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

export default Comment;
