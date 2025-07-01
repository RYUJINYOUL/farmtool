// app/payments/fail/FailClientComponent.jsx
"use client"; // 이 컴포넌트는 클라이언트에서만 렌더링됩니다.

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link'; // Link 컴포넌트도 클라이언트에서 사용되므로 여기에 import

export default function FailClientComponent() {
  const searchParams = useSearchParams();
  const [errorCode, setErrorCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setErrorCode(searchParams.get('code'));
    setErrorMessage(searchParams.get('message'));
    setOrderId(searchParams.get('orderId'));
    setIsLoading(false); // 정보 로딩 완료
  }, [searchParams]);

  if (isLoading) {
    return <div>결제 실패 정보를 불러오는 중...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', textAlign: 'center', border: '1px solid #f44336', borderRadius: '8px', backgroundColor: '#ffebee' }}>
      <h1>⚠️ 결제 실패!</h1>
      <p>오류 코드: <strong>{errorCode || '알 수 없음'}</strong></p>
      <p>오류 메시지: <strong>{errorMessage || '알 수 없는 오류가 발생했습니다.'}</strong></p>
      {orderId && <p>주문 번호: <strong>{orderId}</strong></p>}
      <p>결제에 실패했습니다. 다시 시도해 주세요.</p>
      <Link href="/payments/checkout" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        다시 결제하기
      </Link>
    </div>
  );
}