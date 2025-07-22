"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from 'react-redux';
// import useAuth from '@/hooks/useAuth'; // 현재 코드에서 사용되지 않으므로 필요없으면 제거하세요.
import app, { db } from "../../firebase"; // 클라이언트 SDK 초기화
import { setUser } from "@/store/userSlice";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { saveFcmToken } from "@/lib/fcm";

const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL_PROD}`;


const LoginPage = () => {
  const auth = getAuth(app);
  const {
    register,
    watch,
    setError,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const [errorFromSubmit, setErrorFromSubmit] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.user); // Redux user state
  const { push } = useRouter();
  // const login = useAuth(); // 현재 코드에서 사용되지 않음
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false); // 현재 사용되지 않음
  const [googleUsername, setGoogleUsername] = useState(""); // 현재 사용되지 않음
  const [tempGoogleUser, setTempGoogleUser] = useState(null); // 현재 사용되지 않음
  const [usernameError, setUsernameError] = useState(""); // 현재 사용되지 않음
  const dispatch = useDispatch();

  // 카카오톡 인앱 브라우저에서 Google 로그인 지원 불가 알림
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.userAgent.includes("KAKAOTALK")) {
      alert("Google 로그인이 지원되지 않는 브라우저입니다.\n오른쪽 하단의 [...] 버튼을 눌러 '기본 브라우저로 열기'를 선택해 주세요.");
    }
  }, []);

  // 이메일/비밀번호 로그인
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = result.user;

      dispatch(setUser({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email, // 이메일도 저장
      }));

      let fcmToken = null;
        try {
          fcmToken = await saveFcmToken();
        } catch (error) {
          console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
        }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await updateDoc(userRef, {
          // email: user.email,
          // createdAt: serverTimestamp(),
          // displayName: user.displayName || null, // displayName도 저장
          // photoURL: user.photoURL || null,   
          fcmToken: fcmToken,
         
          // notice: false,
          // pushTime: serverTimestamp(),
        });
      }
      setLoading(false);
      push('/');
    } catch (error) {
      setErrorFromSubmit("가입하지 않은 이메일이거나 비밀번호가 올바르지 않습니다."); // 오류 메시지 수정
      setLoading(false);
      setTimeout(() => {
        setErrorFromSubmit("");
      }, 5000);
    }
  };

  // Google 로그인
  const handleGoogleSign = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      dispatch(setUser({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email, // 이메일도 저장
      }));


      let fcmToken = null;
        try {
          fcmToken = await saveFcmToken(user.uid);
        } catch (error) {
          console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
        }


       await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
          displayName: user.displayName || null, // displayName도 저장
          photoURL: user.photoURL || null,   
          fcmToken: fcmToken,
          badge: 0,
          notice: false,
          pushTime: serverTimestamp(),
          userKey: user.uid,
          wishList: []
        });
      
      push('/');
    } catch (error) {
      console.error("Google login error", error);
      setErrorFromSubmit("Google 로그인에 실패했습니다.");
      setTimeout(() => setErrorFromSubmit(""), 5000);
    }
  };

  // ✅ 카카오 로그인 시작 함수 추가
  const handleKakaoSign = () => {
    // 카카오 인가 코드 요청 URL로 리디렉션
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md bg-white/10 rounded-2xl shadow-lg p-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-4">로그인</h1>
        <p className="text-white/80 mb-8">건설톡에 오신 것을 환영합니다!</p>

        {/* Google 로그인 버튼 */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl bg-white text-black font-semibold shadow hover:bg-gray-100 transition"
          onClick={handleGoogleSign}
        >
          <svg className="w-5 h-5" viewBox="0 0 533.5 544.3">
            <path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z" fill="#4285f4" />
            <path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853" />
            <path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04" />
            <path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335" />
          </svg>
          <span>Google로 로그인</span>
        </button>

        {/* ✅ 카카오 로그인 버튼 추가 */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl bg-[#FEE500] text-[#191919] font-semibold shadow hover:bg-[#FEE500]/80 transition"
          onClick={handleKakaoSign}
        >
          <svg className="w-5 h-5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4C9.373 4 4 9.176 4 15.5c0 3.738 2.062 7.02 5.25 8.975l-1.075 3.925L13.7 26.5c1.475.4 3 .6 4.3.6C22.627 27.1 28 21.924 28 15.5 28 9.176 22.627 4 16 4z" fill="#3C1E1E"/>
            <path d="M16 3C9.373 3 4 8.176 4 14.5c0 3.738 2.062 7.02 5.25 8.975l-1.075 3.925L13.7 25.5c1.475.4 3 .6 4.3.6C22.627 26.1 28 20.924 28 14.5 28 8.176 22.627 3 16 3z" fill="#000000"/>
            <path d="M16 2.5C9.373 2.5 4 7.676 4 14c0 3.738 2.062 7.02 5.25 8.975l-1.075 3.925L13.7 25c1.475.4 3 .6 4.3.6C22.627 25.6 28 20.424 28 14c0-6.324-5.373-11.5-12-11.5z" fill="#FEE500"/>
            <path d="M16 11c-1.375 0-2.5 1.125-2.5 2.5s1.125 2.5 2.5 2.5 2.5-1.125 2.5-2.5-1.125-2.5-2.5-2.5zM22 11c-1.375 0-2.5 1.125-2.5 2.5s1.125 2.5 2.5 2.5 2.5-1.125 2.5-2.5-1.125-2.5-2.5-2.5z" fill="#000000"/>
          </svg>
          <span>카카오로 로그인</span>
        </button>


        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <input
            className="w-full px-4 py-3 rounded-lg bg-white/80 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white"
            type="email"
            name="Email"
            placeholder="Email"
            {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
          />
          {errors.email && <p className="text-red-400 text-xs">이메일은 필수입니다.</p>}
          <input
            className="w-full px-4 py-3 rounded-lg bg-white/80 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white"
            name="password"
            type="password"
            placeholder="비밀번호"
            {...register("password", { required: true, minLength: 6 })}
          />
          {errors.password && errors.password.type === "required" && <p className="text-red-400 text-xs">비밀번호는 필수입니다.</p>}
          {errors.password && errors.password.type === "minLength" && <p className="text-red-400 text-xs">비밀번호 6자 이상입니다.</p>}
          {errorFromSubmit && <p className="text-red-400 text-xs">{errorFromSubmit}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
          >
            로그인
          </button>
        </form>
        <div className="w-full flex justify-end mt-4">
          <button
            onClick={() => push("/register")}
            className="text-blue-300 hover:underline text-sm"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;