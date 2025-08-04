// functions/src/payments.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Firestore DB 인스턴스 (필요에 따라 admin.initializeApp() 이전에 초기화)
// admin.initializeApp(); // 이미 index.js 등에서 초기화되어 있다면 생략
const db = admin.firestore();

const TOSS_SECRET_KEY = defineSecret('TOSS_SECRET_KEY');
const TOSS_SUCCESS_FRONTEND_URL = defineSecret('TOSS_SUCCESS_FRONTEND_URL');
const TOSS_FAIL_FRONTEND_URL = defineSecret('TOSS_FAIL_FRONTEND_URL');

/**
 * 결제 성공 후 토스페이먼츠로부터 콜백을 받아 결제를 최종 승인합니다.
 * @type {HttpsFunction}
 */
exports.confirmPayment = onRequest(
  {
    secrets: [TOSS_SECRET_KEY, TOSS_SUCCESS_FRONTEND_URL, TOSS_FAIL_FRONTEND_URL],
    region: 'asia-northeast3', // 한국에서 가까운 리전 선택
  },
  async (req, res) => {
    const { paymentKey, orderId, amount } = req.query; // 쿼리 파라미터로 정보 전달
    const secretKey = TOSS_SECRET_KEY.value();
    const successUrl = TOSS_SUCCESS_FRONTEND_URL.value();
    const failUrl = TOSS_FAIL_FRONTEND_URL.value();

    if (!paymentKey || !orderId || !amount) {
      console.error('Missing required query parameters for payment confirmation.');
      return res.redirect(`${failUrl}?message=결제%20정보%20누락`);
    }

    try {
      // 1. 결제 승인 요청 (서버에서만 수행되어야 함)
      const approvalRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount), // 금액은 숫자로 변환
        }),
      });

      const approvalData = await approvalRes.json();

      if (!approvalRes.ok) {
        console.error('Toss Payments API Error:', approvalData);
        // 결제 실패 정보를 프론트엔드로 리디렉션
        const errorMessage = encodeURIComponent(approvalData.message || '알 수 없는 결제 실패');
        const errorCode = approvalData.code || 'UNKNOWN_ERROR';
        return res.redirect(`${failUrl}?code=${errorCode}&message=${errorMessage}&orderId=${orderId}`);
      }

      // 2. 결제 성공 시 Firestore에 저장
      const paymentDocRef = db.collection('payments').doc(orderId);
      await paymentDocRef.set({
        paymentKey: approvalData.paymentKey,
        orderId: approvalData.orderId,
        amount: approvalData.totalAmount,
        method: approvalData.method,
        status: approvalData.status, // 'DONE'
        requestedAt: approvalData.requestedAt,
        approvedAt: approvalData.approvedAt,
        // customerName: approvalData.customerName,
        // 기타 필요한 정보 추가
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('Payment successfully confirmed and saved to Firestore:', orderId);

      // 3. 결제 성공 페이지로 리디렉션
      return res.redirect(`${successUrl}?orderId=${orderId}&amount=${amount}`);

    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = encodeURIComponent(error.message || '서버 오류로 결제 승인 실패');
      return res.redirect(`${failUrl}?message=${errorMessage}&orderId=${orderId}`);
    }
  }
);

/**
 * 결제 실패 시 토스페이먼츠로부터 콜백을 받아 처리합니다.
 * @type {HttpsFunction}
 */
exports.failPayment = onRequest(
  {
    secrets: [TOSS_FAIL_FRONTEND_URL],
    region: 'asia-northeast3',
  },
  async (req, res) => {
    const { code, message, orderId } = req.query; // 토스페이먼츠가 전달하는 실패 정보
    const failUrl = TOSS_FAIL_FRONTEND_URL.value();

    console.error('Payment failed:', { code, message, orderId });

    // 실패 정보를 Firestore에 기록할 수도 있습니다.
    // await db.collection('paymentFailures').add({ code, message, orderId, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    // 실패 페이지로 리디렉션
    return res.redirect(`${failUrl}?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
  }
);