"use client";

import React, { useState } from 'react';
import TossPaymentsWidget from '@/components/TossPaymentsWidget';
import { useSelector } from 'react-redux';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

const subscriptionPrices = {
  1: 15000,
  3: 42000,
  6: 78000,
  12: 118000,
};

const CheckoutPage = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [subscriptionPeriodInMonths, setSubscriptionPeriodInMonths] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userUid = currentUser?.uid;
  const amount = subscriptionPrices[subscriptionPeriodInMonths];
  const orderName = `${subscriptionPeriodInMonths}개월`;

  const handlePaymentSuccess = (paymentKey, orderId, amount) => {
    console.log("Payment successful (client-side):", { paymentKey, orderId, amount });
    // TODO: 결제 성공 후 서버 측 로직 추가 (예: DB 업데이트, 사용자에게 알림 등)
  };

  const handlePaymentFail = (errorCode, errorMessage, orderId) => {
    console.error("Payment failed (client-side):", { errorCode, errorMessage, orderId });
    alert(`결제 실패: ${errorMessage} (${errorCode})`);
  };

  if (!userUid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-lg text-gray-600 animate-pulse">주문 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center">
      <div className='w-full'>
        <h1 className="text-xl font-extrabold text-gray-900 text-center mb-8">결제하기</h1>

        <div className="space-y-6">
          {/* 구독 기간 선택 */}
          <div>
            <label htmlFor="subscription-select" className="block text-sm font-semibold text-gray-700 mb-2">
              구독 기간 선택
            </label>
            <div className="relative">
              <select
                id="subscription-select"
                value={subscriptionPeriodInMonths}
                onChange={(e) => setSubscriptionPeriodInMonths(Number(e.target.value))}
                className="block w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-4 pr-10 text-base text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
              >
                <option value={1}>1개월 - 15,000원</option>
                <option value={3}>3개월 - 42,000원</option>
                <option value={6}>6개월 - 78,000원</option>
                <option value={12}>12개월 - 118,000원</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* 결제 정보 요약 */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">사용 기간</span>
              <span className="text-lg font-bold text-gray-900">{orderName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">결제 금액</span>
              <span className="text-2xl font-extrabold text-blue-600">{amount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 결제 위젯 */}
        <div className="mt-8">
          <TossPaymentsWidget
            orderId={userUid}
            amount={amount}
            orderName={orderName}
            onSuccess={handlePaymentSuccess}
            onFail={handlePaymentFail}
            variant="primary"
            collectionName="conApply"
            subscriptionPeriodInMonths={subscriptionPeriodInMonths}
          />
        </div>
        
        {/* 환불 정책 버튼 */}
        <div className="mt-6 text-center mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out focus:outline-none"
          >
            <span className="border-b border-dashed border-gray-400 pb-1">환불 정책 보기</span>
          </button>
        </div>
      </div>

      {/* 환불정책 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <Dialog as={motion.div} open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              aria-hidden="true"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 transform transition-all"
              >
                <Dialog.Title className="text-xl font-bold text-gray-900 text-center">환불 정책</Dialog.Title>
                <div className="text-sm text-gray-700">
                  <ul className="list-disc list-inside space-y-2">
                    <li>결제 후 <strong>7일 이내</strong>이며 서비스 미이용 시 전액 환불됩니다.</li>
                    <li>7일 경과 또는 일부라도 서비스 이용 시 환불이 불가합니다.</li>
                    <li>정기결제는 언제든 해지 가능하며, 해지 시 다음 결제부터 적용됩니다.</li>
                    <li>시스템 오류 또는 이중 결제의 경우 <strong>전액 환불</strong> 처리됩니다.</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  ※ 환불 문의: <a href="mailto:dalkomme@gmail.com" className="hover:underline">dalkomme@gmail.com</a>
                </p>
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition duration-150 ease-in-out"
                  >
                    닫기
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPage;