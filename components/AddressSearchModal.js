'use client';

import { Dialog } from '@headlessui/react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddressSearchModal({
  isAddrModalOpen,
  setIsAddrModalOpen,
  addrList,
  locationError,
  isLocationLoading,
  formState, // Input의 주소 값을 업데이트하기 위해 필요
  handleInputChange, // 주소 Input의 변경 핸들러
  addrs, // 주소 검색을 트리거하는 함수
  handleCurrentLocationSearch, // 현재 위치 검색을 트리거하는 함수
  handleSelectAddr, // 주소 선택을 처리하는 함수
}) {
  return (
    <Dialog open={isAddrModalOpen} onClose={() => setIsAddrModalOpen(false)} className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <Dialog.Panel className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={() => setIsAddrModalOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl"
          aria-label="닫기"
        >
          &times;
        </button>

        <div className="grid grid-cols-4 items-center gap-2 pt-3 mb-2">
              <Input
                id="address" 
                value={formState.address}
                onChange={handleInputChange}
                placeholder="주소, 건물명 입력"
                className="col-span-2"
              />
              <Button
                type="button"
                className="col-span-1 text-xs py-2 px-1"
                onClick={addrs}
              >
                주소 검색
              </Button>
              <Button
                  type="button"
                  className="col-start-4 col-span-1 text-xs py-2 px-1"
                  onClick={handleCurrentLocationSearch}
              >
                  현재 위치
                </Button>
          </div>
        {isLocationLoading ? (
          <div className="text-center py-8">위치 정보를 가져오는 중...</div>
        ) : locationError ? (
          <div className="text-red-500 text-center py-8">{locationError}</div>
        ) : addrList.length > 0 ? (
          <div className="space-y-2">
            {addrList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSelectAddr(item)}
              >
                <div className="font-semibold text-gray-800">{item.juso}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">검색 결과가 없습니다. 주소를 다시 입력하거나 현재 위치를 시도해 보세요.</div>
        )}
      </Dialog.Panel>
    </Dialog>
  );
}