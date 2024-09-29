
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWCJV-KlGDHUUosbfqcy0yqJAiOy3zdBI",
  authDomain: "farmtool-75b0f.firebaseapp.com",
  projectId: "farmtool-75b0f",
  storageBucket: "farmtool-75b0f.appspot.com",
  messagingSenderId: "609587756851",
  appId: "1:609587756851:web:7bdeeca60bb9e50e828846"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;