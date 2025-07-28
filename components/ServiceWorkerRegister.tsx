"use client";
import { useEffect, useState } from "react";

export default function ServiceWorkerRegister() {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 서비스 워커가 'ready' 상태가 될 때까지 기다립니다.
      navigator.serviceWorker.ready
        .then(function (registration) {
          console.log("Service Worker 준비 완료:", registration.scope);
          setIsServiceWorkerReady(true); // 서비스 워커가 준비되면 상태 업데이트
        })
        .catch(function (err) {
          console.error("Service Worker 준비 실패:", err);
          setIsServiceWorkerReady(false);
        });

      // 기존 Service Worker 등록 로직은 그대로 유지하거나,
      // ready Promise가 등록까지 포함하는 경우가 많으므로 중복되지 않게 조절
      // (단, ready는 "등록된" 워커가 활성화되는 것을 기다리므로, 등록이 먼저 성공해야 합니다)
      window.addEventListener("load", function () {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then(function (registration) {
            console.log("Service Worker 등록 성공:", registration.scope);
            // 등록 성공 후에도 'ready' 상태를 기다리는 것이 더 안전합니다.
          })
          .catch(function (err) {
            console.error("Service Worker 등록 실패:", err);
          });
      });
    }
  }, []);

  // 이 상태를 Context API 등을 통해 전역적으로 제공하거나,
  // KakaoAuthPage와 같은 필요한 컴포넌트에서 직접 감지할 수 있도록 합니다.
  // 여기서는 단순히 상태를 설정하고, 필요하면 다른 컴포넌트에서 접근하도록 합니다.
  // 예를 들어, 전역 Redux 상태나 Context를 사용하면 좋습니다.
  // 하지만 이 예시에서는 KakaoAuthPage에서 직접 navigator.serviceWorker.ready를 기다리겠습니다.

  return null;
}