"use client"
import { useRouter } from 'next/navigation'
import { useDispatch } from "react-redux";
import React from 'react'
import { useSelector } from 'react-redux';
import useUIState from "@/hooks/useUIState";
import { cn } from "@/lib/utils"
import { getAuth, signOut } from 'firebase/auth';
import app from '../../firebase';

function Navigator() {
    const { push } = useRouter();
    const dispatch = useDispatch();
    const auth = getAuth(app);
    const { currentUser, clearUser } = useSelector(state => state.user)
    const { homeCategory, setHomeCategory, setHeaderImageSrc } = useUIState();
    const homeCategoryList = [
     {
      label: "건설업",
      src: "/construction",
    },
    {
      label: "건설장비",
      src: "/equipment",
    },
    {
      label: "건설자재",
      src: "/materials",
    },
    {
      label: "인허가",
      src: "/permit",
    },
    {
      label: "나라장터낙찰",
      src: "/nara",
    },
    {
      label: "구인구직",
      src: "/job",
    },
    {
      label: "전문인력",
      src: "/professionals",
    },
     {
      label: "내정보",
      src: "/myinfo",
    },
    ];
    const onClickCategory = (item) => {
      if (homeCategory === item.label) {
        setHeaderImageSrc("");
        setHomeCategory(item.label);
      } else {
        setHeaderImageSrc(item.src);
        setHomeCategory(item.label);
        console.log(item.label)
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
        <div className='text-[14px] text-black items-center hover:text-[#f9f9f8]'
        onClick={
          (currentUser.uid === undefined) 
          ? handleLogin
          : 
          handleLogout
        }
        >{(currentUser.uid === undefined) ? "로그인" : "로그아웃"}</div>
        <div className='text-[14px] text-black items-center'>|</div>
        <div className='text-[14px] text-black items-center hover:text-[#f9f9f8]'
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
                   "h-[38px] text-black min-w-fit px-2 flex justify-start items-center border border-transparent rounded-lg hover:bg-gray-200",
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
