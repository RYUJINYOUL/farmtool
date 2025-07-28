// src/lib/fcm.ts (또는 .js)
import { getMessaging, getToken } from "firebase/messaging";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function saveFcmToken(userId) { // <<-- 여기 userId 인수가 있는지 확인
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const messaging = getMessaging();

    // Notification.requestPermission() 호출 전에 서비스 워커 ready 대기
    // 이 부분은 이미 LoginPage에서 처리하고 있으므로 여기서 다시 대기할 필요는 없지만,
    // 만약을 대비해 여기에도 await navigator.serviceWorker.ready; 를 추가하는 것을 고려할 수 있습니다.
    // 하지만 현재 문제의 원인은 아닐 가능성이 높습니다.

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("알림 권한이 허용되지 않았습니다.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // 선택 사항: fcmTokens 컬렉션에 토큰 저장
      // await setDoc(doc(db, "fcmTokens", userId), { token, userId });
      console.log("FCM 토큰이 발급되었습니다:", token);
      return token;
    } else {
      console.log("FCM 토큰을 발급받을 수 없습니다. (알림 권한 확인 필요)");
      return null;
    }
  } catch (err) {
    console.error("FCM 토큰 저장 중 에러 발생:", err);
    return null;
  }
}