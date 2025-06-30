"use client"
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearUser, setUser } from "../store/userSlice";
import { saveFcmToken } from "@/lib/fcm";

export default function useAuth() {
    const auth = getAuth();
    const [user, setUserss] = useState('');
    const [loading, setLoading] = useState(false);
    const { push } = useRouter();
    const dispatch = useDispatch();
    
    useEffect(() => {
        setLoading(true)
        const unsubscribe = onAuthStateChanged(auth, async (user) => {  //user 정보를 가져오고 user에 auth가 바뀔때마다 실행
          if(user) {  //로그인이 되었으며
            setUserss(user)
            // push("/");
            setLoading(false);
            dispatch(setUser({   // 이 셋 파라미터가 이해가 안간다.??
              uid: user.uid,
              displayName: user.displayName,
              photoURL: user.photoURL
    
            }));

            await saveFcmToken(user.uid);


          } else {
            setUserss(null)
            // push("/login");
            setLoading(false)
            dispatch(clearUser());
          }
        })
    
        return () => {
          unsubscribe();
        }
      }, [])

      return {user, loading}
    }
