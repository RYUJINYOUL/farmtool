const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const TOSS_SECRET_KEY = defineSecret('TOSS_SECRET_KEY');
const TOSS_SUCCESS_FRONTEND_URL = defineSecret('TOSS_SUCCESS_FRONTEND_URL');
const TOSS_FAIL_FRONTEND_URL = defineSecret('TOSS_FAIL_FRONTEND_URL');

/**
 * 결제 성공 후 토스페이먼츠로부터 콜백을 받아 결제를 최종 승인합니다.
 */
exports.confirmPayment = onRequest(
  {
    secrets: [TOSS_SECRET_KEY, TOSS_SUCCESS_FRONTEND_URL, TOSS_FAIL_FRONTEND_URL],
    region: 'asia-northeast3',
  },
  async (req, res) => {
    await cors(req, res, async () => {
      const { paymentKey, orderId, amount, collectionName, subscriptionPeriodInMonths } = req.query;
      const secretKey = TOSS_SECRET_KEY.value();

      // orderId에서 userId 추출 (ex: `${uid}_랜덤문자`)
      let userId;
      if (orderId) {
        userId = orderId.split('_')[0];
      } else {
        console.error('❌ Order ID is missing');
        return res.status(400).json({ code: 'MISSING_ORDER_ID', message: '주문번호가 누락되었습니다.' });
      }

      if (!paymentKey || !amount || !collectionName || !subscriptionPeriodInMonths) {
        console.error('❌ Missing required query parameters');
        return res.status(400).json({ code: 'MISSING_PARAMS', message: '결제 정보 누락' });
      }

      const allowedCollections = ['conApply', 'another_collection_name'];
      if (!allowedCollections.includes(collectionName)) {
        console.error('❌ Invalid collection name:', collectionName);
        return res.status(400).json({ code: 'INVALID_COLLECTION', message: '유효하지 않은 컬렉션 이름' });
      }

      try {
        // 1. 토스 결제 승인 요청
        const approvalRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        const approvalData = await approvalRes.json();

        // Toss API 에러 처리
        if (!approvalRes.ok && approvalData.code !== 'ALREADY_PROCESSED_PAYMENT') {
          console.error('❌ Toss Payments API Error:', approvalData);
          const errorMessage = approvalData.message || '알 수 없는 결제 실패';
          const errorCode = approvalData.code || 'UNKNOWN_ERROR';
          const finalFailUrl = `${TOSS_FAIL_FRONTEND_URL.value()}?code=${errorCode}&message=${encodeURIComponent(errorMessage)}&orderId=${orderId}`;
          return res.redirect(finalFailUrl);
        }

        // 결제 승인 시간 기준으로 만료일 계산
        const approvedAt = new Date(approvalData.approvedAt || Date.now());
        const expirationDate = new Date(approvedAt);
        expirationDate.setMonth(approvedAt.getMonth() + Number(subscriptionPeriodInMonths));

        // 2. Firestore 저장
        try {
          const userDocRef = db.collection("users").doc(userId);

          await userDocRef.set({
            paymentKey: approvalData.paymentKey || paymentKey,
            amount: approvalData.totalAmount || Number(amount),
            method: approvalData.method || 'UNKNOWN',
            approvedAt: approvalData.approvedAt || new Date().toISOString(),
            expirationDate: expirationDate,
          }, { merge: true });

          console.log('✅ Firestore save success for user:', userId);
        } catch (dbError) {
          console.error('❌ Firestore save failed:', dbError);
          const finalFailUrl = `${TOSS_FAIL_FRONTEND_URL.value()}?code=FIRESTORE_ERROR&message=${encodeURIComponent(dbError.message)}&orderId=${orderId}`;
          return res.redirect(finalFailUrl);
        }

        // 3. Firestore 저장까지 끝난 후 리다이렉트
        const successUrl = TOSS_SUCCESS_FRONTEND_URL.value();
        const finalSuccessUrl = `${successUrl}?orderId=${orderId}&amount=${amount}&paymentKey=${paymentKey}`;
        return res.redirect(finalSuccessUrl);

      } catch (error) {
        console.error('❌ Error confirming payment:', error);
        const errorMessage = error.message || '서버 오류로 결제 승인 실패';
        const finalFailUrl = `${TOSS_FAIL_FRONTEND_URL.value()}?code=SERVER_ERROR&message=${encodeURIComponent(errorMessage)}&orderId=${orderId}`;
        return res.redirect(finalFailUrl);
      }
    });
  }
);

/**
 * 결제 실패 시 토스페이먼츠로부터 콜백을 받아 처리합니다.
 */
exports.failPayment = onRequest(
  {
    secrets: [TOSS_FAIL_FRONTEND_URL],
    region: 'asia-northeast3',
  },
  async (req, res) => {
    const { code, message, orderId, from } = req.query;
    const failUrl = TOSS_FAIL_FRONTEND_URL.value();

    console.error('❌ Payment failed:', { code, message, orderId });

    if (from === 'app') {
      return res.redirect(`https://www.cstalk.kr/payment-fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
    } else {
      return res.redirect(`${failUrl}?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
    }
  }
);
