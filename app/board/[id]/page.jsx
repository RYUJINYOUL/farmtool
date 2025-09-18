"use client"

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import app from '../../../firebase';
import PagePadding from '@/components/ui/PagePadding';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function BoardDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'board', params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
          });

          // 조회수 증가
          await updateDoc(docRef, {
            views: increment(1)
          });
        } else {
          alert('게시물을 찾을 수 없습니다.');
          router.push('/board');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('게시물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩중...</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-8">
      <PagePadding>
        <div className="max-w-4xl mx-auto">
          {/* 상단 버튼 */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              목록으로
            </button>
          </div>

          {/* 게시물 내용 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 이미지 슬라이더 */}
            {post.images?.length > 0 && (
              <div className="relative aspect-[4/3]">
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  loop={true}
                  className="h-full"
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
                  {post.category}
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
                <div className="border-t pt-4">
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline break-all"
                  >
                    {post.link}
                  </a>
                </div>
              )}

              {/* 날짜 */}
              <div className="mt-6 text-sm text-gray-500 text-right">
                {post.createdAt}
              </div>
            </div>
          </div>
        </div>
      </PagePadding>
    </div>
  );
}
