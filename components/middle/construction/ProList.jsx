"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import moment from 'moment';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosHeart } from "react-icons/io";
import {
  collection,
  where,
  orderBy,
  query,
  getDocs,
  limit,
  startAfter,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "@/firebase";
import Image from "next/image";
import CategoryUpload from '@/components/middle/construction/categoryUpload';
import { category } from '@/lib/constants';

const ITEMS_PER_PAGE = 12;

const industryMapping = {
  "기계설비ㆍ가스공사업": ["기계설비ㆍ가스공사업", "가스난방공사업"],
  "건축공사업": ["건축공사업"],
  "구조물해체ㆍ비계공사업": ["구조물해체ㆍ비계공사업", "비계ㆍ구조물해체공사업"],
  "철근ㆍ콘크리트공사업": ["철근ㆍ콘크리트공사업"],
  "조경식재ㆍ시설물공사업": ["조경식재ㆍ시설물공사업", "조경식재공사업", "조경시설물설치공사업"],
  "지반조성ㆍ포장공사업": ["지반조성ㆍ포장공사업", "포장공사업", "보링ㆍ그라우팅공사업"],
  "실내건축공사업": ["실내건축공사업"],
  "도장ㆍ습식ㆍ방수ㆍ석공사업": ["도장ㆍ습식ㆍ방수ㆍ석공사업", "도장공사업", "습식ㆍ방수공사업", "석공사업"],
  "상ㆍ하수도설비공사업": ["상ㆍ하수도설비공사업"],
  "금속ㆍ창호ㆍ지붕ㆍ건축물조립공사업": ["금속ㆍ창호ㆍ지붕ㆍ건축물조립공사업", "금속창호ㆍ지붕건축물조립공사업지하수개발", "금속구조물ㆍ창호ㆍ온실공사업", "지붕판금ㆍ건축물조립공사업"],
  "철강구조물공사업": ["철강구조물공사업", "강구조물공사업"],
  "수중ㆍ준설공사업": ["수중ㆍ준설공사업", "수중공사업", "준설공사업"],
  "조경공사업": ["조경공사업"],
  "토목공사업": ["토목공사업", "토공사업"],
  "승강기ㆍ삭도공사업": ["승강기ㆍ삭도공사업", "승강기설치공사업", "삭도설치공사업"],
  "토목건축공사업": ["토목건축공사업"],
  "산업ㆍ환경설비공사업": ["산업ㆍ환경설비공사업", "환경전문공사업"],
  "가스ㆍ난방공사업": ["가스ㆍ난방공사업", "가스난방공사업", "가스시설시공업 제1종", "가스시설시공업 제2종", "가스시설시공업 제3종", "난방시공업 제1종", "난방시공업 제2종", "난방시공업 제3종"]
};

const ProList = ({ selectedIndustries, selectedRegions, selectedSubRegions }) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const { currentUser } = useSelector(state => state.user);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const loader = useRef(null);

  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD');

  const toggleFavorite = useCallback(async (itemId, currentFavorites) => {
    if (!currentUser?.uid) return router.push('/login');

    const userId = currentUser.uid;
    const isFavorited = currentFavorites.includes(userId);
    const top = 'construction';
    const category = "construction";

    const wishlistItem = { itemId, category, top, middle: 'registration' };

    setMessages(prev =>
      prev.map(msg =>
        msg.id === itemId
          ? {
              ...msg,
              favorites: isFavorited
                ? msg.favorites.filter(uid => uid !== userId)
                : [...msg.favorites, userId]
            }
          : msg
      )
    );

    try {
      const constructionRef = doc(db, 'construction', itemId);
      const userRef = doc(db, "users", userId);

      if (isFavorited) {
        await updateDoc(constructionRef, { favorites: arrayRemove(userId) });
        await updateDoc(userRef, { wishList: arrayRemove(wishlistItem) });
      } else {
        await updateDoc(constructionRef, { favorites: arrayUnion(userId) });
        await updateDoc(userRef, { wishList: arrayUnion(wishlistItem) });
      }
    } catch (error) {
      console.error("찜 오류: ", error);
      alert("찜 처리 중 오류 발생");
    }
  }, [currentUser, router]);

  const fetchMessages = useCallback(async (isInitial) => {
    if (loading || (!isInitial && !hasMore)) return;

    setLoading(true);
    let q = collection(db, "construction");
    let conditions = [];

    if (selectedIndustries && selectedIndustries !== "전체") {
      const mapped = industryMapping[selectedIndustries] || [selectedIndustries];
      conditions.push(where("SubCategories", "array-contains-any", mapped));
    }

    if (selectedRegions && selectedRegions !== "전국") {
      conditions.push(where("region", "==", selectedRegions));
    }

    if (selectedSubRegions && selectedSubRegions !== "전체") {
      conditions.push(where("subRegion", "==", selectedSubRegions));
    }

    let constructedQuery = query(q, ...conditions, orderBy("createdDate", "desc"));

    constructedQuery = isInitial
      ? query(constructedQuery, limit(ITEMS_PER_PAGE))
      : query(constructedQuery, startAfter(lastVisible), limit(ITEMS_PER_PAGE));

    try {
      const snapshot = await getDocs(constructedQuery);
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          address: data.address || data.data_address,
          businessLicense: data.construction_businessLicense,
          constructionExperience: data.construction_constructionExperience,
          companyName: data.construction_name || data.construction_companyName || '',
          contactPerson: data.construction_contactPerson,
          phoneNumber: data.construction_phoneNumber,
          imageDownloadUrls: data.imageDownloadUrls || [],
          createdDate: data.createdDate,
          SubCategories: data.SubCategories,
          favorites: data.favorites || []
        };
      });

      setMessages(prev => isInitial ? docs : [...prev, ...docs]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("데이터 로드 오류: ", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    hasMore,
    lastVisible,
    selectedIndustries,
    selectedRegions,
    selectedSubRegions
  ]);

  useEffect(() => {
    setMessages([]);
    setLastVisible(null);
    setHasMore(true);
    fetchMessages(true);
  }, [selectedIndustries, selectedRegions, selectedSubRegions]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMessages(false);
        }
      },
      { rootMargin: "20px", threshold: 1.0 }
    );

    if (loader.current) observer.observe(loader.current);
    return () => loader.current && observer.unobserve(loader.current);
  }, [fetchMessages, hasMore, loading]);

  const openCategory = () => {
    currentUser?.uid ? setIsUserProfileModalOpen(true) : router.push('/login');
  };

  const onClickCard = ({ id }) => router.push(`/construction/registration/${id}`);

  return (
    <div className='w-full h-full'>
      {messages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map(({ address, businessLicense, SubCategories, phoneNumber, constructionExperience, contactPerson, createdDate, id, companyName, favorites, imageDownloadUrls }) => {
            const isWishListed = currentUser?.uid && favorites.includes(currentUser.uid);
            return (
              <div key={id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer relative"
                onClick={() => onClickCard({ id })}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {companyName}
                  </h3>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(id, favorites);
                    }}
                    className='rounded-full'
                  >
                    {isWishListed ? <IoIosHeart color='red' size={20} /> : <IoMdHeartEmpty size={20} />}
                  </button>
                </div>
                {imageDownloadUrls.length > 0 && (
                  <div className="mb-4 overflow-hidden rounded-md md:w-[300px] md:h-[100px] h-[100px]">
                    <Image
                      src={imageDownloadUrls[0]}
                      alt={companyName || '업체 이미지'}
                      width={500}
                      height={100}
                      layout="relative"
                      objectFit="cover"
                    />
                  </div>
                )}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between"><span>사업자번호:</span><span className="font-medium">{businessLicense || '-'}</span></div>
                  <div className="flex justify-between"><span>업종:</span><span className="font-medium">{SubCategories?.join(', ') || '-'}</span></div>
                  <div className="flex justify-between"><span>대표자:</span><span className="font-medium">{contactPerson || '-'}</span></div>
                  <div className="flex justify-between"><span>전화번호:</span><span className="font-medium">{phoneNumber}</span></div>
                  <div className="flex justify-between"><span>주소:</span><span className="font-medium">{(address || '').split(' ').slice(2).join(' ')}</span></div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-600 whitespace-pre-line">
                      {(constructionExperience || '').replace(/\\n/g, '\n')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">검색 결과가 없습니다.</div>
          <div className="text-gray-500 text-sm">다른 조건으로 검색해보세요.</div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {hasMore && !loading && <div ref={loader} className="h-1 bg-transparent"></div>}
      {!hasMore && messages.length > 0 && (
        <div className="text-center text-gray-500 py-6">모든 데이터를 불러왔습니다.</div>
      )}

      <Button
        onClick={openCategory}
        className="fixed bottom-8 right-8 rounded-full w-16 h-16 text-3xl shadow-lg"
      >
        +
      </Button>
      <CategoryUpload
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
      />
    </div>
  );
};

export default ProList;
