'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useSelector } from 'react-redux';
import ComponentPalette from '@/components/edit/ComponentPalette';
import EditorCanvas from '@/components/edit/EditorCanvas';
import EditorCanvas2 from '@/components/edit/EditorCanvas2';

export default function EditPage({ username }: { username: string }) {
  const { currentUser } = useSelector((state: any) => state.user);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const router = useRouter();

  // 🔹 username → uid 확인
  useEffect(() => {
    console.log(username)
    const load = async () => {
      const ref = doc(db, 'usernames', username);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const uid = snap.data()?.uid;
        if (!uid || uid !== currentUser?.uid) {
          router.push('/login');
        } else {
          setOwnerUid(uid);
        }
      } else {
        router.push('/login');
      }
    };

    if (username && currentUser?.uid) {
      load();
    }
  }, [username, currentUser, router]);

  if (!ownerUid) return null; // 로딩 중이거나 리디렉션 중

  return (
    <div className="w-full min-h-screen flex justify-center items-start bg-gray-100">
      <div className="w-full max-w-6xl md:w-4/5 bg-white rounded-2xl shadow-2xl mt-10 mb-10 p-4 flex flex-col gap-8">
        <h1 className="font-bold mb-4 text-3xl text-blue-700 text-center pt-3">에디터</h1>
        <div className="p-0.5 flex gap-10 md:bg-gray-50 bg-blend-darken rounded-xl">
          <div className="w-1/4 md:block hidden pt-6">
            <h1 className="font-bold mb-4 text-gray-800 text-lg">컴포넌트</h1>
            <ComponentPalette />
          </div>

          <div className="md:hidden w-full">
            <EditorCanvas/>
            <div className='h-[50px]'></div>
          </div>

          <div className="md:w-3/4 md:block hidden">
            <h1 className="md:block hidden font-bold mb-4 text-gray-700 text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-xl tracking-wide">드래그로 위치 변경하세요</h1>
            <div className="bg-white rounded-xl shadow p-4">
              <EditorCanvas2/>
            </div>
            <div className='h-[50px]'></div>
          </div>
        </div>
      </div>
    </div>
  );
}
