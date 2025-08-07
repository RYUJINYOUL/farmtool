"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
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

       
        const response = await fetch(finalConfirmUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json', // JSON 응답을 기대한다는 헤더 추가
          },
        });

        const result = await response.json(); // 응답을 JSON으로 파싱

        if (!response.ok) {
          // 서버에서 보낸 에러 응답 처리
          throw new Error(result.message || '결제 승인 중 알 수 없는 오류 발생');
        }

        // 서버에서 보낸 성공 응답 처리
        setStatus("✅ 결제가 성공적으로 처리되었습니다.");
        setIsError(false);

        setTimeout(() => {
          router.push('/');
        }, 3000);


        // TODO: 결제 성공 후 사용자에게 보여줄 정보를 result 객체에서 가져와 사용

      } catch (err) {
        console.error("결제 승인 중 오류 발생:", err);
        setStatus(`⚠️ 결제 승인 중 예기치 못한 오류가 발생했습니다: ${err.message}`);
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