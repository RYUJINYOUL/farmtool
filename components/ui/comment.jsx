"use client"
import React, { useEffect,useState } from 'react'
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, getDocs } from "firebase/firestore";
import app, { storage } from '../../firebase';
import { useSelector } from 'react-redux';
import { useRouter } from "next/navigation";
import { ref as strRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import useUIState from "@/hooks/useUIState";


const Comment = ({ id, col, path, urls }) => {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD');
  const [message, setMessages] = useState([]);
  const { currentUser } = useSelector(state => state.user)
  const db2 = getFirestore(app);
  const { push } = useRouter();
  const { homeCategory, setHomeCategory, setHeaderImageSrc } = useUIState();



  useEffect(() => {
      addMessagesListener()
   
      return () => {
      }
    }, [])


  
  
    const addMessagesListener = async () => {
    
      const tweetsQuery = query(collection(db2, col, id, "comments"), orderBy("createdDate", "desc"))
  
        await onSnapshot(tweetsQuery, (snapshot) => { // <---- 
          const tweetList = snapshot.docs.map((doc) => {
            const { name, description, createdDate } = doc.data();
            const id = doc.id
            const date = doc.data().createdDate.toDate();
            return { name, description, date, id };
          });
            setMessages(tweetList);
        });
    };



  const deleteDocs = async (ids) => {
    if (window.confirm("삭제 하시겠습니까??")) {
         await deleteDoc(doc(db2, col, id, "comments", ids))
         alert("삭제되었습니다.");
        } else {
         alert("취소합니다.");
        }
    };

  
     
    




  const onClickUpLoadButton = async (data) => {  
     await addDoc(collection(db2, col, id, "comments"),
         {
           "name": currentUser.name ?? "익명",
           "description": data.description,
           "createdDate": new Date(),
         })
   
         location.reload();
         setHomeCategory(item);
      }


  const handleBulkDelete = async () => {
  const extractStoragePath = (url) => {
    try {
      const decoded = decodeURIComponent(url);
      const match = decoded.match(/\/o\/(.+?)\?/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const deletePromises = urls.map((url) => {
    const path = extractStoragePath(url);
    console.log(path)
    if (!path) return null;
    const fileRef = strRef(storage, path);
    return deleteObject(fileRef)
      .then(() => console.log(`Deleted: ${path}`))
      .catch((err) => console.error(`Error deleting ${path}`, err));
  });

  // wait for all deletions to finish
  await Promise.all(deletePromises);
};    

    
    
  const deleteCol = async (ids) => {
      if (window.confirm("삭제 하시겠습니까??")) {
          const items = []
          const subcols = query(collection(db2, col, ids, "comments"))
          const querySnapshot = await getDocs(subcols)
          querySnapshot.forEach((doc) => {
                items.push(doc)
              });
      for(var i = 0; i < items.length; i++) {
        await deleteDoc(doc(db2, col, ids, "comments", items[i].id))
          }
          
          await deleteDoc(doc(db2, col, ids))
            alert("삭제되었습니다.");
            push(path)

          await handleBulkDelete()
            
      } else {
            alert("취소합니다.");
            }
        };   
    
  
  
  return (
 
    <div>
      <section className="flex gap-[25px] flex-col justify-center items-center ">
        <div className='flex flex-col lg:w-[1100px] w-full'>
      
            <div className='flex flex-row items-center justify-between lg:w-[1100px] w-full'>
               <div className='font-semibold text-[20px]'>답변</div>
               <div className='flex flex-row items-center gap-3'>
                <button className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200' onClick={()=> {push(path)}}>목록</button>
                <button className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200' onClick={()=> {deleteCol(id)}}>삭제</button>
               </div>
            </div>   
 
          <hr className="mt-1 h-0.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50"/>
        </div>   
      </section>    

      <section className='flex justify-center items-center w-full'>  
        <div className='flex flex-col lg:w-[1100px] p-5 w-full bg-[#fafafa]'>


{message.map(({ name, description, date, id }, index) => {

    return (
        
        <div key={index}>
        <div className='flex md:flex-row flex-col md:justify-between items-start lg:w-[1100px] w-full'>
      
        <div className='lg:text-end text-center text-[13px]'>{name} | {timeFromNow(date)}</div>
       </div>

        <div className='mt-4' />
        <div className='text-[15px] text-[#666] leading-7 text-start'>{description}</div>
        <button className='mb-10 text-[12px] text-[#666] p-0.5 rounded-sm border border-gray-200' onClick={()=> {deleteDocs(id)}}>삭제</button>
       </div>
           
         );
        })} 

        <div className='mt-3'/>

        <form className='flex flex-col md:p-0 pr-10 w-full items-center justify-center' 
        onSubmit={handleSubmit(onClickUpLoadButton)}>
            
           <div className='flex flex-row md:w-[1100px] w-full items-start justify-center'>
            <textarea
                className="w-9/11 px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200
                 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                placeholder="장문 입력"
                name="description"
                rows="3" 
                cols="16"
                    {...register("description")}
              />     
            <div className='mt-5'/>  

            <div className='w-1/11 h-[95px] flex item-center'>
                <button
                    type="submit"
                    onClick={() => {
                      // if(!message.length){
                      //   reset
                      // }
                     }
                    }
                    className=" text-white px-8 py-4 rounded-lg bg-gray-500 border border-gray-200 
                     md:text-[18px] text-center">
                    등록
                </button>
            </div>
            </div> 
        </form>
        </div>
      </section>
       
    </div>
     
  )
}


export default Comment
