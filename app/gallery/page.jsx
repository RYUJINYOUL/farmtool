"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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

// 게시물 목록을 가져오는 함수
const fetchPosts = async (db, category) => {
  try {
    let q = collection(db, 'gallery');
    if (category && category !== 'all') {
      q = query(q, where('category', '==', category));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
      };
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'interior', label: '건설현장' },
  { id: 'exterior', label: '조경공사' },
  { id: 'remodeling', label: '장비지원' },
  { id: 'extension', label: '자재납품' },
  { id: 'renovation', label: '전문인력' },
];

// 카테고리 ID를 한글로 변환하는 함수
const getCategoryLabel = (categoryId) => {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.label : categoryId;
};

const PostDetail = ({ post }) => {
  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg overflow-hidden">
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

          <div className="mt-6 text-sm text-gray-500 flex justify-between items-center">
            <span>작성자: {post.userName || '익명'}</span>
            <span>{post.createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GalleryBoard() {
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
  const auth = getAuth(app);

  // 게시물 목록 불러오기
  const loadPosts = async () => {
    const db = getFirestore(app);
    const newPosts = await fetchPosts(db, activeCategory);
    setPosts(newPosts);
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
      await deleteDoc(doc(db, 'gallery', postId));
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
                  <h1 className="text-2xl font-bold">공사 갤러리</h1>
                  <p className="text-gray-500 mt-1">시공 사례를 공유하세요</p>
                </div>
                <Drawer direction="bottom" open={drawerOpen} onOpenChange={setDrawerOpen}>
                  {auth.currentUser ? (
                    <DrawerTrigger asChild>
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <RiAddLine />
                        공사사례
                      </button>
                    </DrawerTrigger>
                  ) : (
                    <Link href="/login">
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <RiAddLine />
                        공사사례
                      </button>
                    </Link>
                  )}
                  <DrawerContent className="h-[80%] rounded-t-xl p-6">
                    <div className="h-full overflow-y-auto">
                      <div className="max-w-4xl mx-auto px-6 py-4">
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const storage = getStorage(app);
                            const db = getFirestore(app);
                            
                            // 이미지 업로드 및 URL 가져오기
                            const imageUrls = await Promise.all(
                              uploadedImages.map(async (image) => {
                                const storageRef = ref(storage, `gallery/${Date.now()}_${image.file.name}`);
                                await uploadBytes(storageRef, image.file);
                                return getDownloadURL(storageRef);
                              })
                            );

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
                              const postRef = doc(db, 'gallery', selectedPost.id);
                              await updateDoc(postRef, {
                                ...postData,
                                updatedAt: serverTimestamp()
                              });
                              alert('게시물이 수정되었습니다.');
                            } else {
                              // 새 게시물 저장
                              const docRef = await addDoc(collection(db, 'gallery'), {
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
                            {CATEGORIES.filter(cat => cat.id !== 'all').map(category => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
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
                            placeholder="예: 서울, 아파트, 주방, 화장실, 타일"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            지역, 공사유형 등을 태그로 입력하세요
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            링크 주소
                          </label>
                          <input
                            type="url"
                            value={formData.link}
                            onChange={(e) => setFormData({...formData, link: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            사진 ({uploadedImages.length}/10)
                          </label>
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
                            onClick={() => setDrawerOpen(false)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            {isEditing ? '수정' : '등록'}
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
                    {activeCategory === 'interior' && '인테리어 카테고리 페이지입니다'}
                    {activeCategory === 'exterior' && '외장공사 카테고리 페이지입니다'}
                    {activeCategory === 'remodeling' && '리모델링 카테고리 페이지입니다'}
                    {activeCategory === 'extension' && '증축 카테고리 페이지입니다'}
                    {activeCategory === 'renovation' && '개보수 카테고리 페이지입니다'}
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
                <PostDetail post={selectedPost} />
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
