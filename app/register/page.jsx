"use client"
import React, { useState } from 'react'
import Link from "next/link";
import { useForm } from 'react-hook-form';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import app, { db } from '../../firebase';
import md5 from 'md5';
import { useDispatch } from 'react-redux';
import { clearUser, setUser } from "../../store/userSlice.js";
import styles from "../../index.module.css";
import { 
  getFirestore, collection, getDocs, doc, setDoc, Timestamp, 
  getDoc, deleteDoc, updateDoc, serverTimestamp, query, 
  orderBy} from "firebase/firestore";

const RegisterPage = () => {
    const auth = getAuth(app)
    const [loading, setLoading] = useState(false);
    const [errorFromSubmit, setErrorFromSubmit] = useState("");
    const dispatch = useDispatch();
  
    const { register, watch, formState: { errors }, handleSubmit } = useForm();
    const db2 = getFirestore(app);
  
    const onSubmit = async (data) => {
      try{
        setLoading(true);
        const createdUser = await createUserWithEmailAndPassword(auth, data.email, data.password)
  
        await updateProfile(auth.currentUser, {
          displayName: data.name,
          photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
        }) 
        
      //   set(ref(db, `users/${createdUser.user.uid}`), {
      //     name: createdUser.user.displayName,
      //     image: createdUser.user.photoURL
      // })
  
  
      const newTodoRef = doc(db2, "users", createdUser.user.uid);   //ref
      // const newTodoRef = doc(collection(db, "todos")); 
    
      const newTodoData = {
        name: createdUser.user.displayName,
        image: createdUser.user.photoURL,
        liked: []
      }
      
      await setDoc(newTodoRef, newTodoData);
  
      const userData = {
        uid: createdUser.user.uid,
        displayName: createdUser.user.displayName,
        photoURL: createdUser.user.photoURL
      }
  
      dispatch(setUser(userData));
  
      } catch (error) {
        setErrorFromSubmit(error.message);
        setTimeout(() => {
          setErrorFromSubmit("");
      }, 3000);
     } finally {
      setLoading(false);
     }
    }
  
    return (
      <div className={styles.authwrapper}>
        <div style={{ textAlign: 'center' }}>
          <h3>Register</h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor='email'>Email</label>
          <input
             name='email'
             type='email'
             id='email'
             {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
             />
              {errors.email && <p>This email field is required</p>}
  
          <label htmlFor='name'>Name</label>
          <input
             name='text'
             type='name'
             id='name'
             {...register("name", { required: true, maxLength: 10 })}
             />
             {errors.name && errors.name.type === "required" && <p>This name field is required</p>}
             {errors.name && errors.name.type === "maxLength" && <p>Your input exceed maximum length</p>}
  
          <label htmlFor='password'>Password</label>
          <input
             name='password'
             type='password'
             id='password'
             {...register("password", { required: true, minLength: 6 })}
                  />
                  {errors.password && errors.password.type === "required" && <p>This password field is required</p>}
                  {errors.password && errors.password.type === "minLength" && <p>Password must have at least 6 characters</p>}
  
          {errorFromSubmit && 
          <p>{errorFromSubmit}</p>
          }
  
          <input type='submit' disabled={loading} />
          <Link href={'/login'} style={{ color: 'gray', textDecoration: 'none'}}>이미 아이디가 있다면...</Link>  
        </form>
      </div>
  )
}

export default RegisterPage
