import { Suspense } from "react";
import CheckoutPage from "./CheckoutPage";

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
