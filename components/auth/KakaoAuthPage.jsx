"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { auth, db } from '@/firebase';
import { setUser } from "@/store/userSlice";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { saveFcmToken } from "@/lib/fcm";

const KakaoAuthPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingMessage, setLoadingMessage] = useState("카카오 로그인 처리 중...");

  useEffect(() => {
    const code = searchParams.get('code');
    const customToken = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setLoadingMessage(`로그인 실패: ${errorParam}`);
      router.push(`/login?error=${errorParam}`);
      return;
    }

    if (customToken) {
      setLoadingMessage("건설톡 로그인 중...");

      signInWithCustomToken(auth, customToken)
        .then(async (userCredential) => {
          const user = userCredential.user;

          // Redux에 사용자 정보 저장
          dispatch(setUser({
            uid: user.uid,
            displayName: user.displayName ?? "",
            photoURL: user.photoURL ?? "",
            email: user.email ?? "",
          }));

          // FCM 토큰 처리
          let fcmToken = null;
          try {
            fcmToken = await saveFcmToken(user.uid);
          } catch (err) {
            console.error("⚠️ FCM 토큰 저장 실패:", err);
          }

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            try {
              await updateDoc(userRef, {
                email: user.email ?? null,
                displayName: user.displayName ?? null,
                photoURL: user.photoURL ?? null,
                fcmToken: fcmToken ?? null,
                pushTime: serverTimestamp(),
              });
              console.log("✅ 기존 사용자 문서 업데이트 완료.");
            } catch (err) {
              console.error("🔥 사용자 문서 업데이트 실패:", err);
            }
          } else {
            try {
              await setDoc(userRef, {
                email: user.email ?? null,
                displayName: user.displayName ?? null,
                photoURL: user.photoURL ?? null,
                fcmToken: fcmToken || null,
                createdAt: serverTimestamp(),
                pushTime: serverTimestamp(),
                badge: 0,
                notice: false,
                userKey: user.uid,
                wishList: [],
                permit: [],
                nara: [],
                job: [],
                expirationDate: ''
              });
              console.log("✅ 신규 사용자 문서 생성 완료.");
            } catch (err) {
              console.error("🔥 사용자 문서 생성 실패:", err);
            }
          }

          router.push('/');
        })
        .catch((error) => {
          console.error("❌ Firebase 인증 실패:", error);
          setLoadingMessage("건설톡 로그인 실패!");
          router.push('/login?error=firebase_auth_failed');
        });

    } else if (code) {
      setLoadingMessage("인증 코드 처리 중...");

      const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL_PROD;
      if (!functionsUrl) {
        setLoadingMessage("환경 설정 오류: 함수 URL 없음.");
        router.push('/login?error=config_error');
        return;
      }

      fetch(`${functionsUrl}?code=${code}`)
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Backend call failed: ${response.status} - ${text}`);
          }
          // 백엔드에서 redirect 처리된 경우 이 코드가 실행되지 않을 수 있음
        })
        .catch((error) => {
          console.error("❌ 백엔드 처리 오류:", error);
          setLoadingMessage("백엔드 처리 중 오류 발생!");
          router.push(`/login?error=backend_call_failed&details=${error.message}`);
        });

    } else {
      setLoadingMessage("잘못된 접근입니다.");
      router.push('/login?error=invalid_access');
    }
  }, [searchParams, router, dispatch]);

  return (
    <div className="p-8 text-center">
      <p className="text-gray-700">{loadingMessage}</p>
    </div>
  );
};

export default KakaoAuthPage;
