"use client"
import React, { useRef } from "react"
import { useState, useEffect } from 'react'
import useUIState5 from "@/hooks/useUIState5";
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'



export default function Menu5(props) {
  const { push } = useRouter();
  const { homeCategory5, setHomeCategory5, setheaderImageSrc5, headerImageSrc5} = useUIState5();
  let total = props
  const homeCategoryList = [
       {
      label: "포크레인",
      src: "/jang/poc",
    },
    {
      label: "지게차",
      src: "/jang/fork",
    },
    {
      label: "고소작업차",
      src: "/jang/sky",
    },
     {
      label: "폐기물업체",
      src: "/jang/waste",
    },
    {
      label: "기타",
      src: "/jang/etc",
    },
  ];

 

  const onClickCategory = (item) => {
    if (homeCategory5 === item.label) {
      setHomeCategory5("");
      setheaderImageSrc5(item.label);
    } else {
      setheaderImageSrc5(item.src);
      setHomeCategory5(item.label);
      push(item.src, {scroll: false})
    }
  };

  useEffect(() => {
    slideRight()

}, [headerImageSrc5]);





const slideRight = () => {
  var slider = document.getElementById('nav2');
  // slider.scroll(100, 400)
  // console.log(slider.offsetWidth)
  // if (headerImageSrc === "/jang/reser") {
  //   slider.scroll(100, 200)
  // }
  // if (headerImageSrc === "/jang/pro") {
  //   slider.scroll(200, 400)
  // }
  // if (headerImageSrc === "/jang/jun") {
  //   slider.scroll(300, 500)
  // }
  // if (headerImageSrc === "/jang/gyu") {
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
            item.label === homeCategory5 &&
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


