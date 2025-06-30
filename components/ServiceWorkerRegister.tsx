"use client"
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then(function (registration) {
            console.log("Service Worker 등록 성공:", registration.scope);
          })
          .catch(function (err) {
            console.log("Service Worker 등록 실패:", err);
          });
      });
    }
  }, []);
  return null;
}