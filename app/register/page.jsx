"use client";
import React, { useState,useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import app, { db } from "../../firebase";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";
import { saveFcmToken } from "@/lib/fcm";


const RegisterPage = () => {
    const auth = getAuth(app);
    const { push } = useRouter();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [errorFromSubmit, setErrorFromSubmit] = useState("");
    const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
    const [tempGoogleUser, setTempGoogleUser] = useState(null);
    const [googleUsername, setGoogleUsername] = useState("");
    const [checking, setChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState(null);
    // const login = useAuth();

    const {
        register,
        watch,
        setError,
        setValue,
        formState: { errors },
        handleSubmit,
    } = useForm();

    const username = watch("username");
    


    // 실시간 username 중복 체크
    useEffect(() => {
        if (!username) {
        setIsAvailable(null);
        return;
        }

        const delay = setTimeout(async () => {
        setChecking(true);
        const docRef = doc(db, "usernames", username);
        const docSnap = await getDoc(docRef);
        setIsAvailable(!docSnap.exists());
        setChecking(false);
        }, 500);

        return () => clearTimeout(delay);
    }, [username]);

  
    const onSubmit = async (data) => {
        try {
        const usernameDoc = doc(db, "usernames", data.name);
        const usernameSnap = await getDoc(usernameDoc);

        if (usernameSnap.exists()) {
            setError("name", { message: "이미 사용 중인 이름입니다." });
            setValue("name", ""); // 입력값 비우기
            return;
        }

        let fcmToken = null;
                try {
                  fcmToken = await saveFcmToken();
                } catch (error) {
                  console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
                }

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );
        const user = userCredential.user;

        // 사용자 Firestore 저장
        await setDoc(doc(db, "users", user.uid), {
            email: data.email,
            username: data.name,
            createdAt: serverTimestamp(),
            fcmToken: fcmToken,
            uid: user.uid,
                displayName: user.displayName || null, // displayName도 저장
                photoURL: user.photoURL || null,   
                fcmToken: fcmToken,
                badge: 0,
                notice: false,
                pushTime: serverTimestamp(),
            userKey: user.uid,
            wishList: []
        });

        dispatch(
            setUser({
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
            })
            );

        push("/"); // 가입 완료 후 이동

        } catch (error) {
        console.error("가입 실패:", error.message);
        } finally {
      setLoading(false);
    }
    };


    const handleGoogleSign = async () => {
        try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            let fcmToken = null;
                try {
                  fcmToken = await saveFcmToken();
                } catch (error) {
                  console.error("FCM 토큰을 가져오는 데 실패했습니다. 토큰 없이 진행합니다:", error);
                }
                

            dispatch(
            setUser({
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
            })
            );

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
        
            push("/");
        } else {
            // 신규 사용자 → username 입력받기
            setTempGoogleUser(user);
            setShowUsernamePrompt(true);
        }
        } catch (err) {
        console.error(err);
        setErrorFromSubmit("구글 로그인 중 오류 발생");
        }
    };


    


  

    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-full max-w-md bg-white/10 rounded-2xl shadow-lg p-10 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-white mb-4">회원가입</h1>
          <p className="text-white/80 mb-8">건설톡에 오신 것을 환영합니다!</p>
                            <button
            className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl bg-white text-black font-semibold shadow hover:bg-gray-100 transition"
                                onClick={handleGoogleSign}
                                >
            <svg className="w-5 h-5" viewBox="0 0 533.5 544.3"><path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z" fill="#4285f4"/><path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853"/><path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04"/><path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335"/></svg>
            <span>Google로 회원가입</span>
                            </button>

                          


          <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                                <input
              className="w-full px-4 py-3 rounded-lg bg-white/80 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white"
                                    type="text"
              name="name"
              placeholder="이름(닉네임)"
              {...register("name", { required: true })}
            />
            {errors.name && <p className="text-red-400 text-xs">이름은 필수입니다.</p>}
            {isAvailable === false && <p className="text-red-400 text-xs">이미 사용 중인 이름입니다.</p>}
                            <input
              className="w-full px-4 py-3 rounded-lg bg-white/80 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white"
                                type="email" 
              name="email"
              placeholder="이메일"
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
             <input
              className="w-full px-4 py-3 rounded-lg bg-white/80 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 focus:bg-white"
                                name='passwordConfirm'
                                type='password'
                                placeholder="passwordConfirm"
                                {...register("passwordConfirm", { required: '비밀번호 확인은 필수입니다.', 
                                validate: (value) => 
                                    value === watch('password') || '비밀번호가 일치하지 않습니다'
                                })}
                            
                                    />
                                    {errors.passwordConfirm && (
                                <p className="text-red-500 mt-1">{errors.passwordConfirm.message}</p>
                                )}
                         <button
                            type="submit"
                            disabled={loading}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
            >
                                회원가입
                        </button>
          </form>
          <div className="w-full flex justify-end mt-4">
                        <button
              onClick={() => push("/login")}
              className="text-blue-300 hover:underline text-sm"
            >
                                로그인
                        </button>
            </div>
        </div>
    </div>
    );
}

export default RegisterPage
