// app/kakao/page.js
import { Suspense } from 'react';
// KakaoAuthPage 컴포넌트의 실제 경로로 수정하세요.
import KakaoAuthPage from '@/components/auth/KakaoAuthPage'; 

// 로딩 상태를 표시할 컴포넌트 (선택 사항)
const Loading = () => {
  return (
    <div>
      <p>카카오 인증 처리 중...</p>
      {/* 로딩 스피너 등을 여기에 추가할 수 있습니다. */}
    </div>
  );
};

export default function KakaoAuthPageWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      {/* useSearchParams를 사용하는 KakaoAuthPage를 Suspense로 감쌉니다. */}
      <KakaoAuthPage />
    </Suspense>
  );
}