// components/TossPaymentsWidget.jsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react'; // useCallback 추가
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
  // ⭐️ 환경 변수들을 컴포넌트 함수 내부로 이동합니다.
  // 이렇게 하면 Next.js의 환경 변수 로딩 메커니즘과 더 잘 통합됩니다.
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;
  const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;

  const paymentWidgetRef = useRef(null);
  const paymentMethodsWidgetRef = useRef(null);
  const agreementWidgetRef = useRef(null);

  const [isLoadingWidget, setIsLoadingWidget] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // 1. 위젯 초기화 및 렌더링
  useEffect(() => {
    // 환경 변수 검사는 여기에서 다시 한번 수행해도 좋습니다.
    // 하지만 컴포넌트 상단에서 이미 선언되었으므로 여기서 `null`이 아님을 가정합니다.
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
          paymentMethodsWidgetRef.current = paymentWidget.renderPaymentMethods(
            widgetSelector,
            { value: amount },
            { variant: 'default' }
          );
        }

        agreementWidgetRef.current = paymentWidget.renderAgreement(
          agreementSelector,
          { variant: isAgreementOnly ? 'agreement' : 'default' }
        );

        paymentWidget.updateOptions({
          amount,
          orderName,
          customerName,
        });

        setIsLoadingWidget(false);
        console.log("Toss Payments Widget loaded and rendered successfully.");

      } catch (error) {
        console.error("Error loading Toss Payments widget:", error);
        setLoadError(`결제 위젯 로딩 중 오류 발생: ${error.message}`);
        setIsLoadingWidget(false);
      }
    };

    initializeWidget();

    // 컴포넌트 언마운트 시 위젯 정리 로직 (선택 사항)
    return () => {
       if (paymentWidgetRef.current) {
         paymentWidgetRef.current.destroy(); // 위젯 리소스 해제
       }
     };
  // 의존성 배열에 clientKey도 포함하여, clientKey가 혹시라도 늦게 로드되거나 변경될 경우에 대비
  }, [amount, orderName, customerName, variant, isAgreementOnly, widgetSelector, agreementSelector, clientKey]);

  // 2. 결제 요청 함수 (useCallback으로 최적화)
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
    // ⭐️ Firebase Functions URL 검사도 이곳에서 다시 한번 수행하여 확실히 합니다.
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
        // onSuccess 콜백은 paymentKey, orderId, amount를 인자로 받도록 설계됨
        onSuccess(paymentResult.paymentKey, orderId, amount);
      }

    } catch (error) {
      console.error("Error during payment request:", error);
      if (onFail) {
        // onFail 콜백은 errorCode, errorMessage, orderId를 인자로 받도록 설계됨
        onFail(error.code, error.message, orderId);
      } else {
        alert(`결제 요청 실패: ${error.message} (코드: ${error.code || 'UNKNOWN'})`);
      }
    }
  }, [isLoadingWidget, loadError, orderId, orderName, customerName, amount, confirmUrl, failUrl, onSuccess, onFail]);


  return (
    <div>
      {/* 위젯 로딩 상태에 따른 UI 피드백 */}
      {isLoadingWidget && (
        <div style={{ textAlign: 'center', padding: '50px' }}>결제 위젯 로딩 중... 잠시만 기다려주세요.</div>
      )}
      {loadError && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          오류: {loadError}
        </div>
      )}

      {/* 위젯이 로드되었을 때만 위젯 컨테이너와 버튼 표시 */}
      {!isLoadingWidget && !loadError && (
        <>
          <div id="payment-widget" style={{ width: '100%', minHeight: '200px' }} />
          <div id="agreement-widget" style={{ width: '100%', minHeight: '100px', marginTop: '20px' }} />
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
        </>
      )}
    </div>
  );
};

export default TossPaymentsWidget;