
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import Link from "next/link";
import { uploadBytesResumable, getDownloadURL, ref as strRef } from 'firebase/storage';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, addDoc} from "firebase/firestore";
import app, { db, storage } from '../firebase';
import styles from "../index.module.css";
import { useRouter } from "next/navigation";

const page = () => {

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [content, setContent] = useState("");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [errors, setErrors] = useState([]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [percentage, setPercentage] = useState(0);
  
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inputOpenImageRef = useRef(null);
  
    const db2 = getFirestore(app);
    // const messagesRef = ref(db, "messages")
  
    // eslint-disable-next-line react-hooks/rules-of-hooks
    
    // eslint-disable-next-line react-hooks/rules-of-hooks    
    // const docRef = doc(collection(db, "messages", [도큐멘트명], [하위 컬렉션명]));
    // const messagesRef = doc(db2, 'users', user.uid);
  
  
  
    const handleSubmit = async (e) => {
      e.preventDefault();    
  
      if(!content) {
        setErrors(prev => prev.concat("Type Contents First"));
        return;
      }
  
      setLoading(true);
      try {
        // await set(push(child(messagesRef, currentChatRoom.id)), createMessage())
       
        doc(collection(db2, "direct", "1234", "messages")); 
        await setDoc(messagesRef, createMessage());
  
        setLoading(false);
        setContent("")
        setErrors([]);
      } catch(error) {
        setErrors(prev => prev.concat(error.message));
        setLoading(false);
        setTimeout(() => {
          setErrors([]);
        }, 5000)
      }
    } 
  
    
  
    const createMessage = (fileUrl = null) => {
      const message = {
          timestamp: serverTimestamp(),
          user: {
            //   id: currentUser.uid,
              name: currentUser.displayName,
              image: currentUser.photoURL
          }
      }
  
      if (fileUrl !== null) {
          message["image"] = fileUrl;
      } else {
          message["content"] = content;
      }
  
      return message;
  }
  
  const handleOpenImageRef = () => {
    inputOpenImageRef.current.click()
  }
  

  const handleUploadImage = (event) => {
    const file = event.target.files[0];
  
        console.log(file)
      const metadata = { contentType: file.type };
      
      const storageRef = strRef(storage, `/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
  
      console.log(uploadTask)
  
      const messagesRef = doc(collection(db2, "chatRooms", "3432", "messages")); 
  
          uploadTask.on('state_changed',
              (snapshot) => {
                  // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  console.log('Upload is ' + progress + '% done');
                  setPercentage(Math.round(process));
  
                  switch (snapshot.state) {
                      case 'paused':
                          console.log('Upload is paused');
                          break;
                      case 'running':
                          console.log('Upload is running');
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
                  // Upload completed successfully, now we can get the download URL
                  getDownloadURL(uploadTask.snapshot.ref).then( async (downloadURL) => {
                    await setDoc(messagesRef, createMessage(downloadURL));
                    setLoading(false);
  
                  });
              }
          );
  }
  
  
  const handleChange = async (event) => {

    setContent(event.target.value);
    const typingRef = doc(db2, "typing", "3223"); 
    if(event.target.value) {
      console.log(typingRef);
      await setDoc(typingRef, {
        typing: [],
        typing: arrayUnion(currentUser.displayName)
      });
    } else {
      await updateDoc(typingRef, {
        typing: arrayRemove(currentUser.displayName)
      })
    }
  }
  
  
    return (
      <div>
              <form onSubmit={handleSubmit}>
                  <textarea
                      style={{ width: '100%', height: 90, border: "0.2rem solid rgb(236, 236, 236)", borderRadius: 4 }}
                      value={content}
                      onChange={handleChange}
                  />
  
                  <div>
                    {errors.map((errorMsg, i) => <p style={{ color: 'red' }} key={i}>
                      {errorMsg}
                    </p>)}
                  </div>
  
                    <div style= {{ display: 'flex', garp: 16 }}>
                      <div style= {{ flexGrow: 1 }}> 
                          <button
                              className='message-form-button'
                              type='submit'
                              style={{ width: '100%', fontSize: 20, fontWeight: 'bold' }}
                              disabled={loading}
                          >
                              보내기
                          </button>
                      </div>
                      <div style= {{ flexGrow: 1 }}> 
                          <button
                              type='button'
                              className='message-form-button'
                              onClick={handleOpenImageRef}
                              style={{ width: '100%', fontSize: 20, fontWeight: 'bold' }}
                              disabled={loading}
                          >
                              이미지
                          </button>
                      </div>
                  </div>
              </form>
  
              <input 
                type="file"
                accept="image/jpeg, image/png"
                style={{ display: 'none' }}
                ref={inputOpenImageRef}
                onChange={handleUploadImage}
             />
          </div>
    )
  }


export default page
