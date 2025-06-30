'use client';

import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { useSelector } from 'react-redux';
import UseCaseCarousel from '@/components/UseCaseCarousel';

export default function Page() {
  const { currentUser } = useSelector((state) => state.user);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { push } = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleSaveUsername = async () => {
    if (!username) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    const usernameRef = doc(db, 'usernames', username);
    const existing = await getDoc(usernameRef);
    if (existing.exists()) {
      setError('이미 사용 중인 닉네임입니다.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username,
      });

      await setDoc(doc(db, "users", currentUser.uid, "links", "page"), {
        components: ["이미지", "링크카드", "달력", "게스트북"],
      });
      
      await setDoc(usernameRef, {
        uid: currentUser.uid,
      });

      setIsOpen(false);
      push(`/${username}`);
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
    }
  };

  const renderViewSiteButton = (type) => {
    const className = type === 'main'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-sky-500 hover:bg-sky-600';

    const label = type === 'main' ? '새로운 사이트 만들기' : '내 사이트 보기';
    const href = type === 'main' ? `/editor/${userData?.username}` : `/${userData?.username}`;

    if (userData?.username) {
      return (
        <Link
          href={href}
          className={`${className} text-black px-6 py-3.5 rounded-2xl text-[15px] transition-colors`}
        >
          {label}
        </Link>
      );
    }

    if (currentUser?.uid) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className={`${className} text-black px-6 py-3.5 rounded-2xl text-[15px] transition-colors`}
        >
          {label}
        </button>
      );
    }

    return (
      <Link
        href="/register"
        className={`${className} text-black px-6 py-3.5 rounded-2xl text-[15px] transition-colors`}
      >
        {label}
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className='pt-5'>
      <div className="flex flex-col items-center justify-center py-12 text-center mb-12">
        <h1 className="text-4xl font-bold text-black mb-4">팜툴</h1>
        <p className="text-lg text-black mb-10">나만의 특별한 한페이지를 만들어보세요</p>

        <div className="grid gap-3 w-full md:max-w-sm mx-auto mb-16">
          {renderViewSiteButton('main')}
          {renderViewSiteButton('sub')}
        </div>

        <h2 className="md:hidden text-xl font-medium text-black mb-12 leading-relaxed">
          팜툴는 대한민국 5,500만명에게
          작지만 의미 있는 한페이지를 선물합니다.
        </h2>

        <h2 className="md:block hidden text-2xl font-medium text-black mb-12 leading-relaxed">
          팜툴는 대한민국 5,500만명에게<br />
          작지만 의미 있는 한페이지를 선물합니다.
        </h2>

        <UseCaseCarousel />
      </div>

      {/* 모달 */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

        <Dialog.Panel className="bg-gray-100 p-8 rounded-2xl shadow-lg z-50 max-w-sm w-full relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
            aria-label="닫기"
          >
            &times;
          </button>

          <div className="flex items-center bg-white rounded-full shadow-md p-4 border border-gray-200 focus-within:border-blue-400 transition-all">
            <span className="text-gray-500 text-lg mr-1">modootree.com/</span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.trim());
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveUsername();
                }
              }}
              placeholder="ID"
              className="flex-grow text-red-500 text-lg outline-none bg-transparent"
            />
          </div>

          {error && <p className="text-red-500 text-sm pt-2 text-right">{error}</p>}
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
