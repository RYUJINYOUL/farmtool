// app/payments/checkout/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import TossPaymentsWidget from '@/components/TossPaymentsWidget';

// 고유한 주문 ID를 생성하는 함수
// 실제 애플리케이션에서는 서버에서 생성하는 것이 보안상 안전합니다.
const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const CheckoutPage = () => {
  const [orderId, setOrderId] = useState('');
  const amount = 200; // 결제 금액
  const orderName = "Next.js 앱 서비스 이용료";
  const customerName = "홍길동"; // 실제 사용자 이름

  // 컴포넌트가 처음 마운트될 때만 orderId 생성
  useEffect(() => {
    setOrderId(generateOrderId());
  }, []);

  // 결제 성공 시 클라이언트 측에서 호출될 콜백 함수 (서버 승인 전)
  const handlePaymentSuccess = (paymentKey, orderId, amount) => {
    console.log("Payment successful (client-side):", { paymentKey, orderId, amount });
    // 이 콜백은 결제 위젯이 팝업을 띄워 성공/실패 URL로 리디렉션하기 때문에
    // 실제로는 사용되지 않습니다.
  };

  // 결제 실패 시 클라이언트 측에서 호출될 콜백 함수
  const handlePaymentFail = (errorCode, errorMessage, orderId) => {
    console.error("Payment failed (client-side):", { errorCode, errorMessage, orderId });
    alert(`결제 실패: ${errorMessage} (${errorCode})`);
  };

  if (!orderId) {
    return <div>주문 정보 준비 중...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h1>결제하기</h1>
      <p>주문명: {orderName}</p>
      <p>금액: {amount.toLocaleString()}원</p>
      <p>주문번호: {orderId}</p>
      <p>결제창은 아래에 표시됩니다.</p>

      {/* TossPaymentsWidget 컴포넌트를 렌더링 */}
      <TossPaymentsWidget
        orderId={orderId}
        amount={amount}
        orderName={orderName}
        customerName={customerName}
        onSuccess={handlePaymentSuccess}
        onFail={handlePaymentFail}
        variant="default"
      />
    </div>
  );
};

export default CheckoutPage;