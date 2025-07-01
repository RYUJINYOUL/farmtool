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
          paymentMethodsWidgetRef.current = methodsWidget; 
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
    if (isLoadingWidget) return;
    if (loadError) return;
    if (!paymentWidgetRef.current) return;
    if (!confirmUrl || !failUrl) return;

    if (setIsPaying) setIsPaying(true);

    try {
      const paymentResult = await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: confirmUrl,
        failUrl: failUrl,
        customerName,
        amount,
      });
      if (onSuccess) onSuccess(paymentResult.paymentKey, orderId, amount);
    } catch (error) {
      if (onFail) onFail(error.code, error.message, orderId);
      else alert(`결제 요청 실패: ${error.message} (코드: ${error.code || 'UNKNOWN'})`);
    } finally {
      if (setIsPaying) setIsPaying(false);
    }
  }, [/* ... */]);

  return (
    <div>
      <div id="payment-widget" style={{ width: '100%', minHeight: '220px', marginBottom: 12 }} />
      <div id="agreement-widget" style={{ width: '100%', minHeight: '80px', marginBottom: 12 }} />
      {isLoadingWidget && (
        <div style={{ textAlign: 'center', padding: '30px' }}>결제 위젯 로딩 중...</div>
      )}
      {loadError && (
        <div style={{ textAlign: 'center', padding: '30px', color: 'red' }}>
          오류: {loadError}
        </div>
      )}
      {!isLoadingWidget && !loadError && (
        <button
          onClick={requestPayment}
          disabled={isLoadingWidget || !!loadError}
          style={{
            width: '100%',
            padding: '14px 0',
            backgroundColor: '#0070f3',
            color: 'white',
            fontSize: 18,
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            cursor: (isLoadingWidget || !!loadError) ? 'not-allowed' : 'pointer',
            opacity: (isLoadingWidget || !!loadError) ? 0.6 : 1,
            marginTop: 8
          }}
        >
          {variant === 'default' ? '결제하기' : '약관 동의 및 결제하기'}
        </button>
      )}
      {/* 결제수단 미선택 시 안내 메시지는 TossPayments 위젯에서 기본 제공 */}
    </div>
  );
};

export default TossPaymentsWidget;