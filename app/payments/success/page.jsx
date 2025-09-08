// app/payments/success/page.jsx
import { Suspense } from "react";
import PaymentSuccessPage from "../../../components/PaymentSuccessPage";

export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중</div>}>
      <PaymentSuccessPage />
    </Suspense>
  );
}