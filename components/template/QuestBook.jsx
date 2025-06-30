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




const HeaderDrawer = ({ children, drawerContentClassName, uid, ...props }) => {
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
  //   <Drawer direction="bottom">
  // <DrawerTrigger>{children}</DrawerTrigger>
  // <DrawerContent className="w-full h-[80vh] flex flex-col">
  <Drawer {...props}>
      <DrawerTrigger asChild>
        {/* 드로어를 여는 트리거 요소 (버튼, 아이콘 등) */}
        <button className='p-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-center transition hover:bg-gray-50 hover:border-gray-400 hover:scale-105 active:scale-95 select-none'>방명록 목록 열기 · 쓰기</button>
      </DrawerTrigger>
      <DrawerContent className={drawerContentClassName}> {/* className을 DrawerContent에 전달 */}
        {/* {children} */}
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          ref={idx === entries.length - 1 ? lastEntryRef : null}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="font-bold text-gray-800 text-lg">{entry.name}</span>
            <span className="text-sm text-gray-600 font-medium">
              {entry.createdAt?.toDate
                ? entry.createdAt.toDate().toLocaleString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace(/\./g, '.').replace(/,/g, '')
                : new Date(entry.createdAt).toLocaleString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace(/\./g, '.').replace(/,/g, '')}
            </span>
          </div>
          <p className="text-gray-700 text-base leading-relaxed">{entry.message}</p>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs mt-3 p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold text-center shadow transition hover:from-red-600 hover:to-red-700 hover:scale-105 active:scale-95 select-none"
              onClick={() => handleDelete(entry.id)}
            >
              삭제
            </Button>
          )}
        </div>
      ))}
      {!hasMore && entries.length > 0 && (
        <p className="text-center text-gray-500 font-medium py-4">더 이상 항목이 없습니다.</p>
      )}
    </div>

    {/* 작성 폼 (항상 하단 고정) */}
   <div className="rounded-2xl p-6 mt-4 shadow-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <form className="space-y-4" onSubmit={handleFormToggleOrSubmit}>
      

        {isFormOpen && (
          <>
           <button
        type="button"
        onClick={() => setIsFormOpen(false)}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-xl font-bold transition-colors"
        aria-label="닫기"
      >
        ✕
      </button>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              rows={3}
              placeholder="메시지를 입력해주세요"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </>
        )}
        <button
          type="submit"
          className="w-full p-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-center shadow-lg transition hover:bg-gray-50 hover:border-gray-400 hover:scale-105 active:scale-95 select-none"
        >
          {isFormOpen ? '방명록 남기기' : '방명록 쓰기'}
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
    <div className='p-2 pt-9 md:flex md:flex-col md:items-center md:justify-center md:w-full'>
      <div className="text-center text-[21px] font-bold md:w-[300px] w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-3 pb-3" >게스트북</div>
      <div className='h-[15px]'/>
      <div className="space-y-4 bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 w-full max-w-[1100px]">
        {previewEntries.map((entry, i) => (
          <div key={entry.id} className="">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-gray-800">{entry.name}</span>
              <span className="text-gray-600 font-medium">
                {entry.createdAt?.toDate
                  ? entry.createdAt.toDate().toLocaleString('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).replace(/\./g, '.').replace(/,/g, '')
                  : new Date(entry.createdAt).toLocaleString('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).replace(/\./g, '.').replace(/,/g, '')}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{entry.message}</p>
             {i !== 2 ? <div className='border-b border-gray-200 mt-4 pb-4' /> : null}
          </div>
        ))}
   
      </div>
       <div className="pt-3">
        <HeaderDrawer uid={finalUid} drawerContentClassName="md:w-[1100px] pt-6 p-2">
          {/* <div className='p-2'>
            <div className="bg-white p-4 rounded-lg border border-zinc-300">방명록 목록보기</div>
          </div> */}
        </HeaderDrawer>
      </div>
    </div>
  )
}
