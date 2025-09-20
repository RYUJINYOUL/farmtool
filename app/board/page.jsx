"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../firebase';
import PagePadding from '@/components/ui/PagePadding';
import Link from 'next/link';
import { RiAddLine } from 'react-icons/ri';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const swiperStyles = `
  .swiper-button-next,
  .swiper-button-prev {
    color: #16a34a;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    font-weight: bold;
  }

  .swiper-button-next:after,
  .swiper-button-prev:after {
    font-size: 12px;
    font-weight: 900;
  }

  .swiper-pagination-bullet {
    width: 6px;
    height: 6px;
    background: rgba(22, 163, 74, 0.3);
    opacity: 1;
  }

  .swiper-pagination-bullet-active {
    background: #16a34a;
  }
`;

// 카테고리별 더미 데이터
// 게시물 목록을 가져오는 함수
const formatTimestamp = (timestamp) => {
  if (!timestamp) return new Date().toLocaleDateString();
  if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
  return timestamp;
};

const fetchPosts = async (db, category) => {
  try {
    let q = collection(db, 'board');
    if (category && category !== 'all') {
      q = query(q, where('category', '==', category));
    }
    const querySnapshot = await getDocs(q);
    console.log('Fetching posts for category:', category);
    console.log('Found posts:', querySnapshot.docs.length);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Post data:', data);
      
      // 답글 날짜도 변환
      const replies = data.replies?.map(reply => ({
        ...reply,
        createdAt: formatTimestamp(reply.createdAt)
      })) || [];

      return {
        id: doc.id,
        ...data,
        replies,
        createdAt: formatTimestamp(data.createdAt)
      };
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'construction', label: '건설' },
  { id: 'landscape', label: '조경' },
  { id: 'equipment', label: '장비' },
  { id: 'materials', label: '자재' },
  { id: 'professionals', label: '전문인력' },
];

// 카테고리 ID를 한글로 변환하는 함수
const getCategoryLabel = (categoryId) => {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.label : categoryId;
};

