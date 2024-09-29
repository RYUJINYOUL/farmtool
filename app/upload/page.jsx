"use client"
import React from 'react'
import { getFirestore, collection, doc, setDoc, onSnapshot, query, addDoc} from "firebase/firestore";
import app from '../../firebase';

const page = () => {
  const db2 = getFirestore(app);

  const onClickUpLoadButton = async () => {
    
    await setDoc(doc(db2, `aaaa`, "ㄴㄴㄴㄴ"),
      {
        "name": "ㅇㅇㅇㅇㅇ",
        "description": "널 사랑한 한 슬픔 영혼이 여기 있었다는 걸"
      })
  }

  return (
    <button onClick={onClickUpLoadButton}>
      무료상품등록
    </button>
  )
}

export default page
