"use client";

import React, { useState, useEffect } from 'react';
import TossPaymentsWidget from '@/components/TossPaymentsWidget';

const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const CheckoutPage = () => {
  const [orderId, setOrderId] = useState('');
  const amount = 15000;
  const orderName = "Next.js 앱 서비스 이용료";
  const customerName = "홍길동";
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    setOrderId(generateOrderId());
  }, []);

  const handlePaymentSuccess = (paymentKey, orderId, amount) => {
    setIsPaying(false);
    // 성공 후 리디렉션은 서버에서 처리
  };

  const handlePaymentFail = (errorCode, errorMessage, orderId) => {
    setIsPaying(false);
    alert(`결제 실패: ${errorMessage} (${errorCode})`);
  };

  if (!orderId) return <div>주문 정보 준비 중...</div>;

  return (
    <div style={{
      maxWidth: 480,
      margin: '60px auto',
      padding: 24,
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>결제하기</h1>
      <div style={{
        background: '#f9fafb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        fontSize: 16
      }}>
        <div><strong>주문명:</strong> {orderName}</div>
        <div><strong>금액:</strong> {amount.toLocaleString()}원</div>
        <div><strong>주문번호:</strong> {orderId}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <TossPaymentsWidget
          orderId={orderId}
          amount={amount}
          orderName={orderName}
          customerName={customerName}
          onSuccess={handlePaymentSuccess}
          onFail={handlePaymentFail}
          variant="default"
          setIsPaying={setIsPaying} // TossPaymentsWidget에서 결제 진행 상태를 제어할 수 있게 prop 전달
        />
      </div>
      {isPaying && (
        <div style={{
          textAlign: 'center',
          color: '#0070f3',
          fontWeight: 500,
          marginTop: 12
        }}>
          결제 진행 중입니다. 잠시만 기다려주세요...
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;