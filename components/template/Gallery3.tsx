"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useSelector } from "react-redux";
import { uploadLogoImage, uploadLinkImage, deleteImageFromStorage } from "@/hooks/useUploadImage"; // deleteImageFromStorage도 필요합니다.
import imageCompression from "browser-image-compression";

import CropperModal from '@/components/ui/CropperModal';

type LogoProps = {
  username?: string;
  uid?: string;
};

const COLOR_PALETTE = [
  "transparent",
  "#000000", "#FFFFFF", "#F87171", "#FBBF24",
  "#34D399", "#60A5FA", "#A78BFA", "#F472B6",
];

function Gallery3 ({ username, uid }: LogoProps) {
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'background' | null>(null);
  const [isUploading, setIsUploading] = useState(false); // 업로드 상태 추가

  const pathname = usePathname();
  const isEditable = pathname.startsWith("/editor");
  const { currentUser } = useSelector((state: any) => state.user);
  const finalUid = uid ?? currentUser?.uid;
  const finalUsername = username ?? currentUser?.username ?? "사이트";

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState("/new/defaultLogo.png");
  const [bgUrl, setBgUrl] = useState("/Image/bg.jpeg");
  const [name, setName] = useState("제목을 입력하세요");
  const [desc, setDesc] = useState("간단한 설명을 입력하세요");
  const [bgBaseColor, setBgBaseColor] = useState("transparent");
  const [bgOpacity, setBgOpacity] = useState(0.7);
  const [textColor, setTextColor] = useState("#FFFFFF");

  const [showBgColors, setShowBgColors] = useState(false);
  const [showTextColors, setShowTextColors] = useState(false);

  const computedBgColor = bgBaseColor === "transparent"
    ? "transparent"
    : `${bgBaseColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, "0").toUpperCase()}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!finalUid) return; // finalUid가 없으면 데이터 가져오지 않음
      const docRef = doc(db, "users", finalUid, "info", "details");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.bgUrl) setBgUrl(data.bgUrl);
        if (data.name) setName(data.name);
        if (data.desc) setDesc(data.desc);
        if (data.bgColor) setBgBaseColor(data.bgColor);
        if (data.bgOpacity) setBgOpacity(parseFloat(data.bgOpacity));
        if (data.textColor) setTextColor(data.textColor);
      }
    };
    fetchData();
  }, [finalUid]); // finalUid가 변경될 때마다 데이터를 가져오도록 의존성 배열에 추가

  const handleChangeText = async (label: "name" | "desc") => {
    if (!isEditable) return;
    const current = label === "name" ? name : desc;
    const newText = prompt(`새 ${label === "name" ? "이름" : "설명"}을 입력하세요`, current);
    if (!newText) return;

    label === "name" ? setName(newText) : setDesc(newText);
    await saveToFirestore({ [label]: newText });
    alert("저장되었습니다.");
  };

  const handleColorSelect = async (label: "bgColor" | "textColor", color: string) => {
    if (!isEditable) return;
    if (label === "bgColor") {
      setBgBaseColor(color);
      await saveToFirestore({ bgColor: color });
    } else {
      setTextColor(color);
      await saveToFirestore({ textColor: color });
    }
  };

  // handleFileChange: 파일을 읽어서 CropperModal에 전달하는 역할만 합니다.
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'background'
  ) => {
    if (!isEditable || isUploading) return; // isUploading 상태 추가
    const file = e.target.files?.[0];
    if (!file) {
      console.log("파일이 선택되지 않았습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      console.log("FileReader 결과:", result ? "이미지 데이터 로드됨" : "이미지 데이터 없음");
      console.log("cropImageSrc 및 cropType을 다음으로 설정:", type);
      setCropImageSrc(result); // 크롭 모달에 넘길 이미지 데이터
      setCropType(type);       // 크롭 모달에 넘길 타입
    };
    reader.readAsDataURL(file);
  };

  // onCrop: CropperModal에서 크롭된 이미지를 받아 업로드하고 상태를 업데이트합니다.
  const handleCropApply = async (croppedBlob: Blob) => {
    if (!finalUid || !cropType) {
      console.error("UID 또는 크롭 타입이 유효하지 않습니다.");
      setCropImageSrc(null);
      setCropType(null);
      return;
    }

    try {
      setIsUploading(true); // 업로드 시작
      console.log("크롭된 이미지 처리 시작 (onCrop)");

      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const croppedFile = new File([croppedBlob], `cropped_image.${cropType === 'logo' ? 'jpeg' : 'jpeg'}`, { type: croppedBlob.type });

      const compressedFile = await imageCompression(croppedFile, options);
      const uploadFn = cropType === "logo" ? uploadLogoImage : uploadLinkImage; // `uploadLinkImage`는 배경 이미지 업로드용으로 가정합니다.

      // 기존 이미지 삭제 로직
      const oldUrl = cropType === "logo" ? logoUrl : bgUrl;
      if (oldUrl && !oldUrl.startsWith("/Image/")) { // 기본 이미지는 삭제하지 않음
        console.log("기존 이미지 삭제 시도:", oldUrl);
        await deleteImageFromStorage(oldUrl);
      }

      console.log("새 이미지 업로드 시작");
      const url = await uploadFn(compressedFile, finalUid);
      console.log("새 이미지 URL:", url);

      if (cropType === "logo") {
        setLogoUrl(url);
        await saveToFirestore({ logoUrl: url });
      } else {
        setBgUrl(url);
        await saveToFirestore({ bgUrl: url });
      }

      alert("이미지가 성공적으로 업데이트되었습니다.");

    } catch (err) {
      console.error("이미지 업로드 및 처리 중 오류 발생", err);
      alert("이미지 업로드에 실패했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsUploading(false); // 업로드 완료 (성공/실패 무관)
      setCropImageSrc(null); // 모달 닫기
      setCropType(null);     // 모달 닫기
      console.log("크롭된 이미지 처리 완료 (onCrop)");
    }
  };


  const saveToFirestore = async (data: Record<string, string>) => {
    if (!finalUid) {
      console.error("저장할 UID가 없습니다.");
      return;
    }
    await setDoc(doc(db, "users", finalUid, "info", "details"), data, { merge: true });
  };

  const handleDeleteBackground = async () => {
    if (!isEditable) return;
    const defaultBg = "/Image/bg.jpeg";

    try {
      if (bgUrl && !bgUrl.startsWith("/Image/")) {
        await deleteImageFromStorage(bgUrl);
      }
      setBgUrl(defaultBg);
      await saveToFirestore({ bgUrl: defaultBg });
      alert("배경 이미지가 삭제되었습니다.");
    } catch (err) {
      console.error("배경 이미지 삭제 실패", err);
      alert("배경 이미지 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex items-center justify-center w-full p-[10px]">
      <div className="relative w-full md:w-[1000px] overflow-hidden rounded-xl shadow-lg" style={{ backgroundColor: computedBgColor }}>
        <input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={(e) => handleFileChange(e, "background")} />
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              bgBaseColor === "transparent"
                ? `url(${bgUrl})`
                : `linear-gradient(${computedBgColor}, ${computedBgColor}), url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            cursor: isEditable ? "pointer" : "default",
          }}
          onClick={() => isEditable && !isUploading && bgInputRef.current?.click()} // isUploading 중에는 클릭 비활성화
        />

        <div className="relative z-10 flex flex-col items-center pt-12 px-4" style={{ color: textColor }}>
          <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={(e) => handleFileChange(e, "logo")} />
          <Image
            src={logoUrl}
            alt="로고"
            width={100}
            height={100}
            className="rounded-full border-4 border-white shadow-md cursor-pointer hover:scale-105 transition-all duration-200"
            onClick={() => isEditable && !isUploading && logoInputRef.current?.click()} // isUploading 중에는 클릭 비활성화
            title={isEditable ? "로고 클릭 시 변경" : ""}
          />
          <h1 className={`text-2xl font-bold mt-4 ${isEditable ? "cursor-pointer hover:underline" : ""}`} onClick={() => handleChangeText("name")}>{name}</h1>
          <p className={`text-sm mt-1 mb-10 ${isEditable ? "cursor-pointer hover:underline" : ""}`} onClick={() => handleChangeText("desc")}>{desc}</p>

          {isEditable && (
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="flex flex-col items-start gap-2">
                <button onClick={() => setShowBgColors(!showBgColors)} className="p-2 px-4 bg-blue-500/70 text-white rounded-lg font-medium text-sm text-center shadow transition hover:bg-blue-600/90 hover:scale-105 active:bg-blue-800/90 select-none">
                  배경색 {showBgColors ? "닫기" : "열기"}
                </button>
                {showBgColors && (
                  <div className="flex flex-col">
                    <div className="flex gap-2 flex-wrap mt-2 w-[150px]">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={`bg-${color}`}
                          onClick={() => handleColorSelect("bgColor", color)}
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{
                            backgroundColor: color === "transparent" ? "white" : color,
                            backgroundImage:
                              color === "transparent"
                                ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                                : undefined,
                            backgroundSize: "8px 8px",
                            backgroundPosition: "0 0, 4px 4px",
                          }}
                          title={color === "transparent" ? "투명" : color}
                        />
                      ))}
                    </div>
                    <label className="text-xs mt-1 text-gray-700">투명도</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgOpacity}
                      onChange={async (e) => {
                        const value = parseFloat(e.target.value);
                        setBgOpacity(value);
                        await saveToFirestore({ bgOpacity: value.toString() });
                      }}
                      className="w-[120px]"
                    />
                    <button onClick={() => bgInputRef.current?.click()} className="p-2 px-4 bg-blue-500/70 text-white rounded-lg font-medium text-sm text-center shadow transition hover:bg-blue-600/90 hover:scale-105 active:bg-blue-800/90 select-none" disabled={isUploading}>배경이미지설정</button>
                    <button onClick={handleDeleteBackground} className="p-2 px-4 bg-blue-500/70 text-white rounded-lg font-medium text-sm text-center shadow transition hover:bg-blue-600/90 hover:scale-105 active:bg-blue-800/90 select-none">배경이미지삭제</button>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <button onClick={() => setShowTextColors(!showTextColors)} className="p-2 px-4 bg-blue-500/70 text-white rounded-lg font-medium text-sm text-center shadow transition hover:bg-blue-600/90 hover:scale-105 active:bg-blue-800/90 select-none">
                  텍스트색 {showTextColors ? "닫기" : "열기"}
                </button>
                {showTextColors && (
                  <div className="flex gap-2 flex-wrap mt-2 justify-end w-[120px]">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={`text-${color}`}
                        onClick={() => handleColorSelect("textColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: color === "transparent" ? "white" : color,
                          backgroundImage:
                            color === "transparent"
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                              : undefined,
                          backgroundSize: "8px 8px",
                          backgroundPosition: "0 0, 4px 4px",
                        }}
                        title={color === "transparent" ? "투명" : color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

       
        {cropImageSrc && cropType && (
          <CropperModal
            image={cropImageSrc}
            type={cropType}
            onCancel={() => {
              setCropImageSrc(null);
              setCropType(null);
              setIsUploading(false); // 취소 시 업로드 상태도 초기화
            }}
            onCrop={handleCropApply} // 새로 만든 handleCropApply 함수 연결
          />
        )}
        {isUploading && !cropImageSrc && ( // 모달이 떠있지 않을 때만 전체 화면 로더 표시
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-md shadow-lg flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-medium">이미지를 업로드 중입니다...</p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery3;