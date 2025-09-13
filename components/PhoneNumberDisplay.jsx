// components/PhoneNumberDisplay.jsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import useUserExpirationDate from '@/hooks/useUserExpirationDate';
import { cn } from "@/lib/utils";

const PhoneNumberDisplay = ({ data, dataType, userKey }) => { // userKey prop으로 변경
  const router = useRouter();
  const { currentUser } = useSelector(state => state.user);
  const userExpirationDate = useUserExpirationDate();
  const Datetimenow = new Date();

  // 현재 사용자가 게시물 작성자인지 확인
  const isAuthor = currentUser?.uid && currentUser.uid === userKey;
  
  // 전화번호는 작성자이거나 유료 회원일 때 표시됨
  const isDataVisible = isAuthor || (currentUser?.uid && userExpirationDate && userExpirationDate > Datetimenow);

  const handleClick = (e) => {
    e.stopPropagation();

    if (!isDataVisible) {
      e.preventDefault();

      if (!currentUser?.uid) {
        alert('로그인 후 이용 가능합니다.');
        router.push('/login');
      } else {
        alert('유료 회원만 이용 가능합니다. 결제 페이지로 이동합니다.');
        router.push('/payments/checkout');
      }
    }
  };

  const getHref = () => {
    if (!isDataVisible) {
      return undefined;
    }
    if (dataType === 'phone') {
      return `tel:${data}`;
    }
    return undefined;
  };
  
  const displayText = isDataVisible ? data : '등록된 회원만 보실 수 있습니다';

  return (
    <a
      href={getHref()}
      onClick={handleClick}
      className={cn("font-medium", !isDataVisible && "cursor-pointer")}
    >
      {displayText}
    </a>
  );
};

export default PhoneNumberDisplay;