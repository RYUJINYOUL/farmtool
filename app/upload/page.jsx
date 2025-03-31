"use client"
import React, { useRef, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { uploadBytesResumable, getDownloadURL, ref as strRef } from 'firebase/storage';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, addDoc} from "firebase/firestore";
import app, { db, storage } from '../../firebase';
import styles from "../../index.module.css";
import { useRouter } from "next/navigation";
import ImageUpload from '@/components/uploadImage.js'

const page = () => {

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [wnloadURL, setdownloadURL] = useState("");

  const db2 = getFirestore(app);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { register, handleSubmit, formState: { errors } } = useForm();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [files, setFiles] = useState([])
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { push } = useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [percentage, setPercentage] = useState(0);
    // eslint-disable-next-line react-hooks/rules-of-hooks
  const [image, setImage] = useState([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inputOpenImageRef = useRef(null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [images, setImages] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isDragging, setIsDragging] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
  const fileInputRef = useRef(null);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      // let setdownloadURL = [];
  let i = 0
 

  // useEffect(() => {
  //   console.log(`useffect ${image}`)

  // },[image])

 
  const onClickUpLoadButton = async (data) => {  
    await setDoc(doc(db2, `aaaa`, data.name),
      {
        "name": data.name,
        "description": data.description,
        "url": image,
      })

      push("/constructure");
  }
  

  async function uploadUrl() {
   images.map((file) => {
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
      if (files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.split('/')[0] !== 'image') continue;
        if (!images.some((e)=> e.name === files[i].name)) {
          setImages((prevImages) => [
            ...prevImages,
           {
            name: files[i].name,
            url: URL.createObjectURL(files[i]),
           },
        ]);
      }
      }
    }
  
    function deleteImage(index) {
      setImages((prevImages) => 
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
  
    function uploadImage(){
      uploadUrl()
      alert("이미지가 업로드 되었습니다.")
    }


  
  

  return (

    <div className={styles.authwrapper}>
        <div className="card">
      <div className='top'>
        <p>Drag & Drop image uploading</p>
      </div>
      <div className='drag-area' onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {isDragging ? (
          <span className='select'>Drop images here</span>
        ) : (
         <>
          Drag & Drop image here or {" "} 
         <span className='select' role='button' onClick={selectFiles}>
          Browse
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
        <button type='button' onClick={uploadImage}>
          이미지업로드
        </button>
    </div>
            
    <div className='p-10' style={{ textAlign: 'center' }}>
      
        <h3>상품등록</h3>
    </div>
    <form onSubmit={handleSubmit(onClickUpLoadButton)}>
        <label>name</label>
        <input
            name="name"
            type="name"
            {...register("name")}
        />

        <label>description</label>
        <input
            name="description"
            type="description"
            {...register("description")}
        />

  
  
        <input type="submit" disabled={loading} />
    </form>
</div>
  )
}



export default page
