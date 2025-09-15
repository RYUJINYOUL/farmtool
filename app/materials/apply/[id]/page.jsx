"use client"
import React, { useEffect, useState, use } from 'react';
import Image from "next/image";
import moment from 'moment';
import PostDetailWithQuotation from '@/components/middle/materials/Quotation';
import { doc, getDoc, updateDoc } from "firebase/firestore"; // updateDoc 추가
import PlayListCarousel4 from '@/components/PlayListCarousel4';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay';

const Page = (props) => {
  const params = use(props.params);
  const { id } = params;
  const [postData, setPostData] = useState(null);
  const [message, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector(state => state.user);

  const timeFromNow = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return moment(timestamp.toDate()).format('YYYY.MM.DD');
    }
    return moment(timestamp).format('YYYY.MM.DD');
  };

  // ✅ Firestore의 confirmed 값 업데이트
  const toggleConfirmed = async () => {
    try {
      const docRef = doc(db, 'matApply', id);
      await updateDoc(docRef, {
        confirmed: !message.confirmed, // 현재 값의 반대로 변경
      });
      setMessages((prev) => ({
        ...prev,
        confirmed: !prev.confirmed,
      }));
    } catch (error) {
      console.error("확정/대기 상태 업데이트 실패:", error);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadConData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'matApply', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          const formattedMessage = {
            id: doc.id,
            address: data.address || data.data_address,

            description: data.matApply_description,    //설명
            constructionExperience: data.matApply_materialType,  //필요자재
            companyName: data.matApply_name || '',
            phoneNumber: data.matApply_phoneNumber,

            imageDownloadUrls: data.imageDownloadUrls || [],
            createdDate: data.createdDate,
            SubCategories: data.SubCategories,
            favorites: data.favorites || [],

            confirmed: data.confirmed,
            uid: data.uid || null,
            userKey: data.userKey,
          };

          setMessages(formattedMessage);
        } else {
          setMessages(null);
          console.warn(`문서 ID ${id}를 찾을 수 없습니다.`);
        }
      } catch (e) {
        console.error("데이터 로딩 중 에러:", e);
        setMessages(null);
      } finally {
        setLoading(false);
      }
    };

    loadConData();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-20">데이터 로딩 중입니다...</div>;
  }

  if (!message) {
    return <div className="text-center mt-20">데이터를 찾을 수 없거나 올바르지 않은 접근입니다.</div>;
  }

  return (
    <div className="w-full pt-16 md:pt-20 pb-8 px-4 md:px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            {/* 헤더 섹션 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {message.companyName}
                </h1>
                <p className="text-gray-500 text-sm md:text-base">
                  등록일: {timeFromNow(message.createdDate)}
                </p>
              </div>
              {currentUser?.uid === message.userKey && (
                <button
                  onClick={toggleConfirmed}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                    message.confirmed
                      ? "bg-red-500 hover:bg-red-600 shadow-red-100"
                      : "bg-blue-500 hover:bg-blue-600 shadow-blue-100"
                  } shadow-md hover:shadow-lg`}
                >
                  {message.confirmed ? "확정 완료" : "대기 중"}
                </button>
              )}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />

            <PlayListCarousel4 playlistArray={message.imageDownloadUrls} />

            <div className={`space-y-8 ${message.imageDownloadUrls.length === 0 ? "" : "pt-6" }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50/50 rounded-xl p-6 space-y-1">
                  <dt className="text-sm font-medium text-gray-500">필요자재</dt>
                  <dd className="text-base text-gray-900">{message.constructionExperience || "-"}</dd>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-6 space-y-1">
                  <dt className="text-sm font-medium text-gray-500">분류</dt>
                  <dd className="text-base text-gray-900">{(message.SubCategories || []).join(", ") || "-"}</dd>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-6 space-y-1">
                  <dt className="text-sm font-medium text-gray-500">주소</dt>
                  <dd className="text-base text-gray-900">
                    <PhoneNumberDisplay
                      data={(message.address || '').split(' ').slice(2).join(' ')}
                      dataType="address"
                      userKey={message.userKey}
                    />
                  </dd>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-6 space-y-1">
                  <dt className="text-sm font-medium text-gray-500">연락처</dt>
                  <dd className="text-base text-gray-900">
                    <PhoneNumberDisplay
                      data={message.phoneNumber}
                      dataType="phone"
                      userKey={message.userKey}
                    />
                  </dd>
                </div>
              </div>

              {message.description && (
                <div className="bg-gray-50/50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 설명</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {message.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <PostDetailWithQuotation
            id={id}
            col="matApply"
            postAuthorUid={message.userKey}
            postImageUrls={message.imageDownloadUrls}
            listBasePath={"/materials"}
          />
        </div>

        <div className="h-[150px]" />
      </div>
    </div>
  );
};

export default Page;
