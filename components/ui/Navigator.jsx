"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'
import { FaHeart } from "react-icons/fa";
import useUIState from "@/hooks/useUIState";
import { cn } from "@/lib/utils"
import { getAuth, signOut } from 'firebase/auth';
import app from '../../firebase';
import { useSelector } from 'react-redux';
import { useDispatch } from "react-redux";
import { AiTwotoneNotification } from "react-icons/ai";
import { BsChatText } from "react-icons/bs";

function Navigator() {
    const { push } = useRouter();
    const pathname = usePathname()
    const dispatch = useDispatch();
    const auth = getAuth(app);
    const { currentUser, clearUser } = useSelector(state => state.user)
    const { homeCategory, setHomeCategory, setHeaderImageSrc } = useUIState();
    const homeCategoryList = [
         {
          label: "홈",
          src: "/",
        },
        {
          label: "안내",
          src: "/si",
        },
        {
          label: "오시는길",
          src: "/map",
        },
        {
          label: "교육일정",
          src: "/cal",
        },
          {
          label: "게시판",
          src: "/ta",
        },
    ];


    const onClickCategory = (item) => {
      if (homeCategory === item.label) {
        setHeaderImageSrc("");
        setHomeCategory(item.label);
      } else {
        setHeaderImageSrc(item.src);
        setHomeCategory(item.label);
      }
    };

      const handleLogin = () => {
       push("/login", {scroll: false}) 
    }

     const handleLogout = () => {
      signOut(auth).then(() => {
        dispatch(clearUser());
      }).catch((err) => {})
      push("/login", {scroll: false})
    }
  

  return (
    <div>
      <section className='flex flex-row pl-7 pt-4 pb-4 gap-5'>
        <div className='text-[14px] text-white items-center hover:text-[#f9f9f8]'
        onClick={
          (currentUser.uid === undefined) 
          ? handleLogin
          : 
          handleLogout
        }
        >{(currentUser.uid === undefined) ? "로그인" : "로그아웃"}</div>
        <div className='text-[14px] text-white items-center'>|</div>
        <div className='text-[14px] text-white items-center hover:text-[#f9f9f8]'
        onClick={() => {push("/register", {scroll: false})}}
        >회원가입</div>
      </section>
      <section className='flex flex-col gap-2 p-4'>
        {homeCategoryList.map((item) => {
             return (
               <div
                 onClick={() => onClickCategory(item)}
                 key={item.label}
                 className={cn(
                   "h-[38px] text-white min-w-fit px-2 flex justify-start items-center border border-transparent rounded-lg hover:bg-gray-200",
                   item.label === homeCategory &&
                     "underline underline-offset-8"
                 )}
               >
                 <div onClick={() => {push(item.src, {scroll: false})}}>{item.label}</div>
               </div>
             );
           })}
      </section>
      
    </div>
  )
}

export default Navigator
