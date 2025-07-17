'use client';


import { Label } from "@/components/ui/label"; // Label 컴포넌트 경로에 맞게 수정하세요.
import Image from "next/image"; // Next.js의 Image 컴포넌트


export default function ImageUpload({
  handleDrag,
  handleDrop,
  handleSaveUsernameAndProfile,
  fileInputRef,
  dragActive,
  imageFiles,
  removeImage,
  moveImage,
  handleFileSelect,
  setImageFiles,
  setDragActive
}) {


  return (
    <form onSubmit={handleSaveUsernameAndProfile} className="flex-grow overflow-y-auto pr-2"> {/* Added flex-grow and overflow-y-auto */}
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-start gap-4">
        <div className="col-span-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-gray-500">
              <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
              <p className="text-sm">여러 이미지 선택 가능</p>
            </div>
          </div>
          
          {imageFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">선택된 이미지 ({imageFiles.length}개)</h4>
              <div className="grid grid-cols-3 gap-2">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(index, index - 1)}
                          disabled={index === 0}
                          className="bg-white/80 text-black rounded-full w-6 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, index + 1)}
                          disabled={index === imageFiles.length - 1}
                          className="bg-white/80 text-black rounded-full w-6 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
   </div>      
  </form>
  );
}