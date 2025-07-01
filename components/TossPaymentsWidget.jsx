// components/TossPaymentsWidget.jsx
"use client";

import { useEffect, useRef } from 'react';
import { loadPaymentWidget, ANONYMOUS } from '@tosspayments/payment-sdk';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;
const failUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_FAIL_URL;

/**
 * 토스페이먼츠 결제 위젯을 렌더링하고 결제 처리를 담당하는 컴포넌트입니다.
 * @param {object} props
 * @param {string} props.orderId - 주문 ID (고유해야 함)
 * @param {number} props.amount - 결제 금액
 * @param {string} props.orderName - 주문 이름
 * @param {string} props.customerName - 고객 이름
 * @param {function} props.onSuccess - 결제 성공 시 호출될 콜백 (paymentKey, orderId, amount를 인자로 받음)
 * @param {function} props.onFail - 결제 실패 시 호출될 콜백 (errorCode, errorMessage, orderId를 인자로 받음)
 * @param {string} [props.variant='default'] - 위젯 종류 (default, agreement 등)
 * @param {boolean} [props.isAgreementOnly=false] - 약관 동의만 표시할지 여부 (정기결제용)
 * @param {string} [props.widgetSelector='#payment-widget'] - 결제 위젯이 렌더링될 DOM 요소의 셀렉터
 * @param {string} [props.agreementSelector='#agreement-widget'] - 약관 위젯이 렌더링될 DOM 요소의 셀렉터
 */
const TossPaymentsWidget = ({
  orderId,
  amount,
  orderName,
  customerName,
  onSuccess,
  onFail,
  variant = 'default',
  isAgreementOnly = false, // 정기결제용
  widgetSelector = '#payment-widget',
  agreementSelector = '#agreement-widget',
}) => {
  const paymentWidgetRef = useRef(null);
  const paymentMethodsWidgetRef = useRef(null);
  const agreementWidgetRef = useRef(null);

  useEffect(() => {
    if (!clientKey) {
      console.error("NEXT_PUBLIC_TOSS_CLIENT_KEY is not defined in .env.local");
      return;
    }

    const initializeWidget = async () => {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, ANONYMOUS); // 비회원 결제
        paymentWidgetRef.current = paymentWidget;

        if (variant === 'default') {
          // 일반 결제 위젯
          paymentMethodsWidgetRef.current = paymentWidget.renderPaymentMethods(
            widgetSelector,
            { value: amount },
            { variant: 'default' }
          );
        }

        agreementWidgetRef.current = paymentWidget.renderAgreement(
          agreementSelector,
          { variant: isAgreementOnly ? 'agreement' : 'default' } // 정기결제 시 약관만 렌더링
        );

        // 결제 데이터 업데이트 (금액, 주문명 등)
        paymentWidget.updateOptions({
          amount,
          orderName,
          customerName,
        });

      } catch (error) {
        console.error("Error loading Toss Payments widget:", error);
      }
    };

    initializeWidget();

    // 컴포넌트 언마운트 시 위젯 정리 (필요하다면)
    return () => {
      if (paymentWidgetRef.current) {
        // paymentWidgetRef.current.destroy(); // destroy 메서드가 제공된다면
      }
    };
  }, [amount, orderName, customerName, variant, isAgreementOnly, widgetSelector, agreementSelector]);

  const requestPayment = async () => {
    if (!paymentWidgetRef.current) {
      console.error("Payment widget not loaded yet.");
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
        // 가상계좌의 경우 추가 옵션
        // cashReceipt: {
        //   type: '소득공제',
        //   amount: amount,
        //   phoneNumber: '010-1234-5678',
        // },
      });

      // requestPayment는 성공/실패 URL로 리디렉션하므로, 여기서는 직접적인 성공/실패 콜백을 받지 않습니다.
      // successUrl, failUrl로 리디렉션될 때 Firebase Functions에서 처리합니다.
      console.log('Payment request initiated:', paymentResult);

    } catch (error) {
      // 결제 위젯 자체에서 발생한 오류 (예: 사용자가 결제 창을 닫음)
      console.error("Error during payment request:", error);
      if (onFail) {
        onFail(error.code, error.message, orderId);
      }
    }
  };

  return (
    <div>
      <div id="payment-widget" style={{ width: '100%' }} />
      <div id="agreement-widget" style={{ width: '100%' }} />
      <button
        onClick={requestPayment}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {variant === 'default' ? '결제하기' : '약관 동의 및 결제하기'}
      </button>
    </div>
  );
};

export default TossPaymentsWidget;