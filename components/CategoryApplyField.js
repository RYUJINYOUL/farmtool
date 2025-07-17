// components/CategorySpecificFields.js

'use client';

import { Input } from "@/components/ui/input";
// `lib/constants`에서 매핑된 카테고리 및 필드 정보를 가져옵니다.
import { CATEGORY_APPLY_FIELDS, KOREAN_TO_ENGLISH_APPLY } from '@/lib/constants';

export default function CategoryApplyFields({
  TopCategory, // 선택된 한글 대분류 카테고리 (예: '전문인력')
  formState,
  handleInputChange,
  error,
}) {
  // 선택된 한글 카테고리에 해당하는 영어 카테고리 이름을 가져옵니다.
  const englishCategory = KOREAN_TO_ENGLISH_APPLY[TopCategory];

  // 해당 영어 카테고리에 정의된 필드 목록을 가져옵니다.
  const fieldsToRender = CATEGORY_APPLY_FIELDS[englishCategory] || [];

  // "전체" 카테고리가 선택되었거나, 해당 카테고리에 정의된 필드가 없는 경우
  if (!englishCategory || TopCategory === '전체') {
    return (
      <div className="text-gray-500 text-sm py-2">
        카테고리(대분류)를 선택하면 해당 업종에 맞는 추가 정보 입력란이 나타납니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-2">
        {TopCategory} 신청하기
      </h3>
      {fieldsToRender.map((field) => (
        <div key={field.id} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          {field.component === 'input' ? (
            <Input
              type={field.type}
              id={field.id} // 이 ID를 사용하여 formState의 categorySpecificData에 저장됩니다.
              value={
                // 동적 필드의 값은 formState.categorySpecificData[englishCategory][field.id] 에서 가져옵니다.
                formState.categorySpecificData[englishCategory]?.[field.id] || ''
              }
              onChange={handleInputChange}
              placeholder={field.placeholder}
              // Tailwind CSS 유틸리티 클래스를 사용하여 Input 스타일 조정
              className="flex-grow text-gray-900 text-base outline-none bg-transparent w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          ) : field.component === 'textarea' ? (
            <textarea
              id={field.id}
              value={(
                formState.categorySpecificData[englishCategory]?.[field.id] || ''
              ).replace(/\\n/g, '\n')}
              onChange={handleInputChange}
              placeholder={field.placeholder}
              className="flex-grow text-gray-900 text-base outline-none bg-transparent resize-y w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={field.rows || 3}
            />
          ) : null /* 다른 컴포넌트 타입 (예: 체크박스)은 여기에 추가 */ }
        </div>
      ))}
      {error && <p className="text-red-500 text-sm pt-2 text-center">{error}</p>}
    </div>
  );
}