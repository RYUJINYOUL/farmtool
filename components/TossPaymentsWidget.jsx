// components/TossPaymentsWidget.jsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"
import { getAuth } from 'firebase/auth'; // Firebase Auth SDK import
import { app } from '../firebase'; // Your Firebase app instance

const TossPaymentsWidget = ({
  orderId,
  amount,
  orderName,
  collectionName,
  subscriptionPeriodInMonths,
}) => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  // const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL; // 사용하지 않습니다.
  const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;
  
  const [widgets, setWidgets] = useState(null);
  const [ready, setReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const auth = getAuth(app); // Firebase Auth 인스턴스 가져오기

  // 첫 번째 useEffect: 위젯 SDK 로드
  useEffect(() => {
    async function fetchPaymentWidgets() {
      if (!clientKey) {
        setLoadError("클라이언트 키가 설정되지 않았습니다.");
        return;
      }
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        setWidgets(widgets);
      } catch (error) {
        console.error("Error fetching payment widget:", error);
        setLoadError(`위젯 로딩 중 오류 발생: ${error.message}`);
      }
    }
    fetchPaymentWidgets();
  }, [clientKey]);

  // 두 번째 useEffect: 위젯 UI 렌더링 및 금액 설정
  useEffect(() => {
    async function renderPaymentWidgets() {
      if (!widgets || ready) return;
      try {
        if (amount && amount > 0) {
          await widgets.setAmount({
            currency: 'KRW',
            value: amount,
          });
        }
        await widgets.renderPaymentMethods({
          selector: "#payment-widget",
          variantKey: "default",
        });
        await widgets.renderAgreement({
          selector: "#agreement-widget",
          variantKey: "AGREEMENT",
        });
        setReady(true);
      } catch (error) {
        console.error("Error rendering payment widget:", error);
        setLoadError(`위젯 렌더링 중 오류 발생: ${error.message}`);
      }
    }
    renderPaymentWidgets();
  }, [widgets, amount]);

  const requestPayment = useCallback(async () => {
    if (isProcessingPayment) {
      console.warn("Payment request is already in progress.");
      return;
    }
    setIsProcessingPayment(true);
    if (!widgets || !ready) {
      alert("결제 위젯이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      setIsProcessingPayment(false);
      return;
    }
    if (!amount || amount <= 0) {
      alert("결제 금액이 올바르지 않습니다. 다시 시도해주세요.");
      setIsProcessingPayment(false);
      return;
    }
    try {
      await widgets.setAmount({
        currency: 'KRW',
        value: amount,
      });

      // 결제 성공 시 클라이언트 페이지로 리디렉션
      const finalSuccessUrl = `${window.location.origin}/payment/success?collectionName=${collectionName}&subscriptionPeriodInMonths=${subscriptionPeriodInMonths}`;
      const finalFailUrl = `${failUrl}`;

      await widgets.requestPayment({
        orderId: `${orderId}_${Date.now()}`,
        orderName: orderName || "상품",
        successUrl: finalSuccessUrl, // 클라이언트 페이지 URL로 변경
        failUrl: finalFailUrl,
        customerEmail: auth.currentUser?.email || "anonymous@example.com",
        customerName: auth.currentUser?.displayName || "Anonymous",
      });
    } catch (error) {
      console.error("Error during payment request:", error);
      alert(`결제 요청 중 오류 발생: ${error.message} (코드: ${error.code || 'UNKNOWN'})`);
      setIsProcessingPayment(false);
    }
  }, [isProcessingPayment, widgets, ready, amount, orderId, orderName, failUrl, collectionName, subscriptionPeriodInMonths, auth]);

  return (
    <div>
      <div id="payment-widget" style={{ width: '100%', minHeight: '200px' }} />
      <div id="agreement-widget" style={{ width: '100%', minHeight: '100px', marginTop: '20px' }} />
      {(!ready && !loadError) && (
        <div style={{ textAlign: 'center', padding: '50px' }}>결제 위젯 로딩 중... 잠시만 기다려주세요.</div>
      )}
      {loadError && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          오류: {loadError}
        </div>
      )}
      {ready && !loadError && (
        <button
          onClick={requestPayment}
          disabled={isProcessingPayment}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
            opacity: isProcessingPayment ? 0.6 : 1,
          }}
        >
          {isProcessingPayment ? '결제 진행 중...' : '결제하기'}
        </button>
      )}
    </div>
  );
};

export default TossPaymentsWidget;
