"use client"
import React, { useRef, useState, useEffect } from "react";
import useUIState from "@/hooks/useUIState";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { getAuth, signOut } from 'firebase/auth';
import app from '../../firebase';
import { clearUser } from '../../store/userSlice';
import { FiLogIn, FiLogOut } from 'react-icons/fi';
import { RiKakaoTalkFill, RiUser3Line } from "react-icons/ri";

const scrollMap = {
  // "/con": [0, 0],
  // "/tree": [50, 0],
  // "/sisul": [100, 0],
  // "/jang": [150, 0],
  //  "/nara": [200, 0],
};

export default function Menu(props) {
  const { push, refresh } = useRouter();
  const pathname = usePathname();
  const { homeCategory, setHomeCategory, setHeaderImageSrc, headerImageSrc } = useUIState();
  const previousSrcRef = useRef(null);
  const dispatch = useDispatch();
  const auth = getAuth(app);
  const currentUser = useSelector((state) => state.user.currentUser);

  let total = props;
  const homeCategoryList = [
   { 
      label: "카톡상담", 
      src: "http://pf.kakao.com/_zUZFG/chat",
      icon: RiKakaoTalkFill,
      iconSize: 26,
      isExternal: true
    },
    { 
      label: "내정보", 
      src: "/myinfo",
      icon: RiUser3Line,
      iconSize: 20
    },
  ];

  const onClickCategory = (item) => {
    if (homeCategory === item.label) {
      setHeaderImageSrc("");
      setHomeCategory(item.label);
    } else {
      setHeaderImageSrc(item.src);
      setHomeCategory(item.label);
      push(item.src, { scroll: false });
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        dispatch(clearUser());
        refresh();
      })
      .catch((err) => {
        console.error('로그아웃 에러:', err);
      });
  };

  useEffect(() => {
    const slider = document.getElementById("nav");
    if (!slider) return;
    const currentCoords = scrollMap[headerImageSrc];
    if (!currentCoords) return;
    const [targetX] = currentCoords;
    const prevSrc = previousSrcRef.current;
    if (!prevSrc || prevSrc === headerImageSrc) {
      slider.scrollTo({ left: targetX });
    }
    previousSrcRef.current = headerImageSrc;
  }, [headerImageSrc]);

  return (
    <nav id="nav" className="flex items-center w-full+10 md:m-0 md:px-60 ml-5 pr-4 md:pr-0 overflow-x-auto">
      {homeCategoryList.map((item, i) => (
        <div
          onClick={() => item.isExternal ? window.open(item.src, '_blank', 'noopener,noreferrer') : onClickCategory(item)}
          key={item.label}
          id={i}
          className={cn(
            "md:h-[62px] h-[55px] md:text-[16px] text-[15px] text-black min-w-fit px-2 flex justify-center items-center cursor-pointer",
            total.total && "md:text-black text-[#ffffff80]",
            pathname !== "/" && "lg:text-black",
            item.label === homeCategory && "underline underline-offset-8 md:text-[17px] text-[15px] text-black font-medium",
            pathname === "/" && total.total && "lg:text-black"
          )}
        >
          {item.icon ? (
            <item.icon size={item.iconSize} className={cn(
              "text-gray-700",
              total.total && "md:text-black text-[#ffffff80]",
              pathname !== "/" && "lg:text-black"
            )} />
          ) : (
            item.label
          )}
        </div>
      ))}
      <div className="flex items-center pl-4 sticky right-1">
        <button
          onClick={currentUser?.uid ? handleLogout : () => push('/login')}
          className={cn(
            "text-[13px] cursor-pointer px-3 py-1.5 rounded-md transition-colors",
            "bg-green-600 hover:bg-green-700 text-white font-medium"
          )}
        >
          {currentUser?.uid ? '로그아웃' : '로그인'}
        </button>
      </div>
    </nav>
  );
}


