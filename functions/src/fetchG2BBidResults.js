const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('./firebaseAdmin');
const logger = require('firebase-functions/logger');
const { defineSecret } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https'); 

const G2B_API_KEY = defineSecret('G2B_API_KEY');

exports.fetchG2BOnDemand = onRequest(
   {
    secrets: [G2B_API_KEY], 
    region: 'asia-northeast3'
  },

  async (req, res) => {
    const apiKey = G2B_API_KEY.value();

  // CORS 설정 (클라이언트 웹 앱에서 호출 가능하도록)
  res.set('Access-Control-Allow-Origin', 'https://farmtool.vercel.app'); // 본인 Vercel 도메인으로 변경
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // KST를 고려하려면 dayjs 등을 사용 권장

  const params = new URLSearchParams({
    serviceKey: apiKey,
    fromBidDt: today,
    toBidDt: today,
    bizType: '01', // 공사 (클라이언트에서 선택할 수 있도록 할 수도 있음)
    numOfRows: '100',
    pageNo: '1',
    _type: 'json',
  });

  const url = `https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancList?${params.toString()}`;

  try {
    const response = await fetch(url);
    const responseBodyText = await response.text();
      logger.info(`나라장터 API 응답 상태: ${response.status}`);
      logger.info(`나라장터 API 응답 본문 (일부): ${responseBodyText.substring(0, 500)}`); // 응답 본문 앞 500자만 로깅

      let data;
      try {
        // 텍스트를 JSON으로 수동 파싱 시도
        data = JSON.parse(responseBodyText);
      } catch (parseError) {
        // JSON 파싱 실패 시, 클라이언트에게 오류 메시지와 함께 원본 응답 텍스트를 전달합니다.
        logger.error('나라장터 API 응답 JSON 파싱 실패:', parseError.message);
        logger.error('파싱 실패한 원본 응답 텍스트:', responseBodyText);
        return res.status(500).json({
          success: false,
          error: `나라장터 API 응답 형식이 올바르지 않습니다: ${parseError.message}`,
          rawResponse: responseBodyText // 클라이언트에게 원본 응답을 보내 디버깅에 도움을 줍니다.
        });
      }

    const items = data?.response?.body?.items?.item || [];

    const db = admin.firestore();
    const batch = db.batch();

    items.forEach((item) => {
      const id = item.bidNtceNo + '_' + (item.cntrctNo || 'noContract');
      const docRef = db.collection('g2b_results').doc(id);
      batch.set(docRef, {
        ...item,
        fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    logger.info(`On-demand: ${items.length}건 저장 완료`);

    // 클라이언트에 성공적으로 저장된 아이템 수를 반환
    return res.status(200).json({ success: true, count: items.length });

  } catch (err) {
    logger.error('On-demand 스케줄 함수 실패:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});



exports.scheduledFetchG2B = onSchedule(
  {
    schedule: '50 2 * * *', // 매일 KST 11:50 = UTC 2:50
    timeZone: 'Asia/Seoul',
    secrets: [G2B_API_KEY],
    region: 'asia-northeast3'
  },
  async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const apiKey = G2B_API_KEY.value();

    const params = new URLSearchParams({
      serviceKey: apiKey,
      fromBidDt: today,
      toBidDt: today,
      bizType: '01', // 공사
      numOfRows: '100',
      pageNo: '1',
      _type: 'json',
    });

    const url = `https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancList?${params.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item || [];

      const db = admin.firestore();
      const batch = db.batch();

      items.forEach((item) => {
        const id = item.bidNtceNo + '_' + (item.cntrctNo || 'noContract');
        const docRef = db.collection('g2b_results').doc(id);
        batch.set(docRef, {
          ...item,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      logger.info(`${items.length}건 저장 완료`);
    } catch (err) {
      logger.error('스케줄 함수 실패:', err);
    }
  }
);
