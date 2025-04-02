"use client"
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function useAuth() {
    const auth = getAuth();
    const [user, setUser] = useState('');
    const [loading, setLoading] = useState(false);
    const { push } = useRouter();
    
    useEffect(() => {
        setLoading(true)
        const unsubscribe = onAuthStateChanged(auth, (user) => {  //user 정보를 가져오고 user에 auth가 바뀔때마다 실행
          if(user) {  //로그인이 되었으며
            push("/");
            setLoading(false);
          } else {
            push("/login");
            setLoading(false)
          }
        })
    
        return () => {
          unsubscribe();
        }
      }, [])

      return {user, loading}
    }