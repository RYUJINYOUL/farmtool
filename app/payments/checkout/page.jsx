"use client";

import React, { useState, useEffect } from 'react';
import TossPaymentsWidget from '@/components/TossPaymentsWidget';

// 고유한 주문 ID 생성 함수 (보통 서버에서 생성해야 안전)
const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 개월 수에 따른 금액 맵핑
const subscriptionPrices = {
  1: 15000,
  3: 42000,
  6: 78000,
  12: 118000,
};

const CheckoutPage = () => {
  const [orderId, setOrderId] = useState('');
  const [subscriptionPeriodInMonths, setSubscriptionPeriodInMonths] = useState(1); // 기본값 1개월

  // 개월 수에 따라 금액과 주문명 동적으로 설정
  const amount = subscriptionPrices[subscriptionPeriodInMonths];
  const orderName = `Next.js 앱 서비스 이용료 (${subscriptionPeriodInMonths}개월)`;
  const customerName = "홍길동";

  useEffect(() => {
    setOrderId(generateOrderId());
  }, []);

  const handlePaymentSuccess = (paymentKey, orderId, amount) => {
    console.log("Payment successful (client-side):", { paymentKey, orderId, amount });
  };

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

      <label htmlFor="subscription-select">구독 기간 선택:</label>
      <select
        id="subscription-select"
        value={subscriptionPeriodInMonths}
        onChange={(e) => setSubscriptionPeriodInMonths(Number(e.target.value))}
        style={{ display: 'block', margin: '10px 0', padding: '8px' }}
      >
        <option value={1}>1개월 - 15,000원</option>
        <option value={3}>3개월 - 42,000원</option>
        <option value={6}>6개월 - 78,000원</option>
        <option value={12}>12개월 - 118,000원</option>
      </select>

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
        collectionName="conApply"
        subscriptionPeriodInMonths={subscriptionPeriodInMonths}
      />
    </div>
  );
};

export default CheckoutPage;
