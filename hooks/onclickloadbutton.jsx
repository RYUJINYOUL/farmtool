"use client"
import React, { useRef, useState, useEffect } from 'react'
import app, { db, storage } from '../firebase';
import { getFirestore, doc, setDoc } from "firebase/firestore";



export const onClickUpLoadButton = async (imageUrl, data) => {  
    const db2 = getFirestore(app);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [image, setImage] = useState([]);

    setImage((prev) => [...prev, {
      id : i++,
      url : imageUrl
    }])
    // console.log(image)

    // if(imgs.length > 1){
    //   console.log(imgs)
    // }
   

    const post = await setDoc(doc(db2, `aaaa`, data.name),
      {
        "name": data.name,
        "description": data.description,
        "url": image,
      })

      push("/constructure");
  }