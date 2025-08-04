// components/TossPaymentsWidget.jsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"

const TossPaymentsWidget = ({
  orderId,
  amount,
  orderName,
  customerName,
  onSuccess,
  onFail,
  variant = 'default',
  isAgreementOnly = false,
  widgetSelector = '#payment-widget',
  agreementSelector = '#agreement-widget',
  collectionName,
  subscriptionPeriodInMonths,
}) => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;
  const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;
  
  const [widgets, setWidgets] = useState(null);
  const [ready, setReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [loadError, setLoadError] = useState(null);

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
      if (!widgets) {
        return;
      }
      
      try {
        // 결제 금액이 0보다 큰 경우에만 setAmount 호출
        if (amount && amount > 0) {
          await widgets.setAmount({
            currency: 'KRW',
            value: amount,
          });
        }
        
        await widgets.renderPaymentMethods({
          selector: widgetSelector,
          variantKey: "default",
        });

        await widgets.renderAgreement({
          selector: agreementSelector,
          variantKey: "AGREEMENT",
        });

        setReady(true);
      } catch (error) {
        console.error("Error rendering payment widget:", error);
        setLoadError(`위젯 렌더링 중 오류 발생: ${error.message}`);
      }
    }
    renderPaymentWidgets();
  }, [widgets, amount, widgetSelector, agreementSelector]);

 
 
 
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
      // 최종 결제 요청 직전에 최신 amount 값으로 위젯을 업데이트
      await widgets.setAmount({
        currency: 'KRW',
        value: amount,
      });


      const finalSuccessUrl = `${confirmUrl}?collectionName=${collectionName}&subscriptionPeriodInMonths=${subscriptionPeriodInMonths}`;
      const finalFailUrl = `${failUrl}?collectionName=${collectionName}&subscriptionPeriodInMonths=${subscriptionPeriodInMonths}`;

      await widgets.requestPayment({
        orderId,
        orderName: orderName || "토스 티셔츠 외 2건",
        successUrl: finalSuccessUrl,
        failUrl: finalFailUrl,
        customerEmail: "ryussi0925@gmail.com",
        customerName: customerName || "문화류씨",
        // collectionName
      });
    } catch (error) {
      console.error("Error during payment request:", error);
      alert(`결제 요청 중 오류 발생: ${error.message} (코드: ${error.code || 'UNKNOWN'})`);
      setIsProcessingPayment(false);
    }
  }, [isProcessingPayment, widgets, ready, amount, orderId, orderName, confirmUrl, failUrl]);

  
  
  
  return (
    <div>
      <div id={widgetSelector.substring(1)} style={{ width: '100%', minHeight: '200px' }} />
      <div id={agreementSelector.substring(1)} style={{ width: '100%', minHeight: '100px', marginTop: '20px' }} />

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