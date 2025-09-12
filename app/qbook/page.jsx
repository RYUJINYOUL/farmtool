'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
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

export default function GuestbookTemplate() {
  const { currentUser } = useSelector((state) => state.user)

  const [siteInfo, setSiteInfo] = useState({
    name: currentUser?.displayName ?? '',
    profileImage: currentUser?.photoURL ?? '',
    description: '방문해주셔서 감사합니다!',
  })
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef()

  const COMMENTS_LIMIT = 10

  // 최초 데이터 로드
  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
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
        setLastVisible(snap.docs[snap.docs.length - 1])   //마지막을 저장
        setHasMore(snap.docs.length === COMMENTS_LIMIT)
      } else {
        setEntries([])
        setHasMore(false)
      }
      setIsLoading(false)
    })

    return () => unsub()
  }, [])

  // 스크롤에 따른 추가 로딩
  const loadMore = useCallback(async () => {
    if (!lastVisible || !hasMore) return
    const next = query(
      collection(db, 'comments'),
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
  }, [lastVisible, hasMore])

  // 무한 스크롤 옵저버
  const lastEntryRef = useCallback(
    (node) => {
      if (isLoading || !hasMore) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      })
      if (node) observer.current.observe(node)
    },
    [isLoading, hasMore, loadMore]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !message) return

    try {
      await addDoc(collection(db, 'comments'), {
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
      await deleteDoc(doc(db, 'comments', id))
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 pt-12">


      {/* 작성 폼 */}
      <div className="container mx-auto px-4 -mt-10">
        <div className="bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700 mb-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              rows={3}
              placeholder="메시지를 입력해주세요"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              방명록 남기기
            </button>
          </form>
        </div>

        {/* 방명록 리스트 */}
        <div className="space-y-4 mb-8">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              ref={idx === entries.length - 1 ? lastEntryRef : null}
              className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-white">{entry.name}</span>
                <span className="text-sm text-zinc-400">
                  {entry.createdAt?.toDate
                    ? entry.createdAt.toDate().toLocaleString('ko-KR')
                    : new Date(entry.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <p className="text-zinc-300">{entry.message}</p>
              {currentUser?.uid === entry.uid && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 mt-2"
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
      </div>
    </div>
  )
}
