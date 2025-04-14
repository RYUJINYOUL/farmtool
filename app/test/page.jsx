"use client"
import { getFirestore, collection, where, doc, onSnapshot, query} from "firebase/firestore";
import app from '../../firebase.js';
import React, { useEffect, useState } from 'react'



const page = async (props) => {
   const db2 = getFirestore(app);
   // eslint-disable-next-line react-hooks/rules-of-hooks
   const [message, setMessages] = useState([]);
   const key = props.searchParams.list
   const col= props.searchParams.col


     // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
       // addMessagesListener(new Map(categoryList2).get(homeCategory), reg)
       addMessagesListener(col, key)
    
       return () => {
       }
     }, [ col ])
   
   
     const addMessagesListener = async (col, key) => {
   
     const tweetsQuery = doc(db2, col, key)
        await onSnapshot(tweetsQuery, (doc) => { // <---- 
          setMessages(doc.data())
         });
     };

  return (
   

      <div className='mt-12'>{message?.name}</div>
  
    
  )
}

export default page
