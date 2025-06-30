// components/CropperModal.tsx
'use client'

import React, { useRef, useState } from 'react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

type Props = {
  image: string
  onCancel: () => void
  onCrop: (croppedBlob: Blob) => Promise<void>
  type: 'logo' | 'background'
}

export default function CropperModal({ image, onCancel, onCrop, type }: Props) {
  const cropperRef = useRef<HTMLImageElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleApply = async () => {
    const cropper = (cropperRef.current as any)?.cropper
    if (!cropper) return

    setIsUploading(true)
    try {
      const canvas = cropper.getCroppedCanvas({ maxWidth: 512, maxHeight: 512 })
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve!, 'image/jpeg'))
      await onCrop(blob!)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-md shadow-md w-full max-w-2xl relative">
        <h2 className="text-lg font-semibold mb-2">
          {type === 'logo' ? '로고 자르기' : '배경 자르기'}
        </h2>

        <Cropper
          src={image}
          style={{ height: 400, width: '100%' }}
          aspectRatio={type === 'logo' ? 1 : 16 / 9}
          guides={true}
          viewMode={1}
          ref={cropperRef}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="border px-4 py-2 rounded">취소</button>
          <button onClick={handleApply} className="bg-blue-500 text-white px-4 py-2 rounded">
            적용
          </button>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-sm z-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            업로드 중입니다...
          </div>
        )}
      </div>
    </div>
  )
}