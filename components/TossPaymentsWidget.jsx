// components/TossPaymentsWidget.jsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadPaymentWidget, ANONYMOUS } from '@tosspayments/payment-widget-sdk';

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
}) => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;
  const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;

  const paymentWidgetRef = useRef(null);
  const paymentMethodsWidgetRef = useRef(null); // 이 ref는 필요에 따라 계속 사용
  const agreementWidgetRef = useRef(null);

  const [isLoadingWidget, setIsLoadingWidget] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!clientKey) {
      console.error("Error: NEXT_PUBLIC_TOSS_CLIENT_KEY is not defined.");
      setLoadError("결제 위젯을 로드할 수 없습니다: 클라이언트 키 누락.");
      setIsLoadingWidget(false);
      return;
    }

    const initializeWidget = async () => {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, ANONYMOUS);
        paymentWidgetRef.current = paymentWidget;

        if (variant === 'default') {
          // ⭐️ paymentWidget.renderPaymentMethods()의 반환값을 바로 사용
          const methodsWidget = paymentWidget.renderPaymentMethods(
            widgetSelector,
            { value: amount },
            { variant: 'default' }
          );
          paymentMethodsWidgetRef.current = methodsWidget; // ref에도 저장

          // ⭐️ 여기에서 methodsWidget에 updateOptions 호출
          methodsWidget.updateOptions({
            amount,
            orderName,
            customerName,
          });
        }

        agreementWidgetRef.current = paymentWidget.renderAgreement(
          agreementSelector,
          { variant: isAgreementOnly ? 'agreement' : 'default' }
        );

        // ✅ paymentWidget (상위 객체)에는 updateOptions가 없을 수 있으므로 이 부분은 제거
        // paymentWidget.updateOptions({
        //   amount,
        //   orderName,
        //   customerName,
        // });

        setIsLoadingWidget(false);
        console.log("Toss Payments Widget loaded and rendered successfully.");

      } catch (error) {
        console.error("Error loading Toss Payments widget:", error);
        setLoadError(`결제 위젯 로딩 중 오류 발생: ${error.message}`);
        setIsLoadingWidget(false);
      }
    };

    initializeWidget();

    return () => {
       if (paymentWidgetRef.current) {
         paymentWidgetRef.current.destroy();
       }
     };
  }, [amount, orderName, customerName, variant, isAgreementOnly, widgetSelector, agreementSelector, clientKey]);

  const requestPayment = useCallback(async () => {
    if (isLoadingWidget) {
      console.warn("Payment widget is still loading. Please wait.");
      return;
    }
    if (loadError) {
      console.error("Cannot request payment due to a widget loading error.");
      alert(`결제 위젯 오류: ${loadError}`);
      return;
    }
    if (!paymentWidgetRef.current) {
      console.error("Payment widget reference is null after loading check.");
      return;
    }
    if (!confirmUrl || !failUrl) {
      console.error("Firebase Functions URLs are not defined in .env.local.");
      alert("결제 처리 URL이 설정되지 않았습니다. 개발자에게 문의하세요.");
      return;
    }

    try {
      const paymentResult = await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: confirmUrl,
        failUrl: failUrl,
        customerName,
        amount,
      });

      console.log('Payment request initiated:', paymentResult);
      if (onSuccess) {
        onSuccess(paymentResult.paymentKey, orderId, amount);
      }

    } catch (error) {
      console.error("Error during payment request:", error);
      if (onFail) {
        onFail(error.code, error.message, orderId);
      } else {
        alert(`결제 요청 실패: ${error.message} (코드: ${error.code || 'UNKNOWN'})`);
      }
    }
  }, [isLoadingWidget, loadError, orderId, orderName, customerName, amount, confirmUrl, failUrl, onSuccess, onFail]);


  return (
    <div>
      <div id="payment-widget" style={{ width: '100%', minHeight: '200px' }} />
      <div id="agreement-widget" style={{ width: '100%', minHeight: '100px', marginTop: '20px' }} />

      {isLoadingWidget && (
        <div style={{ textAlign: 'center', padding: '50px' }}>결제 위젯 로딩 중... 잠시만 기다려주세요.</div>
      )}
      {loadError && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          오류: {loadError}
        </div>
      )}

      {!isLoadingWidget && !loadError && ( // 이 조건부 렌더링은 여전히 유효
        <button
          onClick={requestPayment}
          disabled={isLoadingWidget || !!loadError}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (isLoadingWidget || !!loadError) ? 'not-allowed' : 'pointer',
            opacity: (isLoadingWidget || !!loadError) ? 0.6 : 1,
          }}
        >
          {variant === 'default' ? '결제하기' : '약관 동의 및 결제하기'}
        </button>
      )}
    </div>
  );
};

export default TossPaymentsWidget;