"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '../../firebase';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { signInWithCustomToken } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import app, { db } from "../../firebase"; // 클라이언트 SDK 초기화
import { setUser } from "@/store/userSlice";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
  } from "firebase/firestore";

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
        console.error('Kakao authentication error from backend:', errorParam);
        router.push(`/login?error=${errorParam}`);
        return;
    }

    if (customToken) {
      console.log(auth)
      console.log(customToken)
      setLoadingMessage("Firebase 로그인 중...");
      signInWithCustomToken(auth, customToken)
        .then( async (userCredential) => {
          const user = userCredential.user;  
          console.log('Firebase login successful!', userCredential.user);
          dispatch(setUser({
            uid: user.uid,
            displayName: user.displayName, // 커스텀 토큰 클레임에 displayName이 포함될 수 있음
            photoURL: user.photoURL,     // 커스텀 토큰 클레임에 photoURL이 포함될 수 있음
            email: user.email,           // 커스텀 토큰 클레임에 email이 포함될 수 있음
          }));
    
          // Firestore 'users' 컬렉션에 사용자가 이미 존재하는지 확인
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
    
          if (!userSnap.exists()) {
            const kakaoNickname = searchParams.get('uid'); 
            // 사용자 문서가 존재하지 않으면 생성
            await setDoc(userRef, {
              email: user.email || null, // 카카오가 항상 이메일을 제공하지 않을 수 있음
              createdAt: serverTimestamp(),
              displayName: user.displayName || user.uid,
              photoURL: user.photoURL || null,
            });
    
            // 기본 'links/page' 문서도 생성
            await setDoc(doc(db, "users", user.uid, "links", "page"), {
              components: ["이미지", "링크카드", "달력", "게스트북"],
            });
          }
          // --- Firestore에 사용자 저장/업데이트 로직 끝 ---
    
          router.push('/');
        })
        .catch((error) => {
          console.error('Firebase login failed:', error);
          setLoadingMessage("Firebase 로그인 실패!");
          router.push('/login?error=firebase_auth_failed');
        });
    } else if (code) {
      setLoadingMessage("인증 코드 처리 중...");
      const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL_PROD; // `.env.local`에서 정의된 값 사용
      
      // ⭐ Fetch 요청 전후 디버그 로그 추가 ⭐
      console.log(`[Frontend Debug] Attempting to call Firebase Function with code:`, code);
      console.log(`[Frontend Debug] Functions URL:`, functionsUrl); // URL 값 확인

      if (!functionsUrl) {
          console.error("[Frontend Error] NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL_LOCAL is not defined!");
          setLoadingMessage("환경 설정 오류: 함수 URL 없음.");
          router.push('/login?error=config_error');
          return;
      }

      fetch(`${functionsUrl}?code=${code}`)
        .then(response => {
          console.log(`[Frontend Debug] Response received from Function. Status: ${response.status}, Redirected: ${response.redirected}`);
          if (!response.ok && !response.redirected) {
             return response.text().then(text => {
                 console.error(`[Frontend Error] Backend call failed with status ${response.status}:`, text);
                 throw new Error(`Backend call failed: ${response.status} - ${text}`);
             });
          }
          console.log('[Frontend Debug] Firebase Function called successfully, expecting redirect.');
        })
        .catch(error => {
          console.error('[Frontend Error] Error calling Firebase Function:', error);
          setLoadingMessage("백엔드 처리 중 오류 발생!");
          router.push(`/login?error=backend_call_failed&details=${error.message}`);
        });
    } else {
      setLoadingMessage("잘못된 접근입니다.");
      console.error('No code or custom token found in URL.');
      router.push('/login?error=invalid_access');
    }
  }, [searchParams, router]);

  return (
    <div>
      <p>{loadingMessage}</p>
    </div>
  );
};

export default KakaoAuthPage;