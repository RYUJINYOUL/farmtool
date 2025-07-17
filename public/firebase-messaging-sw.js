// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'); // Firebase SDK 버전 확인
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase 앱 초기화 (서비스 워커용)
const firebaseConfig = {
  apiKey: "AIzaSyCWCJV-KlGDHUUosbfqcy0yqJAiOy3zdBI",
  authDomain: "farmtool-75b0f.firebaseapp.com",
  projectId: "farmtool-75b0f",
  storageBucket: "farmtool-75b0f.firebasestorage.app",
  messagingSenderId: "609587756851",
  appId: "1:609587756851:web:7bdeeca60bb9e50e828846",
};

// 이미 초기화된 앱이 없다면 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// 메시지 수신 처리 (필요시 추가)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // 알림 아이콘 경로
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});