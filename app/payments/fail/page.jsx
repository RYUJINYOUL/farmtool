// app/payments/fail/page.js
// 클라이언트 측에서만 사용되는 훅이 포함된 컴포넌트를 Suspense로 감싸줍니다.
import { Suspense } from 'react';
import FailClientComponent from './FailClientComponent'; // 새로 생성할 클라이언트 컴포넌트

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div>결제 실패 정보를 불러오는 중...</div>}>
      {/* useSearchParams를 사용하는 실제 컴포넌트를 Suspense로 감쌉니다. */}
      <FailClientComponent />
    </Suspense>
  );
}

// 참고: Next.js 13+ App Router에서는
// 페이지 컴포넌트(page.js)는 기본적으로 서버 컴포넌트입니다.
// 따라서 'use client' 지시어는 여기에 직접 넣지 않습니다.