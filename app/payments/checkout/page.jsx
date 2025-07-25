// app/payments/checkout/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import TossPaymentsWidget from '@/components/TossPaymentsWidget'; // 위에서 만든 컴포넌트

// 고유한 주문 ID 생성 (실제 앱에서는 서버에서 생성하는 것이 안전합니다)
const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const CheckoutPage = () => {
  const [orderId, setOrderId] = useState('');
  const amount = 15000; // 결제 금액
  const orderName = "Next.js 앱 서비스 이용료";
  const customerName = "홍길동"; // 실제 사용자 이름

  useEffect(() => {
    setOrderId(generateOrderId());
  }, []);

  const handlePaymentSuccess = (paymentKey, orderId, amount) => {
    console.log("Payment successful (client-side):", { paymentKey, orderId, amount });
    // 서버 승인 후 리디렉션되므로, 이 콜백은 직접 사용되지 않습니다.
    // Firebase Functions에서 최종 처리 후 리디렉션합니다.
  };

  const handlePaymentFail = (errorCode, errorMessage, orderId) => {
    console.error("Payment failed (client-side):", { errorCode, errorMessage, orderId });
    // 이 콜백은 결제 위젯 자체에서 오류 발생 시 호출됩니다 (예: 사용자가 결제 창 닫기)
    // Firebase Functions에서 최종 처리 후 리디렉션하므로, 사용자에게 에러 메시지를 표시하는 용도로만 사용
    alert(`결제 실패: ${errorMessage} (${errorCode})`);
  };

  if (!orderId) return <div>주문 정보 준비 중...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h1>결제하기</h1>
      <p>주문명: {orderName}</p>
      <p>금액: {amount.toLocaleString()}원</p>
      <p>주문번호: {orderId}</p>

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