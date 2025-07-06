'use client';

import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import app from '../../firebase';
import { clearUser } from '../../store/userSlice'; // ✅ 경로는 상황에 맞게 조정

export default function LoginOutButton() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { push } = useRouter();
  const dispatch = useDispatch();
  const auth = getAuth(app);

  const currentUser = useSelector((state) => state.user.currentUser);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        dispatch(clearUser());
        push('/', { scroll: false });
      })
      .catch((err) => {
        console.error('로그아웃 에러:', err);
      });
  };

  if (!hasMounted) return null;

  return (
    <nav className="bg-gray-100 shadow-lg border-b border-gray-100">
      <div className="md:w-[1100px] container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-black hover:text-black-500 transition-colors">
          건설톡
        </Link>
        <div className="flex gap-4 items-center">
          {currentUser?.uid && (
            <span className="text-sm text-blue-300 font-semibold">
              {currentUser.displayName || currentUser.email}
            </span>
          )}
          {currentUser?.uid ? (
            <button
              onClick={handleLogout}
              className="text-sm text-black-300 hover:text-black transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-black-300 hover:text-black transition-colors"
            >
              로그인
            </Link>
          )}
          {/* {!currentUser?.uid && (
            <Link
              href="/register"
              className="text-sm bg-blue-200 text-black px-4 py-2 rounded-full hover:bg-blue-300 transition-colors font-medium"
            >
              회원가입
            </Link>
          )} */}
        </div>
      </div>
    </nav>
  );
}
