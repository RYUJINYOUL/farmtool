'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { db } from '@/firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  onSnapshot
} from 'firebase/firestore'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { IoClose } from "react-icons/io5"

const HeaderDrawer = ({ children, username, uid }) => {
  const pathname = usePathname();
  const isEditable = pathname.startsWith('/editor');
  const { currentUser } = useSelector((state) => state.user)
  const finalUid = uid ?? currentUser?.uid;
  const userRole = currentUser?.uid;
  const canDelete = isEditable ? finalUid : userRole === uid;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef()
  const COMMENTS_LIMIT = 10
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 실시간 최초 데이터
  useEffect(() => {
    if (!finalUid) return;
    const q = query(
      collection(db, 'users', finalUid, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(COMMENTS_LIMIT)
    )

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setEntries(data)
        setLastVisible(snap.docs[snap.docs.length - 1])
        setHasMore(snap.docs.length === COMMENTS_LIMIT)
      } else {
        setEntries([])
        setHasMore(false)
      }
      setIsLoading(false)
    })

    return () => unsub()
  }, [finalUid])

  // 무한 스크롤
  const loadMore = useCallback(async () => {
    if (!finalUid || !lastVisible || !hasMore) return
    const next = query(
      collection(db, 'users', finalUid, 'comments'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(COMMENTS_LIMIT)
    )
    const snap = await getDocs(next)
    if (!snap.empty) {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setEntries((prev) => [...prev, ...data])
      setLastVisible(snap.docs[snap.docs.length - 1])
      setHasMore(snap.docs.length === COMMENTS_LIMIT)
    } else {
      setHasMore(false)
    }
  }, [finalUid, lastVisible, hasMore])

  const lastEntryRef = useCallback((node) => {
    if (isLoading || !hasMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    })
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore, loadMore])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !message) return

    try {
      await addDoc(collection(db, 'users', finalUid, 'comments'), {
        name,
        message,
        createdAt: new Date(),
        uid: currentUser?.uid || null,
        profileImage: currentUser?.photoURL || null,
      })
      setName('')
      setMessage('')
    } catch (error) {
      console.error('방명록 작성 실패:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteDoc(doc(db, 'users', finalUid, 'comments', id))
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }


  const handleFormToggleOrSubmit = async (e) => {
  e.preventDefault();
  if (!isFormOpen) {
    setIsFormOpen(true); // 처음 클릭: 폼 열기
    return;
  }

  // 폼 제출 처리
  if (!name || !message) return;

  try {
    await addDoc(collection(db, 'users', finalUid, 'comments'), {
      name,
      message,
      createdAt: new Date(),
      uid: currentUser?.uid || null,
      profileImage: currentUser?.photoURL || null,
    });
    setName('');
    setMessage('');
    setIsFormOpen(false); // 제출 후 폼 닫기
  } catch (error) {
    console.error('방명록 작성 실패:', error);
  }
};

  return (
    <Drawer direction="bottom">
  <DrawerTrigger>{children}</DrawerTrigger>
  <DrawerContent className="w-full h-[80vh] flex flex-col">
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          ref={idx === entries.length - 1 ? lastEntryRef : null}
          className="bg-gray-100 rounded-xl p-4 border border-zinc-700"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-black">{entry.name}</span>
            <span className="text-sm text-black">
              {entry.createdAt?.toDate
                ? entry.createdAt.toDate().toLocaleString('ko-KR')
                : new Date(entry.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          <p className="text-black">{entry.message}</p>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-black mt-2"
              onClick={() => handleDelete(entry.id)}
            >
              삭제
            </Button>
          )}
        </div>
      ))}
      {!hasMore && entries.length > 0 && (
        <p className="text-center text-zinc-400">더 이상 항목이 없습니다.</p>
      )}
    </div>

    {/* 작성 폼 (항상 하단 고정) */}
   <div className="rounded-2xl p-4 mt-4 shadow-lg border border-zinc-700">
      <form className="space-y-3" onSubmit={handleFormToggleOrSubmit}>
      

        {isFormOpen && (
          <>
           <button
        type="button"
        onClick={() => setIsFormOpen(false)}
        className="top-2 right-2 text-zinc-600 hover:text-black text-lg font-bold"
        aria-label="닫기"
      >
        ✕
      </button>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              className="w-full px-4 py-2 bg-gray-100 border border-zinc-700 rounded-lg text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              rows={3}
              placeholder="메시지를 입력해주세요"
              className="w-full px-4 py-2 bg-gray-100 border border-zinc-700 rounded-lg text-black"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {isFormOpen ? '방명록 남기기' : '방명록 열기'}
        </button>
      </form>
    </div>
  </DrawerContent>
</Drawer>

  )
}




export default function GuestbookTemplate({ username, uid }) {
  const [previewEntries, setPreviewEntries] = useState([])
  const { currentUser } = useSelector((state) => state.user)
  const finalUid = uid ?? currentUser?.uid

  // 최초 데이터 로드
  useEffect(() => {
    if (!finalUid) return
    const q = query(
      collection(db, 'users', finalUid, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(3)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setPreviewEntries(data)
    })
    return () => unsub()
  }, [finalUid])

  return (
    <div className="pt-12">
    
    
      {/* 작성 폼 */}
      <div className="space-y-4">
        {previewEntries.map((entry) => (
          <div key={entry.id} className="bg-gray-100 p-4 rounded-lg border border-zinc-700">
            <div className="flex justify-between text-sm">
              <span>{entry.name}</span>
              <span>
                {entry.createdAt?.toDate
                  ? entry.createdAt.toDate().toLocaleString('ko-KR')
                  : new Date(entry.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <p className="text-black">{entry.message}</p>
          </div>
        ))}
   
      </div>

        <HeaderDrawer>
              <article className='ml-2 pr-10 text-end'>
               <div className="text-black text-sm">목록보기</div>
              </article>
        </HeaderDrawer>

    </div>
  )
}
