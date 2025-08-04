"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();

  const confirmUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_CONFIRM_URL;

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const collectionName = searchParams.get("collectionName");
  const subscriptionPeriodInMonths = searchParams.get("subscriptionPeriodInMonths");

  const [status, setStatus] = useState("결제 승인 중...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !isMounted) return;

      try {
        const idToken = await user.getIdToken();

        if (!paymentKey || !orderId || !amount || !collectionName || !subscriptionPeriodInMonths) {
          setStatus("⚠️ 결제 정보가 부족합니다.");
          setIsError(true);
          return;
        }

        const finalConfirmUrl = new URL(confirmUrl);
        finalConfirmUrl.searchParams.append("paymentKey", paymentKey);
        finalConfirmUrl.searchParams.append("orderId", orderId);
        finalConfirmUrl.searchParams.append("amount", amount);
        finalConfirmUrl.searchParams.append("collectionName", collectionName);
        finalConfirmUrl.searchParams.append("subscriptionPeriodInMonths", subscriptionPeriodInMonths);

        // ✅ 직접 리다이렉트
        window.location.href = finalConfirmUrl.toString();
      } catch (err) {
        console.error("결제 승인 중 오류 발생:", err);
        setStatus("⚠️ 결제 승인 중 예기치 못한 오류가 발생했습니다.");
        setIsError(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [confirmUrl, paymentKey, orderId, amount, collectionName, subscriptionPeriodInMonths]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>결제 처리 중...</h1>
      <p style={{ color: isError ? "red" : "green" }}>{status}</p>
    </div>
  );
};

export default PaymentSuccessPage;
