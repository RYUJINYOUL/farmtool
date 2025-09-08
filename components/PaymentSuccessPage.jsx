"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // next/navigation 대신 표준 URLSearchParams를 사용하여 쿼리 파라미터를 가져옵니다.
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const paymentKey = searchParams.get('paymentKey');

    // 필수 결제 정보가 모두 있는지 확인합니다.
    if (!orderId || !amount || !paymentKey) {
      setError('⚠️ 결제 정보가 부족합니다.');
      return;
    }

    setPaymentInfo({
      orderId,
      amount: parseInt(amount, 10),
      paymentKey,
    });

    // 3초 후 홈 페이지로 이동 (리디렉션)
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000); // 3000 밀리초 = 3초

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearTimeout(timer);
    
  }, [router]); // 의존성 배열에 router 추가

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center">
        {error ? (
          <div>
            <div className="text-red-500 text-6xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.944 3.374h14.71c1.727 0 2.813-1.874 1.944-3.374L14.441 2.872a1.996 1.996 0 00-3.482 0L2.997 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">결제 실패</h1>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
        ) : paymentInfo ? (
          <div>
            <div className="text-green-500 text-6xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">결제가 완료되었습니다!</h1>
            <p className="text-gray-600 mb-4">성공적으로 결제가 처리되었습니다.</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-700">주문 번호</span>
                <span className="text-gray-900 break-all">{paymentInfo.orderId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-700">결제 금액</span>
                <span className="text-gray-900 font-bold">{paymentInfo.amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-gray-700">결제 키</span>
                <span className="text-gray-900 break-all">{paymentInfo.paymentKey}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">결제 처리 중...</h1>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
