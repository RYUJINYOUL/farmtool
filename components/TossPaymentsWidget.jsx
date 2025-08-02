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
}) => {
  // 환경 변수 (NEXT_PUBLIC_ 접두사 필수)
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;
  const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Ref를 사용하여 위젯 객체 참조
  const paymentWidgetRef = useRef(null);
  const widgetRef = useRef(null);
  const paymentMethodsWidgetRef = useRef(null);
  const agreementWidgetRef = useRef(null);

  // 로딩 및 에러 상태 관리
  const [isLoadingWidget, setIsLoadingWidget] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // 환경 변수 유효성 검사
    if (!clientKey) {
      console.error("Error: NEXT_PUBLIC_TOSS_CLIENT_KEY is not defined.");
      setLoadError("결제 위젯을 로드할 수 없습니다: 클라이언트 키 누락.");
      setIsLoadingWidget(false);
      return;
    }

    const initializeWidget = async () => {
      try {
        const paymentWidget = await loadTossPayments(clientKey);
        paymentWidgetRef.current = paymentWidget;


        const widgets = paymentWidget.widgets({ customerKey: ANONYMOUS });
        widgetRef.current = widgets;

        widgets.setAmount({
          currency: 'KRW',
          value: amount,
        });

        const widgetElement = document.querySelector(widgetSelector);
        const agreementElement = document.querySelector(agreementSelector);

        if (!widgetElement || !agreementElement) {
          // 요소가 없으면 에러를 기록하고 함수를 종료
          console.error("Error: Payment widget or agreement element not found in the DOM.");
          setLoadError("결제 위젯을 렌더링할 요소를 찾을 수 없습니다.");
          setIsLoadingWidget(false);
          return;
        }

        await widgets.renderPaymentMethods({
          selector: widgetSelector,
          variantKey: "default"
        });

        //  paymentMethodsWidgetRef.current = paymentMethodWidget;
        
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
  }, [amount, clientKey, widgetSelector, agreementSelector]);

  const requestPayment = useCallback(async () => {
    // const paymentMethodsWidget = paymentMethodsWidgetRef.current;
    // const paymentWidget = paymentWidgetRef.current;
    const widgets = widgetRef.current;
    if (!widgets) {
        console.error("Payment methods widget is not initialized.");
        alert("결제 위젯이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
    }

    try {
        // const paymentMethod = await paymentMethodsWidget.getSelectedPaymentMethod();
        await widgets.requestPayment({
          orderId,
          orderName: "토스 티셔츠 외 2건",
          successUrl: confirmUrl,
          failUrl: failUrl,
          customerEmail: "ryussi0925@gmail.com",
          customerName: "유씨",
        })
        console.log("Payment request initiated.");
        // console.log("Selected payment method:", paymentMethod);
     } catch (error) {
        console.error("Error getting selected payment method:", error);
        alert(`결제 방법 선택 중 오류 발생: ${error.message}`);
    }
}, [isLoadingWidget, loadError, orderId, orderName, customerName, amount, confirmUrl, failUrl, onSuccess, onFail]);


  return (
    <div>
      {/* 위젯이 렌더링될 영역 */}
      <div id="payment-widget" style={{ width: '100%', minHeight: '200px' }} />
      <div id="agreement-widget" style={{ width: '100%', minHeight: '100px', marginTop: '20px' }} />

      {/* 로딩 및 에러 메시지 */}
      {isLoadingWidget && (
        <div style={{ textAlign: 'center', padding: '50px' }}>결제 위젯 로딩 중... 잠시만 기다려주세요.</div>
      )}
      {loadError && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          오류: {loadError}
        </div>
      )}

      {/* 결제 버튼 (위젯 로딩 성공 시에만 표시) */}
      {!isLoadingWidget && !loadError && (
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