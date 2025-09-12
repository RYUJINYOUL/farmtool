"use client"
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import moment from 'moment';
import PostDetailWithQuotation from '@/components/template/Quotation';
import { doc, getDoc, updateDoc } from "firebase/firestore"; // updateDoc 추가
import PlayListCarousel4 from '@/components/PlayListCarousel4';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import useUserExpirationDate from '@/hooks/useUserExpirationDate'
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay';

const Page = (props) => {
  const { id } = props.params;
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
  const userExpirationDate = useUserExpirationDate(); 
  const Datetimenow = new Date();
  const isPhoneNumberVisible = currentUser?.uid && userExpirationDate > Datetimenow;

 
  const toggleConfirmed = async () => {
    try {
      const docRef = doc(db, 'conApply', id);
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
        const docRef = doc(db, 'conApply', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          const formattedMessage = {
            id: doc.id,
            address: data.address,
            imageDownloadUrls: data.imageDownloadUrls || [],
            SubCategories: data.SubCategories,
            favorites: data.favorites || [],
            createdDate: data.createdDate,
            constructionExperience: data.conApply_constructionExperience,
            document: data.conApply_documents,
            companyName: data.conApply_name,
            phoneNumber: data.conApply_phoneNumber,
            description: data.conApply_description,
            uid: data.uid || null,
            userKey: data.userKey,
            confirmed: data.confirmed, // ✅ 현재 확정 상태
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
    <div>
      <div className="lg:my-10 p-3.5 w-full">
        <section className="flex gap-[50px] min-h-1/2 flex-col justify-center items-center">
          <div className="mt-10" />
          <div className="flex flex-col lg:w-[1100px] w-full">
            <div className="flex md:flex-row flex-col md:justify-between items-start lg:w-[1100px] w-full">
              <div className="lg:text-start font-semibold text-center text-[20px] dark:text-gray-900">
                {message.companyName}
              </div>
              <div className="flex items-center gap-2">
                <div className="lg:text-end text-center text-[14px] dark:text-gray-900">
                  {timeFromNow(message.createdDate)}
                </div>
             {currentUser?.uid === message.userKey && (
                <button
                  onClick={toggleConfirmed}
                  className={`px-3 py-1 rounded text-white font-medium ${
                    message.confirmed
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {message.confirmed ? "확정" : "대기"}
                </button>
                 )}
              </div>
            </div>

            <hr className="my-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />

            <PlayListCarousel4 playlistArray={message.imageDownloadUrls} />

            <div className={`overflow-x-auto ${message.imageDownloadUrls.length === 0 ? "" : "pt-10" }`}>
              <table className="min-w-full text-sm text-left text-gray-700 border border-gray-200 rounded-lg">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 bg-gray-50 font-medium w-32">업력</th>
                    <td className="px-4 py-2">
                      {message.constructionExperience || "-"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 bg-gray-50 font-medium">필요서류</th>
                    <td className="px-4 py-2">{message.document || "-"}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 bg-gray-50 font-medium">해당업종</th>
                    <td className="px-4 py-2">
                      {(message.SubCategories || []).join(", ") || "-"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 bg-gray-50 font-medium">공사주소</th>
                    <td className="px-4 py-2"> 
                       <span className="font-medium">
                         <PhoneNumberDisplay data={(message.address || '').split(' ').slice(2).join(' ')} dataType="address" />
                       </span>
                      </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 bg-gray-50 font-medium">연락처</th>
                    <td className="px-4 py-2">
                      
                        <span className="font-medium">
                           <PhoneNumberDisplay data={message.phoneNumber} dataType="phone" />
                        </span>
                   
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-[15px] h-full text-start leading-7 px-4 py-5 dark:text-gray-900">
              <p style={{ whiteSpace: "pre-wrap" }}>{message.description}</p>
            </div>
            <div className="mt-10" />
          </div>
        </section>

        <PostDetailWithQuotation
          id={id}
          col="conApply"
          postAuthorUid={message.userKey}
          postImageUrls={message.imageDownloadUrls}
          listBasePath={"/construction"}
        />

        <div className="h-[150px]" />
      </div>
    </div>
  );
};

export default Page;
