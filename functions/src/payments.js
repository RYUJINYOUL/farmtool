// functions/src/payments.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true }); // CORS 미들웨어 추가

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
    secrets: [TOSS_SECRET_KEY],
    region: 'asia-northeast3',
  },
  async (req, res) => {
    // CORS 미들웨어 적용
    await cors(req, res, async () => { 
        // 쿼리 파라미터로 정보 전달
        const { paymentKey, orderId, amount, collectionName, subscriptionPeriodInMonths } = req.query; 
        const secretKey = TOSS_SECRET_KEY.value();
        
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            console.error('Authorization header is missing or malformed.');
            // 리디렉션 대신 JSON 응답으로 변경
            return res.status(401).json({ code: 'AUTH_ERROR', message: '인증 오류' });
        }
        const idToken = authorizationHeader.split('Bearer ')[1];

        let userId;
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            userId = decodedToken.uid;
        } catch (error) {
            console.error('Error verifying ID token:', error);
            return res.status(401).json({ code: 'INVALID_TOKEN', message: '인증 토큰이 유효하지 않습니다.' });
        }
        
        if (!paymentKey || !orderId || !amount || !collectionName || !subscriptionPeriodInMonths) {
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
            return res.status(approvalRes.status).json({ code: errorCode, message: errorMessage });
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

    
          // return res.status(200).json({ status: 'SUCCESS', orderId, amount });
          if (req.query.from === 'app') {
            return res.redirect(`https://www.cstalk.kr/payment-success?orderId=${orderId}&amount=${amount}&paymentKey=${paymentKey}`);
          } else {
            return res.status(200).json({ status: 'SUCCESS', orderId, amount });
          }

        } catch (error) {
          console.error('Error confirming payment:', error);
          const errorMessage = error.message || '서버 오류로 결제 승인 실패';
          return res.status(500).json({ code: 'SERVER_ERROR', message: errorMessage });
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
    const { code, message, orderId } = req.query; // 토스페이먼츠가 전달하는 실패 정보
    const failUrl = TOSS_FAIL_FRONTEND_URL.value();

    console.error('Payment failed:', { code, message, orderId });

if (req.query.from === 'app') {
  return res.redirect(`https://www.cstalk.kr/payment-fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
} else {
  return res.redirect(`${failUrl}?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
}

// return res.redirect(`${failUrl}?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
  }
);