const PostDetail = ({ post, auth, onAddReply, onDeleteReply, replyContent, setReplyContent }) => {
  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 게시물 내용 */}
      <div className="bg-white rounded-lg overflow-hidden">
        {/* 이미지 슬라이더 */}
        {post.images?.length > 0 && (
          <div className="relative aspect-[16/9] max-h-[500px]">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              loop={true}
              className="h-full rounded-lg"
            >
              {post.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={image}
                    alt={`${post.title} - 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* 텍스트 내용 */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {getCategoryLabel(post.category)}
            </span>
            <span className="text-sm text-gray-500">
              조회 {post.views}
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <p className="text-gray-600 whitespace-pre-wrap mb-6">{post.content}</p>

          {/* 태그 */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 링크 */}
          {post.link && (
            <div className="border-t pt-4 flex justify-end">
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                링크
              </a>
            </div>
          )}

          {/* 날짜와 작성자 */}
          <div className="mt-6 text-sm text-gray-500 flex justify-between items-center">
            <span>작성자: {post.userName || '익명'}</span>
            <span>{post.createdAt}</span>
          </div>

          {/* 답글 섹션 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">답글</h3>
            <div className="space-y-4">
              {post.replies?.map((reply, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{reply.userName || '익명'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{reply.createdAt}</span>
                      {(!reply.userId || auth.currentUser?.uid === reply.userId) && (
                        <button
                          onClick={() => onDeleteReply(post.id, reply.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}

              {/* 답글 작성 폼 */}
              {auth.currentUser ? (
                <form onSubmit={(e) => onAddReply(e, post.id)} className="mt-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 작성하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      답글 작성
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 text-center">
                  <Link href="/login" className="text-green-600 hover:text-green-700">
                    로그인하고 답글 작성하기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PhotoBoard() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    link: '',
    searchTags: ''
  });
  const [replyContent, setReplyContent] = useState('');
  const auth = getAuth(app);

  // 답글 추가
  const handleAddReply = async (e, postId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const db = getFirestore(app);
      const postRef = doc(db, 'board', postId);
      const replyData = {
        content: replyContent,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || '익명',
        createdAt: serverTimestamp(),
        id: Date.now().toString() // 임시 ID
      };

      // 기존 답글 배열에 새 답글 추가
      await updateDoc(postRef, {
        replies: arrayUnion(replyData)
      });

      // 게시물 다시 불러오기
      const updatedPost = (await getDoc(postRef)).data();
      setSelectedPost({
        id: postId,
        ...updatedPost
      });
      setReplyContent('');
      alert('답글이 등록되었습니다.');
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('답글 등록에 실패했습니다.');
    }
  };

  // 답글 삭제
  const handleDeleteReply = async (postId, replyId) => {
    if (!window.confirm('답글을 삭제하시겠습니까?')) return;

    try {
      const db = getFirestore(app);
      const postRef = doc(db, 'board', postId);
      const post = await getDoc(postRef);
      const replies = post.data().replies || [];

      // 답글 필터링
      const updatedReplies = replies.filter(reply => reply.id !== replyId);

      // 업데이트된 답글 배열로 문서 업데이트
      await updateDoc(postRef, {
        replies: updatedReplies
      });

      // 게시물 다시 불러오기
      const updatedPost = (await getDoc(postRef)).data();
      setSelectedPost({
        id: postId,
        ...updatedPost
      });
      alert('답글이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('답글 삭제에 실패했습니다.');
    }
  };

  // 게시물 삭제
  const handleDelete = async (postId, imageUrls = []) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const db = getFirestore(app);
      const storage = getStorage(app);

      // 이미지 파일 삭제
      await Promise.all(
        imageUrls.map(async (url) => {
          const imageRef = ref(storage, url);
          try {
            await deleteObject(imageRef);
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        })
      );

      // 게시물 문서 삭제
      await deleteDoc(doc(db, 'board', postId));
      setSelectedPost(null);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시물 삭제에 실패했습니다.');
    }
  };

  // 게시물 수정 모드 시작
  const handleEdit = (post) => {
    setFormData({
      category: post.category,
      title: post.title,
      content: post.content,
      link: post.link || '',
      searchTags: post.tags?.join(', ') || ''
    });
    setIsEditing(true);
    setSelectedPost(post);
    setDrawerOpen(true);
  };

  // 게시물 목록 불러오기
  const loadPosts = async () => {
    const db = getFirestore(app);
    const newPosts = await fetchPosts(db, activeCategory);
    setPosts(newPosts);
  };

  // 카테고리 변경시 게시물 다시 불러오기
  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  return (
    <div className="bg-gray-50 py-8">
      <style>{swiperStyles}</style>
      <PagePadding>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">전문가 페이지</h1>
                  <p className="text-gray-500 mt-1">AI가 검색하는 전문가 스토리</p>
                </div>
                <Drawer direction="bottom" open={drawerOpen} onOpenChange={setDrawerOpen}>
                  {auth.currentUser ? (
                    <DrawerTrigger asChild>
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <RiAddLine />
                        전문가
                      </button>
                    </DrawerTrigger>
                  ) : (
                    <Link href="/login">
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <RiAddLine />
                        전문가
                      </button>
                    </Link>
                  )}
                  <DrawerContent className="h-[80%] rounded-t-xl p-4 md:p-6">
                  <div className="h-full overflow-y-auto">
                    <div className="w-full md:max-w-4xl mx-auto px-4 md:px-6 py-4">
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          const storage = getStorage(app);
                          const db = getFirestore(app);
                          
                          // 이미지 업로드 및 URL 가져오기
                          const imageUrls = await Promise.all(
                            uploadedImages.map(async (image) => {
                              const storageRef = ref(storage, `board/${Date.now()}_${image.file.name}`);
                              await uploadBytes(storageRef, image.file);
                              return getDownloadURL(storageRef);
                            })
                          );

                          // Firestore에 게시물 데이터 저장
                          // 카테고리 값 확인
                          console.log('Saving with category:', formData.category);
                          const postData = {
                            ...formData,
                            images: imageUrls,
                            tags: formData.searchTags.split(',').map(tag => tag.trim()),
                            userId: auth.currentUser?.uid,
                            userName: auth.currentUser?.displayName || '익명',
                            category: formData.category
                          };

                          if (isEditing && selectedPost) {
                            // 게시물 수정
                            const postRef = doc(db, 'board', selectedPost.id);
                            await updateDoc(postRef, {
                              ...postData,
                              updatedAt: serverTimestamp()
                            });
                            alert('게시물이 수정되었습니다.');
                          } else {
                            // 새 게시물 저장
                            const docRef = await addDoc(collection(db, 'board'), {
                              ...postData,
                              createdAt: serverTimestamp(),
                              views: 0
                            });
                            alert('게시물이 등록되었습니다.');
                          }
                          
                          // 게시물 목록 새로고침
                          await loadPosts();
                          
                          // 폼 초기화
                          setFormData({
                            category: '',
                            title: '',
                            content: '',
                            link: '',
                            searchTags: ''
                          });
                          setUploadedImages([]);
                          setIsEditing(false);
                          setDrawerOpen(false);
                          
                        } catch (error) {
                          console.error('Error:', error);
                          alert(isEditing ? '게시물 수정에 실패했습니다.' : '게시물 등록에 실패했습니다.');
                        }
                      }} className="space-y-6 w-full">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          카테고리
                        </label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                          required
                        >
                          <option value="">카테고리 선택</option>
                          <option value="construction">건설</option>
                          <option value="landscape">조경</option>
                          <option value="equipment">장비</option>
                          <option value="materials">자재</option>
                          <option value="professionals">전문인력</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          제목
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          내용
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          검색 태그 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={formData.searchTags}
                          onChange={(e) => setFormData({...formData, searchTags: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="예: 서울, 강남구, 아파트, 리모델링, 내부공사"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          지역, 공사유형 등을 태그로 입력하면 AI가 검색하는데 활용합니다
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* 네이버 블로그 입력 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            네이버 블로그 주소
                        </label>
                          <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.link}
                          onChange={(e) => setFormData({...formData, link: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="https://blog.naver.com/..."
                            />
                            <button
                              type="button"
                              onClick={async () => {
                              try {
                                // formData 상태 로깅
                                console.log('Current formData state:', formData);
                                
                                // link 값 검증
                                if (!formData.link) {
                                  alert('블로그 URL을 입력해주세요.');
                                  return;
                                }

                                // URL 정규화
                                let blogUrl = formData.link.trim();
                                console.log('Normalized URL:', blogUrl);

                                // URL 형식 검증
                                let urlObject;
                                try {
                                  urlObject = new URL(blogUrl);
                                  console.log('Parsed URL object:', urlObject);
                                } catch (urlError) {
                                  // URL이 http(s):// 로 시작하지 않는 경우 자동으로 추가
                                  if (!blogUrl.startsWith('http')) {
                                    blogUrl = 'https://' + blogUrl;
                                    try {
                                      urlObject = new URL(blogUrl);
                                      console.log('Parsed URL with added https:', urlObject);
                                    } catch (e) {
                                      alert('올바른 URL 형식이 아닙니다.');
                                      return;
                                    }
                                  } else {
                                    alert('올바른 URL 형식이 아닙니다.');
                                    return;
                                  }
                                }

                                // 네이버 블로그 URL 검증
                                if (!urlObject.hostname.includes('blog.naver.com')) {
                                  alert('네이버 블로그 URL만 지원합니다.');
                                  return;
                                }

                                // URL 패턴 검증
                                const shortUrlPattern = /^https?:\/\/blog\.naver\.com\/([^\/]+)\/(\d+)$/;
                                const isShortUrl = shortUrlPattern.test(blogUrl);
                                const isLongUrl = blogUrl.includes('PostView.naver') && 
                                                urlObject.searchParams.has('blogId') && 
                                                urlObject.searchParams.has('logNo');

                                if (!isShortUrl && !isLongUrl) {
                                  alert('올바른 네이버 블로그 글 주소를 입력해주세요.\n예시:\nblog.naver.com/사용자ID/글번호\nblog.naver.com/PostView.naver?blogId=사용자ID&logNo=글번호');
                                  return;
                                }

                                // Firebase Functions 호출 준비
                                const functions = getFunctions(app);
                                const fetchBlogInfo = httpsCallable(functions, 'fetchBlogInfo');
                                
                                // 데이터 준비
                                const payload = {
                                  blogUrl: blogUrl
                                };
                                
                                // 호출 전 최종 데이터 검증 및 로깅
                                console.log('Final payload check:', {
                                  originalUrl: formData.link,
                                  normalizedUrl: blogUrl,
                                  payload: payload,
                                  payloadStringified: JSON.stringify(payload),
                                  payloadBlogUrl: payload.blogUrl,
                                  urlType: isShortUrl ? 'short' : 'long',
                                  urlObject: {
                                    href: urlObject.href,
                                    hostname: urlObject.hostname,
                                    pathname: urlObject.pathname,
                                    search: urlObject.search
                                  }
                                });

                                // Firebase Function 호출
                                const result = await fetchBlogInfo({
                                  blogUrl: blogUrl.toString()
                                });
                                console.log('Raw response from Firebase:', result);
                                console.log('Received result:', result);
                                
                                if (!result || !result.data) {
                                  throw new Error('블로그 정보를 가져오는데 실패했습니다.');
                                }

                                const blogInfo = result.data;
                                console.log('Received blog info:', blogInfo);

                                if (!blogInfo.title && !blogInfo.content) {
                                  alert('블로그 정보를 찾을 수 없습니다.');
                                  return;
                                }

                                // 폼 데이터 업데이트
                                setFormData(prev => ({
                                  ...prev,
                                  title: blogInfo.title || prev.title,
                                  content: blogInfo.content || prev.content,
                                }));

                                // 이미지 처리
                                if (blogInfo.imageBase64List && blogInfo.imageBase64List.length > 0) {
                                  try {
                                    console.log(`${blogInfo.imageBase64List.length}개의 이미지 데이터 받음`);
                                    
                                    // 각 이미지 처리
                                    for (const [index, base64Data] of blogInfo.imageBase64List.entries()) {
                                      try {
                                        // Base64 데이터를 Blob으로 변환
                                        const byteString = atob(base64Data.split(',')[1]);
                                        const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
                                        const ab = new ArrayBuffer(byteString.length);
                                        const ia = new Uint8Array(ab);
                                        
                                        for (let i = 0; i < byteString.length; i++) {
                                          ia[i] = byteString.charCodeAt(i);
                                        }
                                        
                                        const blob = new Blob([ab], { type: mimeString });
                                        console.log(`Blob ${index + 1} 생성됨:`, blob.type, blob.size);
                                        
                                        const file = new File([blob], `blog-image-${index + 1}.jpg`, { 
                                          type: mimeString
                                        });
                                        
                                        const preview = URL.createObjectURL(blob);
                                        console.log(`미리보기 URL ${index + 1} 생성됨:`, preview);
                                        
                                        setUploadedImages(prev => {
                                          // 최대 10개까지만 추가
                                          if (prev.length >= 10) {
                                            console.log('이미지 개수가 10개를 초과하여 추가를 중단합니다.');
                                            return prev;
                                          }
                                          return [...prev, {
                                            file,
                                            preview
                                          }];
                                        });
                                        
                                        console.log(`이미지 ${index + 1}이 uploadedImages에 추가됨`);
                                      } catch (singleImageError) {
                                        console.error(`이미지 ${index + 1} 처리 중 에러:`, singleImageError);
                                      }
                                    }
                                  } catch (imageError) {
                                    console.error('이미지 처리 중 에러:', imageError);
                                    alert('일부 이미지를 처리하는데 실패했습니다.');
                                  }
                                } else {
                                  console.log('블로그 응답에 이미지 데이터가 없음');
                                }
                              } catch (error) {
                                console.error('블로그 정보 가져오기 실패:', error);
                                
                                if (error.code === 'functions/invalid-argument') {
                                  alert('올바른 네이버 블로그 URL이 아닙니다.');
                                } else if (error.code === 'functions/not-found') {
                                  alert('블로그 정보를 찾을 수 없습니다.');
                                } else if (error.code === 'functions/deadline-exceeded') {
                                  alert('블로그 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
                                } else if (error.code === 'functions/unavailable') {
                                  alert('블로그 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
                                } else if (error.code === 'functions/permission-denied') {
                                  alert('블로그 접근이 거부되었습니다. 비공개 글인지 확인해주세요.');
                                } else {
                                  alert(error.message || '블로그 정보를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
                                }
                              }
                            }}
                              className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-md hover:bg-green-700"
                              title="블로그 정보 가져오기"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            네이버 블로그 주소 입력 자동 정보 등록
                          </p>
                        </div>

                        {/* 일반 웹사이트 입력 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            웹사이트 주소
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={formData.websiteUrl || ''}
                              onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="https://example.com/..."
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  // URL 검증
                                  const websiteUrl = formData.websiteUrl?.trim();
                                  if (!websiteUrl) {
                                    alert('웹사이트 URL을 입력해주세요.');
                                    return;
                                  }

                                  try {
                                    new URL(websiteUrl);
                                  } catch (urlError) {
                                    alert('올바른 URL 형식이 아닙니다.');
                                    return;
                                  }

                                  // Firebase Function 호출
                                  const functions = getFunctions(app);
                                  const fetchBlogInfo = httpsCallable(functions, 'fetchBlogInfo');
                                  
                                  console.log('Fetching website info for URL:', websiteUrl);
                                  const result = await fetchBlogInfo({ blogUrl: websiteUrl });
                                  
                                  if (!result || !result.data) {
                                    throw new Error('웹사이트 정보를 가져오는데 실패했습니다.');
                                  }

                                  const websiteInfo = result.data;
                                  console.log('Received website info:', websiteInfo);

                                  // 폼 데이터 업데이트
                                  setFormData(prev => ({
                                    ...prev,
                                    title: websiteInfo.title || prev.title,
                                    content: websiteInfo.content || prev.content,
                                  }));

                                  // 이미지 처리
                                  if (websiteInfo.imageBase64List && websiteInfo.imageBase64List.length > 0) {
                                    try {
                                      console.log(`${websiteInfo.imageBase64List.length}개의 이미지 데이터 받음`);
                                      
                                      // 각 이미지 처리
                                      for (const [index, base64Data] of websiteInfo.imageBase64List.entries()) {
                                        try {
                                          // Base64 데이터를 Blob으로 변환
                                          const byteString = atob(base64Data.split(',')[1]);
                                          const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
                                          const ab = new ArrayBuffer(byteString.length);
                                          const ia = new Uint8Array(ab);
                                          
                                          for (let i = 0; i < byteString.length; i++) {
                                            ia[i] = byteString.charCodeAt(i);
                                          }
                                          
                                          const blob = new Blob([ab], { type: mimeString });
                                          console.log(`Blob ${index + 1} 생성됨:`, blob.type, blob.size);
                                          
                                          const file = new File([blob], `website-image-${index + 1}.jpg`, { 
                                            type: mimeString
                                          });
                                          
                                          const preview = URL.createObjectURL(blob);
                                          console.log(`미리보기 URL ${index + 1} 생성됨:`, preview);
                                          
                                          setUploadedImages(prev => {
                                            // 최대 10개까지만 추가
                                            if (prev.length >= 10) {
                                              console.log('이미지 개수가 10개를 초과하여 추가를 중단합니다.');
                                              return prev;
                                            }
                                            return [...prev, {
                                              file,
                                              preview
                                            }];
                                          });
                                          
                                          console.log(`이미지 ${index + 1}이 uploadedImages에 추가됨`);
                                        } catch (singleImageError) {
                                          console.error(`이미지 ${index + 1} 처리 중 에러:`, singleImageError);
                                        }
                                      }
                                    } catch (imageError) {
                                      console.error('이미지 처리 중 에러:', imageError);
                                      alert('일부 이미지를 처리하는데 실패했습니다.');
                                    }
                                  } else {
                                    console.log('웹사이트 응답에 이미지 데이터가 없음');
                                  }
                                } catch (error) {
                                  console.error('웹사이트 정보 가져오기 실패:', error);
                                  alert(error.message || '웹사이트 정보를 가져오는데 실패했습니다.');
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              title="웹사이트 정보 가져오기"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            웹사이트 주소 입력 자동 정보 등록
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          사진 ({uploadedImages.length}/10)
                        </label>
                        <div className="flex flex-col gap-3">
                          {/* 이미지 URL 입력 */}
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="이미지 URL 입력"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              onChange={(e) => {
                                const imageUrl = e.target.value.trim();
                                if (imageUrl) {
                                  // 입력 필드 초기화
                                  e.target.value = '';
                                  
                                  // 이미지 로드 시도 (CORS 우회를 위한 프록시 사용)
                                  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
                                  const img = new Image();
                                  img.crossOrigin = "anonymous";
                                  img.onload = async () => {
                                    try {
                                      // Canvas를 사용하여 이미지를 Base64로 변환
                                      const canvas = document.createElement('canvas');
                                      canvas.width = img.width;
                                      canvas.height = img.height;
                                      const ctx = canvas.getContext('2d');
                                      ctx.drawImage(img, 0, 0);
                                      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                                      
                                      // 파일 생성
                                      const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
                                      const preview = URL.createObjectURL(blob);
                                      
                                      // 이미지 목록에 추가
                                      setUploadedImages(prev => {
                                        if (prev.length >= 10) {
                                          alert('이미지는 최대 10개까지만 추가할 수 있습니다.');
                                          return prev;
                                        }
                                        return [...prev, { file, preview }];
                                      });
                                    } catch (error) {
                                      console.error('이미지 처리 중 에러:', error);
                                      alert('이미지를 처리하는데 실패했습니다.');
                                    }
                                  };
                                  img.onerror = () => {
                                    console.error('이미지 로드 실패:', imageUrl);
                                    alert('이미지를 불러올 수 없습니다. URL을 확인해주세요.');
                                  };
                                  img.src = proxyUrl;
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const imageUrl = prompt('이미지 URL을 입력하세요:');
                                if (imageUrl) {
                                  const img = new Image();
                                  img.crossOrigin = "anonymous";
                                  img.onload = async () => {
                                    try {
                                      const canvas = document.createElement('canvas');
                                      canvas.width = img.width;
                                      canvas.height = img.height;
                                      const ctx = canvas.getContext('2d');
                                      ctx.drawImage(img, 0, 0);
                                      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                                      
                                      const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
                                      const preview = URL.createObjectURL(blob);
                                      
                                      setUploadedImages(prev => {
                                        if (prev.length >= 10) {
                                          alert('이미지는 최대 10개까지만 추가할 수 있습니다.');
                                          return prev;
                                        }
                                        return [...prev, { file, preview }];
                                      });
                                    } catch (error) {
                                      console.error('이미지 처리 중 에러:', error);
                                      alert('이미지를 처리하는데 실패했습니다.');
                                    }
                                  };
                                  img.onerror = () => {
                                    console.error('이미지 로드 실패:', imageUrl);
                                    alert('이미지를 불러올 수 없습니다. URL을 확인해주세요.');
                                  };
                                  img.src = proxyUrl;
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white rounded-md hover:bg-gray-700"
                              title="URL로 이미지 추가"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* 파일 업로드 버튼 */}
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          사진 추가하기
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                            const files = Array.from(e.target.files);
                            if (files.length + uploadedImages.length > 10) {
                              alert('이미지는 최대 10장까지 업로드할 수 있습니다.');
                              return;
                            }
                            const newImages = files.map(file => ({
                              file,
                              preview: URL.createObjectURL(file)
                            }));
                            setUploadedImages(prev => [...prev, ...newImages]);
                          }}
                            disabled={uploadedImages.length >= 10}
                          />
                        </label>
                        </div>
                        {uploadedImages.length >= 10 && (
                          <p className="mt-2 text-sm text-red-500">최대 10장까지만 업로드할 수 있습니다.</p>
                        )}
                        
                        {/* 이미지 미리보기 */}
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image.preview}
                                  alt={`미리보기 ${index + 1}`}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    URL.revokeObjectURL(image.preview);
                                    setUploadedImages(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          등록
                        </button>
                      </div>
                      </form>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            {/* PC 카테고리 */}
            <div className="hidden md:flex gap-2 mt-2 mb-5">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${activeCategory === category.id
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* 모바일 카테고리 캐러셀 */}
            <div className="md:hidden mt-2 mb-10">
              <Swiper
                slidesPerView="auto"
                spaceBetween={8}
                className="categories-swiper"
              >
                {CATEGORIES.map((category) => (
                  <SwiperSlide key={category.id} style={{ width: 'auto' }}>
                    <button
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap block
                        ${activeCategory === category.id
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-700'}`}
                    >
                      {category.label}
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {posts.length > 0 ? (
              posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[4/3]">
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    loop={true}
                    className="h-full group"
                  >
                    {post.images.map((image, index) => (
                      <SwiperSlide key={index}>
                        <img
                          src={image}
                          alt={`${post.title} - 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-gray-400 text-xs">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  <h2 className="text-lg font-semibold mb-2 line-clamp-1">{post.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{post.createdAt}</span>
                    <span>조회 {post.views}</span>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-green-50/50 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">
                  {activeCategory === 'all' && '등록된 게시물이 없습니다'}
                  {activeCategory === 'construction' && '건설 카테고리 페이지입니다'}
                  {activeCategory === 'landscape' && '조경 카테고리 페이지입니다'}
                  {activeCategory === 'equipment' && '장비 카테고리 페이지입니다'}
                  {activeCategory === 'materials' && '자재 카테고리 페이지입니다'}
                  {activeCategory === 'professionals' && '전문인력 카테고리 페이지입니다'}
                </h3>
                <p className="text-gray-500">
                  {activeCategory === 'all' 
                    ? '첫 게시물을 등록해 보세요!'
                    : '로딩 중입니다'}
                </p>
              </div>
            )}
          </div>
        </div>
      </PagePadding>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={selectedPost !== null} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedPost?.title || '게시물 상세'}
          </DialogTitle>
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedPost?.title}</h2>
              <button 
                onClick={() => setSelectedPost(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4">
              <PostDetail 
                post={selectedPost}
                auth={auth}
                onAddReply={handleAddReply}
                onDeleteReply={handleDeleteReply}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
              />
            </div>
            {(!selectedPost?.userId || auth.currentUser?.uid === selectedPost?.userId) && (
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => handleEdit(selectedPost)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(selectedPost.id, selectedPost.images)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}