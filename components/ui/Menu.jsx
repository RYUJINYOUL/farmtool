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
      label: "건설업",
      src: "/con",
    },
    {
      label: "건설장비",
      src: "/jang",
    },
    {
      label: "공사자재",
      src: "/mat",
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
      src: "/saram",
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
          onClick={() => onClickCategory(item)}
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
          {item.label}
        </div>
      ))}
      <div className="flex items-center pl-4 sticky right-1">
        {currentUser?.uid ? (
          <FiLogOut
            size={22}
            onClick={handleLogout}
            className={cn("cursor-pointer", total.total && "md:text-black text-white", pathname !== "/"&&"lg:text-black")}
          />
        ) : (
          <FiLogIn
            size={22}
            onClick={() => push('/login')}
            className={cn("cursor-pointer", total.total && "md:text-black text-white", pathname !== "/"&&"lg:text-black")}
          />
        )}
      </div>
    </nav>
  );
}


