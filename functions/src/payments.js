const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

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
    region: 'asia-northeast3',
  },
  async (req, res) => {
    // CORS 미들웨어 적용
    await cors(req, res, async () => { 
        // 쿼리 파라미터로 정보 전달
        const { paymentKey, orderId, amount, collectionName, subscriptionPeriodInMonths, from } = req.query; 
        const secretKey = TOSS_SECRET_KEY.value();
        
        // 결제 승인 시 Authorization 헤더는 전달되지 않으므로, 이 로직을 삭제합니다.
        // 대신, orderId를 사용하여 사용자를 식별합니다.
        let userId;
        // userId를 식별하는 로직은 실제 인증 시스템에 따라 다를 수 있습니다.
        // 여기서는 간단하게 orderId를 사용자 ID로 사용합니다.
        // 결제 시 인증된 사용자라면, orderId에 userId를 포함시켜 전달했을 것입니다.
        if (orderId) {
            userId = orderId.split('_')[0];
        } else {
            console.error('Order ID is missing, cannot identify user.');
            return res.status(400).json({ code: 'MISSING_ORDER_ID', message: '주문번호가 누락되었습니다.' });
        }

        if (!paymentKey || !amount || !collectionName || !subscriptionPeriodInMonths) {
          console.error('Missing required query parameters for payment confirmation.');
          return res.status(400).json({ code: 'MISSING_PARAMS', message: '결제 정보 누락' });
        }

        const allowedCollections = ['conApply', 'another_collection_name'];
        if (!allowedCollections.includes(collectionName)) {
          console.error('Invalid collection name provided:', collectionName);
          return res.status(400).json({ code: 'INVALID_COLLECTION', message: '유효하지 않은 컬렉션 이름' });
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
              amount: Number(amount),
            }),
          });

          const approvalData = await approvalRes.json();

          if (!approvalRes.ok) {
            console.error('Toss Payments API Error:', approvalData);
            const errorMessage = approvalData.message || '알 수 없는 결제 실패';
            const errorCode = approvalData.code || 'UNKNOWN_ERROR';
            
            // 실패 시 최종 실패 URL로 리디렉트
            const finalFailUrl = `${TOSS_FAIL_FRONTEND_URL.value()}?code=${errorCode}&message=${encodeURIComponent(errorMessage)}&orderId=${orderId}`;
            return res.redirect(finalFailUrl);
          }

          const approvedAt = new Date(approvalData.approvedAt);
          const expirationDate = new Date(approvedAt);
          expirationDate.setMonth(approvedAt.getMonth() + Number(subscriptionPeriodInMonths));

          // 2. 결제 성공 시 Firestore에 저장
          const userDocRef = db.collection("users").doc(userId);
          await userDocRef.set({
              paymentKey: approvalData.paymentKey,
              amount: approvalData.totalAmount,
              method: approvalData.method,
              approvedAt: approvalData.approvedAt,
              expirationDate: expirationDate,
            }, { merge: true });

          // 3. 결제 성공 시 최종 URL로 리다이렉트
          const successUrl = TOSS_SUCCESS_FRONTEND_URL.value();
          const finalSuccessUrl = `${successUrl}?orderId=${orderId}&amount=${amount}&paymentKey=${paymentKey}`;
          return res.redirect(finalSuccessUrl);

        } catch (error) {
          console.error('Error confirming payment:', error);
          const errorMessage = error.message || '서버 오류로 결제 승인 실패';
          const finalFailUrl = `${TOSS_FAIL_FRONTEND_URL.value()}?code=SERVER_ERROR&message=${encodeURIComponent(errorMessage)}&orderId=${orderId}`;
          return res.redirect(finalFailUrl);
        }
    });
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
    const { code, message, orderId, from } = req.query; // 토스페이먼츠가 전달하는 실패 정보
    const failUrl = TOSS_FAIL_FRONTEND_URL.value();

    console.error('Payment failed:', { code, message, orderId });

    if (from === 'app') {
      return res.redirect(`https://www.cstalk.kr/payment-fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
    } else {
      return res.redirect(`${failUrl}?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
    }
  }
);
