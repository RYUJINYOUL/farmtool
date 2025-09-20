const admin = require('./firebaseAdmin');
const payments = require('./payments');
const kakao = require('./kakao'); // 새롭게 추가
const fetchG2BBidResults = require('./fetchG2BBidResults');
const blog = require('./blog');

// 각 함수들을 export
exports.confirmPayment = payments.confirmPayment;
exports.failPayment = payments.failPayment;
exports.kakaoCallback = kakao.kakaoCallback; // 카카오 함수 export
exports.scheduledFetchG2B = fetchG2BBidResults.scheduledFetchG2B;
exports.fetchG2BOnDemand = fetchG2BBidResults.fetchG2BOnDemand;
exports.fetchBlogInfo = blog.fetchBlogInfo;