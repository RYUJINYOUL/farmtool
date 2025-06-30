import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);


if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080); // Firestore 에뮬레이터 기본 포트
  connectAuthEmulator(auth, "http://localhost:9099");
}

console.log("FIREBASE CONFIG", firebaseConfig);


export default app;
