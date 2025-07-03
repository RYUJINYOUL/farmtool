const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('./firebaseAdmin');
const logger = require('firebase-functions/logger');
const { G2B_API_KEY } = require('firebase-functions/params');

const apiKey = G2B_API_KEY.value();

exports.scheduledFetchG2B = onSchedule(
  {
    schedule: '50 2 * * *', // 매일 KST 11:50 = UTC 2:50
    timeZone: 'Asia/Seoul',
  },
  async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

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
