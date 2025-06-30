"use client"
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearUser, setUser } from "../store/userSlice";
import app, { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function useAuth2() {
    const auth = getAuth();
    const [user, setUserss] = useState('');
    const [loading, setLoading] = useState(false);
    const { push } = useRouter();
  
    
    useEffect(() => {
        setLoading(true)
        const unsubscribe = onAuthStateChanged(auth, async (user) => {  //user 정보를 가져오고 user에 auth가 바뀔때마다 실행
   
        if(user) {  //로그인이 되었으며
         const docs = doc(db, "users", user.uid)
         const docSnapshot = await getDoc(docs);


         if (docSnapshot.exists) {
            push("/");
            setLoading(false);
         } 

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