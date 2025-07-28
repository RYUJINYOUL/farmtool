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
        .then( async (userCredential) => {
          const user = userCredential.user;  
          dispatch(setUser({
            uid: user.uid,
            displayName: user.displayName, // 커스텀 토큰 클레임에 displayName이 포함될 수 있음
            photoURL: user.photoURL,     // 커스텀 토큰 클레임에 photoURL이 포함될 수 있음
            email: user.email,           // 커스텀 토큰 클레임에 email이 포함될 수 있음
          }));
    
     

          let fcmToken = null;
            try {
              fcmToken = await saveFcmToken(userUid);
            } catch (error) {
              console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
            }
    
     
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                // 문서가 이미 존재하면 업데이트
                await updateDoc(userDocRef, {
                    email: user.email, // email, displayName, photoURL은 변경될 수 있으므로 업데이트.
                    displayName: user.displayName || null,
                    photoURL: user.photoURL || null,
                    fcmToken: fcmToken, // 토큰은 로그인 시마다 업데이트하는 것이 좋음
                    pushTime: serverTimestamp(), // 로그인 시간도 업데이트
                    // wishList, permit, nara, job 등은 사용자가 직접 조작하는 데이터이므로 여기서 덮어쓰지 않음
                    // badge, notice 등은 초기값으로 설정하거나, 앱 로직에 따라 결정
                });
                console.log("기존 사용자 문서 업데이트 완료.");
            } else {
                // 문서가 존재하지 않으면 새로 생성 (초기값 설정)
                await setDoc(userDocRef, {
                    email: user.email,
                    createdAt: serverTimestamp(), // 최초 생성 시에만 설정
                    displayName: user.displayName || null,
                    photoURL: user.photoURL || null,
                    fcmToken: fcmToken,
                    badge: 0,
                    notice: false,
                    pushTime: serverTimestamp(),
                    userKey: user.uid,
                    wishList: [],
                    permit: [],
                    nara: [],
                    job: []
                });
            }
    
          router.push('/');
        })
        .catch((error) => {
          setLoadingMessage("건설톡 로그인 실패!");
          router.push('/login?error=firebase_auth_failed');
        });
    } else if (code) {
      setLoadingMessage("인증 코드 처리 중...");
      const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL_PROD; // `.env.local`에서 정의된 값 사용
      

      if (!functionsUrl) {
          setLoadingMessage("환경 설정 오류: 함수 URL 없음.");
          router.push('/login?error=config_error');
          return;
      }

      fetch(`${functionsUrl}?code=${code}`)
        .then(response => {
          if (!response.ok && !response.redirected) {
             return response.text().then(text => {
                 throw new Error(`Backend call failed: ${response.status} - ${text}`);
             });
          }
        })
        .catch(error => {
          setLoadingMessage("백엔드 처리 중 오류 발생!");
          router.push(`/login?error=backend_call_failed&details=${error.message}`);
        });
    } else {
      setLoadingMessage("잘못된 접근입니다.");
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