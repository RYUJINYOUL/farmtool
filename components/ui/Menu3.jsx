"use client"
import React, { useRef } from "react"
import { useState, useEffect } from 'react'
import useUIState3 from "@/hooks/useUIState3";
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'



export default function Menu3(props) {
  const { push } = useRouter();
  const { homeCategory3, setHomeCategory3, setHeaderImageSrc3, headerImageSrc3} = useUIState3();
  let total = props
  const homeCategoryList = [
       {
      label: "특수목",
      src: "/tree/unique",
    },
    {
      label: "조경수",
      src: "/tree/land",
    },
    {
      label: "묘목",
      src: "/tree/sapling",
    },
     {
      label: "기타",
      src: "/tree/etc",
    },
  ];

 

  const onClickCategory = (item) => {
    if (homeCategory3 === item.label) {
      setHeaderImageSrc3("");
      setHomeCategory3(item.label);
    } else {
      setHeaderImageSrc3(item.src);
      setHomeCategory3(item.label);
      push(item.src, {scroll: false})
    }
  };

  useEffect(() => {
    slideRight()

}, [headerImageSrc3]);





const slideRight = () => {
  var slider = document.getElementById('nav2');
  // slider.scroll(100, 400)
  // console.log(slider.offsetWidth)
  // if (headerImageSrc === "/tree/reser") {
  //   slider.scroll(100, 200)
  // }
  // if (headerImageSrc === "/tree/pro") {
  //   slider.scroll(200, 400)
  // }
  // if (headerImageSrc === "/tree/jun") {
  //   slider.scroll(300, 500)
  // }
  // if (headerImageSrc === "/tree/gyu") {
  //   slider.scroll(500, 600)
  // }
};
  
  return (
    <nav id="nav2" className="md:m-0 md:px-100 ml-5 w-full+10 flex gap-2 overflow-x-auto md:pr-0 pr-4">
    {homeCategoryList.map((item, i) => {
      return (
        <div
          onClick={() => onClickCategory(item)}
          key={item.label}
          id={i}
          className={cn(
            "h-[38px] md:text-[15px] text-[14px] text-white min-w-fit px-2 pt-2 flex justify-center items-center",
            total.total&&"md:text-black text-[#aaa]",
            item.label === homeCategory3 &&
              "font-semibold text-black"
          )}
        >
            {item.label}
        </div>
        
      );
    })}
  </nav>
  )
}


