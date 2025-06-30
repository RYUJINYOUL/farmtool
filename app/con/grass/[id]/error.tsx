'use client';
export default function Error({ error, reset }: { error: any, reset: any }) {
  return (
    <div className="flex flex-col justify-center items-center h-screen text-xl">
      <div>에러가 발생했습니다: {error.message}</div>
      <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">다시 시도</button>
    </div>
  );
} 