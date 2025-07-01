// components/TossPaymentsWidget.jsx
"use client";

import { useEffect, useRef, useState } from 'react'; // useState import 추가
import { loadPaymentWidget, ANONYMOUS } from '@tosspayments/payment-widget-sdk';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;
const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;

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
  const paymentWidgetRef = useRef(null);
  const paymentMethodsWidgetRef = useRef(null);
  const agreementWidgetRef = useRef(null);

  // ⭐️ 위젯 로딩 상태 추가
  const [isLoadingWidget, setIsLoadingWidget] = useState(true);
  const [loadError, setLoadError] = useState(null); // 로딩 중 발생한 에러 메시지

  useEffect(() => {
    if (!clientKey) {
      console.error("NEXT_PUBLIC_TOSS_CLIENT_KEY is not defined in .env.local");
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

        // 결제 데이터 업데이트 (금액, 주문명 등) - 위젯 로드 후에도 필요할 수 있음
        paymentWidget.updateOptions({
          amount,
          orderName,
          customerName,
        });

        setIsLoadingWidget(false); // ⭐️ 로딩 완료
        console.log("Toss Payments Widget loaded and rendered successfully.");

      } catch (error) {
        console.error("Error loading Toss Payments widget:", error);
        setLoadError(`결제 위젯 로딩 중 오류 발생: ${error.message}`); // ⭐️ 에러 메시지 설정
        setIsLoadingWidget(false); // ⭐️ 로딩 실패
      }
    };

    initializeWidget();

    return () => {
      // 위젯 정리 로직 (예: paymentWidgetRef.current.destroy() 등)
    };
  }, [amount, orderName, customerName, variant, isAgreementOnly, widgetSelector, agreementSelector, clientKey]); // clientKey도 의존성 배열에 추가

  const requestPayment = async () => {
    // ⭐️ 위젯 로딩 중이거나 에러가 있다면 요청 방지
    if (isLoadingWidget) {
      console.warn("Payment widget is still loading. Please wait.");
      return;
    }
    if (loadError) {
      console.error("Cannot request payment due to a widget loading error.");
      alert(`결제 위젯 오류: ${loadError}`); // 사용자에게 알림
      return;
    }
    if (!paymentWidgetRef.current) { // 이 검사는 이제 거의 필요 없지만, 방어적으로 유지
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

    } catch (error) {
      console.error("Error during payment request:", error);
      if (onFail) {
        onFail(error.code, error.message, orderId);
      } else {
        // 콜백이 없으면 기본 알림
        alert(`결제 요청 실패: ${error.message} (코드: ${error.code || 'UNKNOWN'})`);
      }
    }
  };

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
            // ⭐️ 위젯 로딩 중이거나 오류가 있을 때 버튼을 비활성화합니다.
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