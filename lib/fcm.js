import { getMessaging, getToken } from "firebase/messaging";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * FCM 토큰을 발급받아 Firestore에 저장합니다.
 * @param {string} userId 현재 로그인한 사용자의 UID
 */
export async function saveFcmToken(userId) {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') return;

  try {
    const messaging = getMessaging();

    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("알림 권한이 허용되지 않았습니다.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // Firestore의 fcmTokens 컬렉션에 사용자 UID를 문서 ID로 하여 토큰 저장
      await setDoc(doc(db, "fcmTokens", userId), { token, userId });
      console.log("FCM 토큰이 Firestore에 저장되었습니다:", token);
    } else {
      console.log("FCM 토큰을 발급받을 수 없습니다. (알림 권한 확인 필요)");
    }
  } catch (err) {
    console.error("FCM 토큰 저장 중 에러 발생:", err);
  }
}