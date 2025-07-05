"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Typography } from "@material-tailwind/react";
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import useAuth from '@/hooks/useAuth';
import { uploadGrassImage } from '@/hooks/useUploadImage';
import imageCompression from 'browser-image-compression';
import moment from 'moment';
import { Button } from "@/components/ui/button";
import { BsCardText } from "react-icons/bs";
import { GiSpeaker } from "react-icons/gi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from 'next/navigation'; // useRouter를 import 해야 하지만, 이미 되어있을 수 있으니 확인해주세요.
import { getAddress, getAddressByLatLon } from '../../../lib/geo'
import geohash from 'ngeohash';
import { GeoPoint } from "firebase/firestore"; 

const GrassPage = () => {
  const { user, loading } = useAuth();
  const [grassList, setGrassList] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const TABLE_HEAD = ["이미지", "글제목", "글쓴이", "작성일"];
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('위치 검색 중 에러발생으로 주소검색으로 검색하세요'); // 에러 메시지 저장
  const [addrList, setAddrList] = useState([]);
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    address: '',
    category: '',
    detail: '',
    phoneNumber: '',
    title: '',
    isNotice: false
  });

  useEffect(() => {
    const grassCollectionRef = collection(db, 'grass');
    const q = query(grassCollectionRef, orderBy('createdDate', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrassList(list);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  async function addrs() {
    setAddrList([]); // 초기화
    const res = await getAddress(formState.address);
    // res는 [{juso, x, y}, ...] 형태로 변환 필요
    const result = res.map(i => ({
      juso: i.address.road,
      x: i.point.x,
      y: i.point.y
    }));
    setAddrList(result);
  }


  const handleCurrentLocationSearch = () => {
      setAddrList([]);
      setLocationError(''); // 이전 에러 초기화
      setIsLocationLoading(true); // 로딩 시작

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const result = await getAddressByLatLon(lon, lat);
            setAddrList(result);
            setIsAddrModalOpen(true); // 성공했을 때만 모달 열기
          } catch (apiError) {
            console.error("주소 API 호출 에러:", apiError);
            setLocationError("주소 정보를 가져오는 데 실패했습니다.");
            setIsAddrModalOpen(true); // API 에러 시에도 모달 열고 에러 메시지 표시
          } finally {
            setIsLocationLoading(false); // 로딩 종료
          }
        },
        (error) => {
          setIsLocationLoading(false); // 로딩 종료
          let errorMessage = "위치 정보를 가져올 수 없습니다.";
          if (error.code === 1) {
            errorMessage = "위치 권한이 거부되었습니다. 브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭해 '위치' 권한을 허용해 주세요. 권한을 허용한 후, 다시 '현재 위치 검색' 버튼을 눌러주세요.";
          } else if (error.code === 2) {
            errorMessage = "위치 정보를 사용할 수 없습니다.";
          } else if (error.code === 3) {
            errorMessage = "위치 정보 요청이 시간 초과되었습니다.";
          }
          setLocationError(errorMessage);
          setIsAddrModalOpen(true); // 에러 발생 시 모달 열기
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // 옵션 추가 (정확도 높임, 타임아웃 설정)
      );
    };

  function handleSelectAddr(item) {
    const lat = Number(item.y);
    const lng = Number(item.x);
    const hash = geohash.encode(lat, lng);
  
    setFormState(prev => ({
      ...prev,
      address: item.juso,
      geoFirePoint: {
        geopoint: { latitude: lat, longitude: lng }, // Firestore에 저장할 때 GeoPoint로 변환
        geohash: hash,
      },
      // lat: lat,
      // lng: lng,
    }));
    setAddrList([]); // 목록 닫기
  }

  const handleOpenDialog = () => {
    if (user) {
      setIsDialogOpen(true);
    } else {
      router.push('/login');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length + newFiles.length > 5) {
        alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length + newFiles.length > 5) {
        alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= imageFiles.length) return;
    
    const newImages = [...imageFiles];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImageFiles(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 필수 필드 검사
    if (!formState.title || !formState.category || !formState.address) {
      alert('제목, 카테고리, 주소는 필수 입력 항목입니다.');
      return;
    }

    setIsUploading(true);
    let imageUrls = [];

    try {
      if (imageFiles.length > 0) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };

        for (const file of imageFiles) {
          const compressedFile = await imageCompression(file, options);
          const url = await uploadGrassImage(compressedFile, user.uid);
          imageUrls.push(url);
        }
      }

      const docData = {
        ...formState,
        userKey: user.uid,
        email: user.email,
        name: user.displayName || '이름 없음',
        imageDownloadUrls: imageUrls,
        confirmed: false,
        numOfLikes: 0,
        createdDate: serverTimestamp(),
      };

      if (formState.geoFirePoint) {
        docData.geoFirePoint = {
          geopoint: new GeoPoint(
            formState.geoFirePoint.geopoint.latitude,
            formState.geoFirePoint.geopoint.longitude
          ),
          geohash: formState.geoFirePoint.geohash,
        };
      } // 디버깅

      await addDoc(collection(db, 'grass'), docData);

      setFormState({
        address: '',
        category: '',
        detail: '',
        phoneNumber: '',
        title: '',
        isNotice: false,
      });
      setImageFiles([]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('데이터 저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;

return (
    <div className="mx-auto w-full max-w-[1100px] p-4 pt-[100px] md:pt-[120px]">
      <section className='flex justify-center items-center'>
        <div className="w-[1100px] lg:mt-10 pt-3.5">
          <Card className="h-full w-full overflow-scroll">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th key={head} className="border-b border-blue-gray-100 bg-gray-100 p-4">
                      <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grassList.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4">
                      {item.isNotice ? (
                        <GiSpeaker className="w-6 h-6" />
                      ) : item.imageDownloadUrls?.length ? (
                        <Image
                          alt="mediaItem"
                          className="object-contain"
                          width={30}
                          height={50}
                          src={item.imageDownloadUrls[0]}
                        />
                      ) : (
                        <BsCardText className="h-5 w-5" />
                      )}
                    </td>
                    <td className="p-4">
                      <Link href={`/con/grass/${item.id}`}>
                        <Typography variant="small" color="blue-gray" className="font-normal truncate md:w-[500px] w-[60px] line-clamp-1 hover:text-blue-600">
                          {item.title}
                          {typeof item.confirmed === 'boolean' && (
                          item.confirmed ? (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">확정</span>
                          ) : (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">대기</span>
                          )
                        )}
                        </Typography>
                      </Link>
                    </td>
                    <td className="p-4">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {item.name}
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography variant="small" color="blue-gray" className="font-medium">
                        {item.createdDate?.toDate ? timeFromNow(item.createdDate.toDate()) : ''}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* DialogTrigger를 제거하고 Button에 직접 onClick을 연결합니다. */}
        <Button 
          onClick={handleOpenDialog}
          className="fixed bottom-8 right-8 rounded-full w-16 h-16 text-3xl shadow-lg"
        >
          +
        </Button>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>새로운 잔디 정보 추가</DialogTitle>
            <DialogDescription>아래 폼을 작성하여 새로운 정보를 등록하세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">이미지</Label>
                <div className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">제목</Label>
                <Input id="title" value={formState.title} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">주소</Label>
                  <Input
                    id="address"
                    value={formState.address}
                    onChange={handleInputChange}
                    className="col-span-1"
                  />
                  <Button
                    type="button"
                    className="col-span-1"
                    onClick={async () => {
                      await addrs();
                      setIsAddrModalOpen(true);
                    }}
                  >
                    주소 검색
                  </Button>
                  <Button
                      type="button"
                      className="col-span-1"
                      onClick={async () => {
                      await handleCurrentLocationSearch();
                      setIsAddrModalOpen(true);
                    }}
                  >
                      현재 위치
                    </Button>
   </div>
   
             
                <Dialog open={isAddrModalOpen} onOpenChange={setIsAddrModalOpen}>
                  <DialogContent>
                    {isLocationLoading ? (
                      <div>위치 정보를 가져오는 중...</div>
                    ) : locationError ? (
                      <div>{locationError}</div>
                    ) : addrList.length > 0 ? (
                      <div>
                        {addrList.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              handleSelectAddr(item);
                              setIsAddrModalOpen(false);
                            }}
                          >
                            <div>{item.juso}</div>
                            <div className="text-xs text-gray-500 hidden">위도: {item.y}, 경도: {item.x}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>검색 결과가 없습니다.</div>
                    )}
                  </DialogContent>
                </Dialog>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">카테고리</Label>
                <Input id="category" value={formState.category} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="detail" className="text-right">상세 내용</Label>
                <textarea id="detail" value={formState.detail} onChange={handleInputChange} className="col-span-3 border rounded p-2 min-h-[60px] resize-y" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">연락처</Label>
                <Input id="phoneNumber" value={formState.phoneNumber} onChange={handleInputChange} className="col-span-3" />
              </div>
              {user?.uid === 'kakao:4331474214' || user?.uid === 'kakao:4322975727' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isNotice" className="text-left">공지사항</Label>
                  <Input id="isNotice" type="checkbox" checked={formState.isNotice} onChange={handleInputChange} className="" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? '저장 중...' : '저장하기'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrassPage;


