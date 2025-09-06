// app/payments/success/SuccessClientComponent.jsx
"use client"; // 이 컴포넌트는 클라이언트에서만 렌더링됩니다.

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SuccessClientComponent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const collectionName = searchParams.get('collectionName');
  const subscriptionPeriodInMonths = searchParams.get('subscriptionPeriodInMonths');

  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 백엔드(Firebase Functions)에서 결제 정보를 다시 조회할 필요가 있다면 여기서 fetch 호출
    // 현재는 쿼리 파라미터만 사용하므로 바로 처리
    if (orderId && amount) {
      setPaymentDetails({ orderId, amount });
      setIsLoading(false);
    } else if (code) {
      setError({ code, message: searchParams.get('message') || '결제 실패' });
      setIsLoading(false);
    } else {
      setError({ code: 'INVALID_ACCESS', message: '잘못된 접근입니다.' });
      setIsLoading(false);
    }

    // 또는 필요한 경우 서버에서 결제 정보 조회 (예: /api/payments/verify?orderId=...)
    // const fetchPaymentVerification = async () => {
    //   try {
    //     const res = await fetch(`/api/payments/verify?orderId=${orderId}`);
    //     if (!res.ok) throw new Error('Payment verification failed');
    //     const data = await res.json();
    //     setPaymentDetails(data);
    //   } catch (err) {
    //     setError(err.message);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // if (orderId) {
    //   fetchPaymentVerification();
    // }
  }, [orderId, amount, code, searchParams]);


  if (isLoading) {
    return <div>결제 정보를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>결제 처리 중 오류 발생</h2>
        <p>코드: {error.code}</p>
        <p>메시지: {error.message}</p>
        <p>주문 ID: {orderId || '정보 없음'}</p>
        <button onClick={() => window.location.href = '/'}>메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>결제가 성공적으로 완료되었습니다!</h2>
      {paymentDetails && (
        <>
          <p>주문 번호: <strong>{paymentDetails.orderId}</strong></p>
          <p>결제 금액: <strong>{Number(paymentDetails.amount).toLocaleString()}원</strong></p>
        </>
      )}
      <p style={{ marginTop: '20px' }}>성공 페이지로 리디렉션되었습니다.</p>
      <button onClick={() => window.location.href = '/'}>메인으로 가기</button>
    </div>
  );
}