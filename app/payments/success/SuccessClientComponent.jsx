"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import { app } from '@/firebase'; // firebase 초기화 코드 import

export default function SuccessClientComponent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const paymentKey = searchParams.get('paymentKey');
  const collectionName = searchParams.get('collectionName');
  const subscriptionPeriodInMonths = searchParams.get('subscriptionPeriodInMonths');

  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user) throw new Error("로그인이 필요합니다.");

        const idToken = await user.getIdToken();

        const res = await fetch(
          `https://confirmpayment-qlxozmlvvq-du.a.run.app?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}&collectionName=${collectionName}&subscriptionPeriodInMonths=${subscriptionPeriodInMonths}&from=app`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "결제 승인 실패");
        }

        const data = await res.json();
        setPaymentDetails(data);
      } catch (err) {
        console.error("결제 승인 중 오류:", err);
        setError({ code: "CONFIRM_FAILED", message: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    if (paymentKey && orderId && amount && collectionName && subscriptionPeriodInMonths) {
      confirmPayment();
    } else {
      setError({ code: "MISSING_PARAMS", message: "필수 결제 정보 누락" });
      setIsLoading(false);
    }
  }, [paymentKey, orderId, amount, collectionName, subscriptionPeriodInMonths]);

  if (isLoading) return <div>결제 정보를 확인 중...</div>;

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
          <p>주문 번호: <strong>{orderId}</strong></p>
          <p>결제 금액: <strong>{Number(amount).toLocaleString()}원</strong></p>
        </>
      )}
      <p style={{ marginTop: '20px' }}>결제 내역이 저장되었습니다.</p>
      <button onClick={() => window.location.href = '/'}>메인으로 가기</button>
    </div>
  );
}
