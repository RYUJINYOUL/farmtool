'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils';
import { uploadLinkImage, deleteImageFromStorage } from '@/hooks/useUploadImage';


interface LinkItem {
  image: string;
  title: string;
  url: string;
  bgColor?: string;
  textColor?: string;
  opacity?: number;
}

type LogoProps = {
  username?: string;
  uid?: string;
};

const COLOR_PALETTE = [
  'transparent',
  '#000000', '#FFFFFF', '#F87171', '#FBBF24',
  '#34D399', '#60A5FA', '#A78BFA', '#F472B6',
];

export default function LinkCards({ username, uid }: LogoProps) {
  const pathname = usePathname();
  const isEditable = pathname.startsWith('/editor');
  const { currentUser } = useSelector((state: any) => state.user);

  const finalUid = uid ?? currentUser?.uid;
  const finalUsername = username ?? currentUser?.username ?? "사이트";

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  // Use a state to track which link's settings are open
  const [openSettingsIndex, setOpenSettingsIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      if (!finalUid) return;
      try {
        const docRef = doc(db, 'users', finalUid, 'info', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setLinks(data.links || []);
        }
      } catch (err) {
        console.error('링크 불러오기 실패:', err);
      }
    };
    fetchLinks();
  }, [finalUid]);

  const saveLinks = async (updatedLinks: LinkItem[]) => {
    if (!finalUid) return;
    try {
      const docRef = doc(db, 'users', finalUid, 'info', 'main');
      await setDoc(docRef, { links: updatedLinks }, { merge: true });
      setLinks(updatedLinks);
    } catch (err) {
      console.error('링크 저장 실패:', err);
    }
  };

  const handleImageChange = async (index: number, file: File) => {
    try {
       const linkToDelete = links[index];
        if (linkToDelete.image && !linkToDelete.image.startsWith('/new/defaultLogo.png')) {
          // Only delete if it's a real uploaded image, not the default placeholder
          await deleteImageFromStorage(linkToDelete.image);
        }
      const url = await uploadLinkImage(file, finalUid);
      const updated = [...links];
      updated[index].image = url;
      await saveLinks(updated);
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
    }
  };

  const addNewLink = async () => {
    const newLink: LinkItem = {
      image: '/new/defaultLogo.png',
      title: '제목,링크 등록',
      url: '',
      bgColor: '#ffffff',
      textColor: '#000000',
      opacity: 1,
    };
    const updated = [...links, newLink];
    await saveLinks(updated);
  };

  const handleEdit = async (index: number) => {
    if (!isEditable) return;
    const newTitle = prompt('제목을 입력하세요', links[index].title);
    const newUrl = prompt('링크 주소를 입력하세요', links[index].url);
    if (!newTitle || !newUrl) return;

    const updated = [...links];
    updated[index].title = newTitle;
    updated[index].url = newUrl;
    await saveLinks(updated);
  };

  const onDeleteLink = async (index: number) => {
    // Add confirmation alert
    if (window.confirm('정말로 이 링크를 삭제하시겠습니까?')) {
      const linkToDelete = links[index]; // Get the link object before it's removed from 'links' state

      try {
        // 1. Attempt to delete the image from Firebase Storage
        if (linkToDelete.image && !linkToDelete.image.startsWith('/new/defaultLogo.png')) {
          // Only delete if it's a real uploaded image, not the default placeholder
          await deleteImageFromStorage(linkToDelete.image);
        }

        // 2. Remove the link from Firestore and local state
        const updatedLinks = [...links];
        updatedLinks.splice(index, 1);
        await saveLinks(updatedLinks); // This updates Firestore and setLinks state

        // 3. Adjust openSettingsIndex as before
        if (openSettingsIndex === index) {
          setOpenSettingsIndex(null);
        } else if (openSettingsIndex !== null && openSettingsIndex > index) {
          setOpenSettingsIndex(openSettingsIndex - 1);
        }
      } catch (error) {
        console.error('링크 삭제 중 오류 발생:', error);
        alert('링크 삭제에 실패했습니다. 다시 시도해주세요.'); // User-friendly error message
      }
    }
  };


  const moveLink = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= links.length) return;
    const updated = [...links];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    await saveLinks(updated);
    // Adjust openSettingsIndex if the moved link was the one with open settings
    if (openSettingsIndex === fromIndex) {
      setOpenSettingsIndex(toIndex);
    }
  };

  return (
    <div className='flex items-center justify-center w-full'>
    <section className="space-y-4 pt-3 p-2 md:w-[1100px] w-full">
      {links.map((link, index) => (
       <div className='flex flex-col' key={index}> {/* Added key to the outer div */}
        <div
          className={cn("flex flex-row items-center p-2 rounded-2xl gap-6 transition-all shadow-sm" ,isEditable&&"flex flex-row")}
           style={{
        // Convert the background color to RGBA with the desired opacity
            backgroundColor: link.bgColor ? `rgba(${parseInt(link.bgColor.slice(1, 3), 16)}, ${parseInt(link.bgColor.slice(3, 5), 16)}, ${parseInt(link.bgColor.slice(5, 7), 16)}, ${link.opacity ?? 1})` : `rgba(255, 255, 255, ${link.opacity ?? 1})`,
            color: link.textColor || '#000000',
      }}
        >
          {/* 이미지 업로드 input */}
          <input
            type="file"
            accept="image/*"
            ref={(el: HTMLInputElement | null) => {
              fileInputRefs.current[index] = el;
            }}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageChange(index, file);
            }}
          />

          {/* 이미지 */}
      <Image
            src={link.image}
            width={50}
            height={50}
            alt="link"
            className={cn(
              'rounded-xl object-cover w-[50px] h-[50px]',
              isEditable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
            )}
        onClick={() => isEditable && fileInputRefs.current[index]?.click()}
        />

          {/* 제목 링크 */}
        <div className="flex-grow">
          {isEditable ? (
        <span className="text-[16px] font-semibold">{link.title}</span>
          ) : (
            <a
              href={link.url.startsWith('http://') || link.url.startsWith('https://') ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] font-semibold hover:underline"
              style={{ color: link.textColor || '#000000' }}
            >
              {link.title}
            </a>
          )}
         </div>

          {/* 편집/삭제/이동 버튼 */}
          {isEditable && (
            <div className="flex flex-wrap gap-1 ml-auto">
              <Button
                onClick={() => setOpenSettingsIndex(openSettingsIndex === index ? null : index)} // Toggle settings for this specific link
                className='bg-white text-black' size="sm"
              >
                C
              </Button>
              <Button
                onClick={() => handleEdit(index)}
                className='bg-white text-black' size="sm"
              >
                ✎
              </Button>
              <Button
                onClick={() => moveLink(index, index - 1)}
                className='bg-white text-black' size="sm"
              >
                ↑
              </Button>
              <Button
                onClick={() => moveLink(index, index + 1)}
                className='bg-white text-black' size="sm"
              >
                ↓
              </Button>
              <Button
                onClick={() => onDeleteLink(index)}
                className='bg-white text-black' size="sm"
              >
                X
              </Button>
            </div>
            
          )}
          </div>

          {/* 색상 및 투명도 편집 */}    
          {isEditable && openSettingsIndex === index && ( // Only show if isEditable and this link's settings are open
            <div className='flex flex-col gap-2'>
            <div className="w-full flex flex-wrap items-center gap-2 mt-2 ml-4">
              <label className="text-sm font-medium">배경색 :</label>
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    const updated = [...links];
                    updated[index].bgColor = color;
                    saveLinks(updated);
                  }}
                />
              ))}
               <label className="text-sm font-medium ml-4">투명도:</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={link.opacity ?? 1}
                onChange={(e) => {
                  const updated = [...links];
                  updated[index].opacity = parseFloat(e.target.value);
                  saveLinks(updated);
                }}
                className="w-24"
              />
              <span className="text-sm">{(link.opacity ?? 1).toFixed(1)}</span>
              </div>

              <div className='w-full flex flex-wrap items-center gap-2 mt-2 ml-4'>
              <label className="text-sm font-medium">텍스트색 :</label>
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color + '-text'}
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    const updated = [...links];
                    updated[index].textColor = color;
                    saveLinks(updated);
                  }}
                />
              ))}
            </div>
            </div>
          )}
        </div>
      ))}
      


      {/* 새 링크 추가 버튼 */}
      {isEditable && (
        <button
          onClick={addNewLink}
          className="w-full mt-4 p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 mb-3"
        >
          새 링크 추가
        </button>
      )}
    </section>
    </div>
  );
}