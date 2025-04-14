"use client"

import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { uploadBytesResumable, getDownloadURL, ref as strRef } from 'firebase/storage';
import { getFirestore, collection, addDoc} from "firebase/firestore";
import app, { storage } from '../firebase';
import styles from "../index.module.css";
import { useRouter } from "next/navigation";
import ImageUpload from '@/components/uploadImage.js'
import { get } from '../lib/geo'
import { useSelector } from 'react-redux';
import { RiDragDropLine } from "react-icons/ri";
import { BiSolidPhotoAlbum } from "react-icons/bi";





function Upload ({props}){
  console.log(props[1])
  const db2 = getFirestore(app);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { push } = useRouter();
  const [percentage, setPercentage] = useState(0);
  const [image, setImage] = useState([]);
  const [uploadFile, setUploadFile] = useState([]);
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useSelector(state => state.user)


  


  const onClickUpLoadButton = async (data) => {  
    // await setDoc(doc(db2, `aaaa`, data.name),
   await addDoc(collection(db2, data.category),
      {
        "name": data.name,
        "description": data.description,
        "url": image,
        "title": data.title,
        "address": props[0],
        "phoneNumber": data.phoneNumber,
        "userKey": currentUser.uid,
        "category": data.category,
        "createdDate": new Date(),
        "NumOfLikes": [],
        "geoFirePoint": await get(data?.address),
        "region": stringArr(data.address),  
      })

      push("/constructure");
  }


  function stringArr(addr) {
    spt = addr.split(" ")
    return spt
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

  
    function onFileSelect(event){   //보여주고 handle로 넘어가게 한다.
      const files = event.target.files
      const uploadFile = Array.from(files)
      setUploadFile((prevImages) => 
        prevImages.concat(uploadFile)
      )
      if (files.length === 0) return;
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
      // await get("cndnwnltl")
      uploadUrl()
      alert("이미지가 업로드 되었습니다.")
    }


  
  

  return (
    <div className={styles.authwrapper}>
       <div className='pt-10 font-medium text-lg' style={{ textAlign: 'center' }}>
      <h3>상품등록</h3>
     </div>
      <div className='w-full flex justify-center items-center '>
        <div className="card w-[400px]">
      <div className='mt-5' />
      <div className='drag-area' onClick={selectFiles} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
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
        <div className='container'>
          {images.map((images, index) => (
              <div className='image' key={index}>
              <span className='delete' onClick={() => deleteImage(index)}>&times;</span>
            <img src={images.url} alt={images.name} />
          </div>
          ))}
         </div>
        <button type='ssss' onClick={uploadImage}>
          이미지업로드
        </button>
        <button type="uuuu" onClick={() => push('/address') }>
           {props[0] || '주소'}
        </button>
    </div>
    </div>
    <form onSubmit={handleSubmit(onClickUpLoadButton)}>

        <input 
        placeholder="닉네임"
            name="name"
            type="name"
            {...register("name")}
        />
        <div className='mt-5' />
        <input
         placeholder="제목"
            name="title"
            type="title"
            {...register("title")}
        />
        <div className='mt-5' />
        <input
            placeholder="핸드폰번호"
            name="phoneNumber"
            type="phoneNumber"
            {...register("phoneNumber")}
        />
         <div className='mt-5' />
         <select
                  className="custom-select"
                  id="selectmethod"
                  defaultValue=""
                  name="category"
                  {...register("category")}
                >
                  <option value="" disabled>카테고리</option>
                  <option value="aaaa">추천특수목매물</option>
                  <option value="bbbb">추천조경수매물</option>
                </select>
        <div className='mt-5' />
        <textarea
            placeholder="여기에 입력하세요"
            name="story"
            rows="5" 
            cols="16"
            {...register("description")}
        />
  
        <input type="submit" disabled={loading} />
    </form>
</div>
  )
}



export default Upload

