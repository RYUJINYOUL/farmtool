"use client";

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import moment from 'moment';
import PlayListCarousel4 from '@/components/ui/PlayListCarousel4.tsx';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteImageFromStorage } from '@/hooks/useUploadImage';
import useAuth from '@/hooks/useAuth';

const GrassDetailPage = () => {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();
  const timeFromNow = (timestamp) => moment(timestamp).format('YYYY.MM.DD');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const { push } = useRouter();
  // 금액 입력 표시용 상태
  const [costInput, setCostInput] = useState('');

  // Quote form state
  const [quoteState, setQuoteState] = useState({
    companyName: '',
    contactInfo: '',
    cost: '',
    details: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      setLoading(true);
      const docRef = doc(db, 'grass', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setItem({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };
    
    fetchItem();
  }, [id]);

  // 실시간 견적서 목록 구독
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'grass', id, 'quotes'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(list);
    });
    return () => unsubscribe();
  }, [id]);

  const deleteCol = async (ids) => {
    if (window.confirm("삭제 하시겠습니까??")) {
        const items = []
        // 1. 이미지 URL 가져오기
        const docRef = doc(db, "grass", ids);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.imageDownloadUrls && Array.isArray(data.imageDownloadUrls)) {
            for (const url of data.imageDownloadUrls) {
              await deleteImageFromStorage(url);
            }
          }
        }
        // 2. 댓글 등 하위 컬렉션 삭제
        const subcols = query(collection(db, "grass", ids, "quotes"))
        const querySnapshot = await getDocs(subcols)
        querySnapshot.forEach((doc) => {
              items.push(doc)
            });
    for(var i = 0; i < items.length; i++) {
      await deleteDoc(doc(db, "grass", ids, "quotes", items[i].id))
        }
        // 3. 문서 삭제
        await deleteDoc(doc(db, "grass", ids))
          alert("삭제되었습니다.");
          push('/con/grass')
        // await handleBulkDelete()
    } else {
          alert("취소합니다.");
          }
      };  

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'cost') {
      // 쉼표 자동 처리
      const onlyNum = value.replace(/[^\d]/g, '');
      setCostInput(onlyNum.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
      setQuoteState(prev => ({ ...prev, cost: onlyNum }));
    } else {
      setQuoteState(prevState => ({ ...prevState, [id]: value }));
    }
  };

  // 확정 버튼 클릭 시 confirmed true로 변경
  const handleConfirm = async () => {
    if (!window.confirm('정말 확정하시겠습니까?')) return;
    try {
      await updateDoc(doc(db, 'grass', id), { confirmed: true });
      alert('확정되었습니다.');
      // setItem을 강제로 갱신하거나, 실시간 구독이 있다면 자동 반영됨
    } catch (error) {
      alert('확정 처리 중 오류가 발생했습니다.');
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;
    if (!user?.uid) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      await addDoc(collection(db, 'grass', id, 'quotes'), {
        ...quoteState,
        cost: quoteState.cost, // 숫자만 저장
        userKey: user.uid, // 견적서 작성자 uid 저장
        submittedAt: serverTimestamp(),
      });
      alert('견적이 성공적으로 제출되었습니다.');
      setQuoteState({ companyName: '', contactInfo: '', cost: '', details: '' });
      setCostInput('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting quote: ", error);
      alert('견적 제출 중 오류가 발생했습니다.');
    }
  };

  // 견적서 삭제 함수
  const handleDeleteQuote = async (quoteId) => {
    if (!id || !quoteId) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'grass', id, 'quotes', quoteId));
      alert('견적서가 삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }
  
  if (!item) {
    notFound();
  }

  // 견적서 목록 노출 권한: grass 원글 작성자 또는 견적서 작성자
  const canViewQuotes = user && (user.uid === item.userKey || quotes.some(q => q.userKey === user.uid));

  return (
    <div className="mx-auto w-full md:w-[1100px] p-4 pt-[30px] md:pt-[30px]">
     

      <div className='lg:my-10 w-full'>
        <section className="flex gap-[50px] min-h-1/2 flex-col justify-center items-center">
          <div className='mt-10' />
          <div className='flex flex-col lg:w-[1100px] w-full'>
            <div className='flex md:flex-row flex-col md:justify-between items-start lg:w-[1100px] w-full'>
              <div className='lg:text-start font-semibold text-center text-[20px] flex items-center gap-2'>
                {item.title}
                {item.confirmed ? (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded">확정</span>
                ) : (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">대기</span>
                )}
              </div>
              <div className='lg:text-end text-center text-[14px]'>{item.name} | {timeFromNow(item.date)}</div>
            </div>
        
               <hr className="my-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50" />
                 <PlayListCarousel4
                playlistArray={item.imageDownloadUrls}
              />
            <div className='mt-5' />
            <div className='text-[15px] h-full text-start'>
              <p style={{ whiteSpace: "pre-wrap" }}>{item.detail}</p>
              </div>
            <div className='mt-5' />
          </div>
          <div className='bg-[#fafafa]' />
        <div className='flex flex-col lg:w-[1100px] w-full'>
      

         <div className='flex flex-row items-center gap-3 mb-3'>
         <button className='text-[12px] text-[#fff] bg-red-500 p-0.5 rounded-sm border border-red-500 hover:bg-red-600' onClick={handleConfirm} disabled={item.confirmed}>확정</button>
           <button className='text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200' onClick={()=> {push('/con/grass')}}>목록</button>
           <button className='text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200' onClick={()=> {deleteCol(item.id)}}>삭제</button>
         </div>
   

         <hr className="mt-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50"/>

          {/* 견적서 댓글 리스트 */}
      <div className="md:w-[1100px] w-full mt-5">
        <h2 className="text-xl font-semibold mb-4">견적서 목록</h2>
        {canViewQuotes ? (
          quotes.length === 0 ? (
            <div className="text-gray-400 text-center py-8">아직 제출된 견적서가 없습니다.</div>
          ) : (
            <ul className="space-y-4">
              {quotes.map((q) => (
                <li key={q.id} className="bg-white rounded-lg shadow p-4 border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-blue-700">{q.companyName}</span>
                    <span className="text-xs text-gray-400">{q.submittedAt?.toDate ? q.submittedAt.toDate().toLocaleString() : ''}</span>
                    {user?.uid === q.userKey && (
                      <button
                        onClick={() => handleDeleteQuote(q.id)}
                        className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">연락처: {q.contactInfo}</div>
                  <div className="text-lg font-semibold text-green-700 mb-1">금액: {q.cost && q.cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{q.details}</div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="text-gray-400 text-center py-8">견적서는 글쓴이와 견적 작성자만 볼 수 있습니다.</div>
        )}
      </div>
      </div>  
        </section>
       
      
      </div>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-8 right-8 rounded-full w-28 h-16 shadow-lg">
            견적 제출하기
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>견적서 제출</DialogTitle>
            <DialogDescription>
              아래 폼을 작성하여 견적을 제출해주세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="companyName" className="text-right">업체명</Label>
                <Input id="companyName" value={quoteState.companyName} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactInfo" className="text-right">연락처</Label>
                <Input id="contactInfo" value={quoteState.contactInfo} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">제안 금액</Label>
                <Input id="cost" type="text" value={costInput} onChange={handleInputChange} className="col-span-3" required inputMode="numeric" pattern="[0-9,]*" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="details" className="text-right">상세 내용</Label>
                <textarea id="details" value={quoteState.details} onChange={handleInputChange} className="col-span-3 border rounded p-2 min-h-[60px] resize-y" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">제출하기</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrassDetailPage; 