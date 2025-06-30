"use client"
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { RiDragDropLine } from "react-icons/ri";
import { BiSolidPhotoAlbum } from "react-icons/bi";
import styles from "../../index.module.css";
import { uploadBytesResumable, getDownloadURL, ref as strRef } from 'firebase/storage';
import { getFirestore, collection, addDoc} from "firebase/firestore";
import app, { storage } from '../../firebase';
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import useUIState from "@/hooks/useUIState";
import imageCompression from 'browser-image-compression';

export default function question({ pag, setPag }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { homeCategory, setHomeCategory, headerImageSrc, setHeaderImageSrc } = useUIState();
  const [image, setImage] = useState([]);
  const [uploadFile, setUploadFile] = useState([]);
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { push } = useRouter();
  const db2 = getFirestore(app);
  const { currentUser } = useSelector(state => state.user)



   const onClickUpLoadButton = async (data) => {  
     await addDoc(collection(db2, "contree"),
        {
          "name": currentUser.name ?? "익명",
          "description": data.description,
          "url": image,
          "title": data.title?? "",
          "userKey": currentUser.uid ?? "",
          "createdDate": new Date(),
          "NumOfLikes": [],
          "isNotice": data.isNotice ?? false,
        })
  
        // push(`/qu`);
        setPag("account")
    }


  
  async function uploadUrl() {
    uploadFile.map((file) => {
      const metadata = { contentType: file.type };
      const storageRef = strRef(storage, `test/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
            setPercentage(Math.round(process));
            switch (snapshot.state) {
                case 'paused':
                    break;
                case 'running':
                    break;
                default:
                    break;
            }
        },
        (error) => {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    break;
                case 'storage/unknown':
                    // Unknown error occurred, inspect error.serverResponse
                    break;
                default:
                    break;
            }
        },
       () => {
        getDownloadURL(uploadTask.snapshot.ref)
        .then((downloadURLs) => {
          setImage(image => [...image, downloadURLs]);
        })
   
     })
    })
    return image
  }



  
    function selectFiles(){
      fileInputRef.current.click()
    }

  
  async function onFileSelect(event) {
  const files = event.target.files;
  if (files.length === 0) return;

  const compressedFiles = [];

  for (let i = 0; i < files.length; i++) {
    if (files[i].type.split('/')[0] !== 'image') continue;
    if (!images.some(e => e.name === files[i].name)) {
      const options = {
        maxSizeMB: 0.3,              // 최대 0.3MB로 압축
        maxWidthOrHeight: 1024,   // 최대 폭 또는 높이 1024px
        useWebWorker: true,
      };

      try {
        const compressedFile = await imageCompression(files[i], options);
        compressedFiles.push(compressedFile);

        setImages(prevImages => [
          ...prevImages,
          {
            name: compressedFile.name,
            url: URL.createObjectURL(compressedFile),
          },
        ]);
      } catch (error) {
        console.error('이미지 압축 실패:', error);
      }
    }
  }

  setUploadFile(prev => [...prev, ...compressedFiles]);
}


  
    function deleteImage(index) {
      setImages((prevImages) => 
        prevImages.filter((_, i)=> i !== index)
      )
      setUploadFile((prevImages) => 
        prevImages.filter((_, i)=> i !== index)
      )
    }
  
    function onDragOver(event) {
      event.preventDefault();
      setIsDragging(true);
      event.dataTransfer.dropEffect = "copy";
    }
  
    function onDragLeave(event) {
      event.preventDefault();
      setIsDragging(false);
    }
  
    function onDrop(event) {
      event.preventDefault();
      setIsDragging(false);
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.split('/')[0] !== 'image') continue;
        if (!images.some((e)=> e.name === files[i].name)) {
          setImages((prevImages) => [
            ...prevImages,
           {
            name: files[i].name,
            url: URL.createObjectURL(files[i])
           },
        ]);
      }
      }
    }
  
    async function uploadImage(){
      uploadUrl()
      alert("이미지가 업로드 되었습니다.")
    }


  return (
    <div className="flex items-center justify-start p-2 pt-10">
    <div className="mx-auto w-full max-w-[550px] bg-white">
       <div className='font-medium text-lg' style={{ textAlign: 'center' }}>
      <h3>업로드</h3>
     </div>   
    <div className='w-full flex justify-center items-center '>
    <div className={styles.card}>
      <div className='mt-5' />
      <div className={styles.dragArea} onClick={selectFiles} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {isDragging ? (
          <RiDragDropLine size={50} />
        ) : (
         <>
          <RiDragDropLine size={50}/>  {" "} 
         <span className='select' role='button'>
         <BiSolidPhotoAlbum size={50} />
         </span>
        </>
        )}
        <input name='file' type='file' className='file' multiple ref={fileInputRef} onChange={onFileSelect}></input>
        </div>
        <div className={styles.container}>
          {images.map((images, index) => (
              <div className={styles.image} key={index}>
              <span className={styles.delete} onClick={() => deleteImage(index)}>&times;</span>
            <img src={images.url} alt={images.name} />
          </div>
          ))}
         </div>
        <button className='w-full px-8 py-4 rounded-lg font-medium bg-gray-300 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white'
         onClick={uploadImage}>
          이미지업로드
        </button>
       
    </div>
    
    </div>
        <div className='mt-5'/>
        <form className='mx-auto max-w-sm' onSubmit={handleSubmit(onClickUpLoadButton)}>
       
             <input
                  className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                  type="name" 
                  name="name"
                  placeholder="제목"
                  {...register("title")}
                />
             <div className='mt-5'/>

              <textarea
                    className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                    placeholder="장문 입력"
                    name="description"
                    rows="5" 
                    cols="16"
                    {...register("description")}
                />     
              {/* <div className='mt-5'/>   */}

              <label className="flex items-center ml-3 mt-3 space-x-2 text-sm">
                <input type="checkbox" {...register("isNotice")} />
                <span>공지사항</span>
              </label>
             <div className='mt-5'/>

            <div>
                <button
                    type="submit"
                    className="w-full px-8 py-4 rounded-lg font-medium bg-gray-300 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white">
                    등록
                </button>
            </div>
        </form>
    </div>
</div>
  )
}


