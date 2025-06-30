"use client"
import React, { useRef } from "react"
import { useState, useEffect } from 'react'
import useUIState4 from "@/hooks/useUIState4";
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'



export default function Menu4(props) {
  const { push } = useRouter();
  const { homeCategory4, setHomeCategory4, setheaderImageSrc4, headerImageSrc4} = useUIState4();
  let total = props
  const homeCategoryList = [
       {
      label: "벤치",
      src: "/sisul/bench",
    },
    {
      label: "놀이터",
      src: "/sisul/playground",
    },
    {
      label: "운동장",
      src: "/sisul/stadium",
    },
     {
      label: "기타",
      src: "/sisul/etc",
    },
  ];

 

  const onClickCategory = (item) => {
    if (homeCategory4 === item.label) {
      setheaderImageSrc4("");
      setHomeCategory4(item.label);
    } else {
      setheaderImageSrc4(item.src);
      setHomeCategory4(item.label);
      push(item.src, {scroll: false})
    }
  };

  useEffect(() => {
    slideRight()

}, [headerImageSrc4]);





const slideRight = () => {
  var slider = document.getElementById('nav2');
  // slider.scroll(100, 400)
  // console.log(slider.offsetWidth)
  // if (headerImageSrc === "/sisul/reser") {
  //   slider.scroll(100, 200)
  // }
  // if (headerImageSrc === "/sisul/pro") {
  //   slider.scroll(200, 400)
  // }
  // if (headerImageSrc === "/sisul/jun") {
  //   slider.scroll(300, 500)
  // }
  // if (headerImageSrc === "/sisul/gyu") {
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
            item.label === homeCategory4 &&
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


