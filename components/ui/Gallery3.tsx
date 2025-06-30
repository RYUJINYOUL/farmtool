"use client";
import { useEffect, useState, useMemo } from "react";
import { Phone, MapPin, Share2, MessageCircle, MessageSquare } from "lucide-react";
import useUIState from "@/hooks/useUIState";
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselApi,
// } from "./ui/carousel";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface GalleryProps {
  images: string[];
}

const Gallery3 = () => {
 
  const [current, setCurrent] = useState(0);
  const { homeCategory, setHomeCategory, setHeaderImageSrc, headerImageSrc} = useUIState();
  const { push } = useRouter();
  


  const onClickCategory = (item:any, src:any) => {
      setHomeCategory(item);
      push(src, {scroll: false})
  };
 

  return (
      <div className="w-full sm:w-auto">
      <div className='relative w-full md:h-[300px] h-[400px]'>
       <Image
          alt="mediaItem"
          className="object-cover md:hidden"
          // width={530}
          // height={353}
          fill
          src={"/Image/mosa6EVPwf.jpeg"}
        /> 
        <div className='md:hidden absolute md:h-[300px] h-[400px] top-0 bg-black md:opacity-40 opacity-60 w-full'></div>

          <div className="absolute top-3/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center px-4">

           

              <div className="mt-2"></div>

               <div className="flex flex-row w-full md:w-[1100px]">
                <div className="md:w-2/10 flex flex-col">
                   <img
                      src="/Image/mainmiddle.jpeg"
                      alt="바른염색"
                      className="w-[90px] h-[90px] md:w-[80px] md:h-[80px] md:text-start rounded-full md:mx-0 mx-auto mb-4"
                    />
                   <div className="text-[22px] md:text-[15px] md:text-start w-[300px] font-bold md:text-[#333333] text-white">
                    울산 건설 기초안전보건교육장 
                   </div>
                  <p className="text-[15px] md:text-[13px] md:text-[#999999] md:text-start text-white">
                    노동부지정 안전보건교육기관 T. 052 988 0070
                  </p>
                </div>
                 <div className="md:divide-x-1 md:bg-[#bcbbbb] bg-white border-t-0 opacity-100 md:w-[0.1px] dark:opacity-50"/>
                
                <div className="flex flex-col items-start justify-center md:w-[1100px]">
                  <div className="md:w-8/10 text-[18px] text-[#333333] md:block hidden text-start p-10">
                    울산 남구 달동 롯데마트 사거리에 위치. ☎ 052-988-0070 / 010-4555-0068
                  </div>
                </div>
              </div>
            

               <div className="md:hidden grid grid-cols-4 p-4 text-center">
                  <a href="tel:052-988-0070" className="flex flex-col items-center hover:text-blue-400">
                     <button className="bg-[#9fb751] mb-1 flex items-center justify-center w-[44px] h-[44px] xs:w-11 xs:h-11 text-white rounded-full shadow-lg transition-transform hover:scale-110" 
                    >
                    <Phone className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-[13px] text-[rgba(255,255,255,.7)]">전화문의</span>
                  </a>

                  <a onClick={() => {onClickCategory('오시는길', '/map')}} rel="noopener noreferrer" className="flex flex-col items-center hover:text-blue-400">
                     <button className="bg-[#9fb751] mb-1 flex items-center justify-center w-[44px] h-[44px] xs:w-11 xs:h-11 text-white rounded-full shadow-lg transition-transform hover:scale-110" 
                    >
                    <MapPin className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-[13px] text-[rgba(255,255,255,.7)]">오시는길</span>
                  </a>

                  <a onClick={() => {onClickCategory('교육일정', '/cal')}} rel="noopener noreferrer" className="flex flex-col items-center hover:text-blue-400">
                     <button className="bg-[#9fb751] mb-1 flex items-center justify-center w-[44px] h-[44px] xs:w-11 xs:h-11 text-white rounded-full shadow-lg transition-transform hover:scale-110" 
                    >
                    <MapPin className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-[13px] text-[rgba(255,255,255,.7)]">교육일정</span>
                  </a>

                  {/* <a target="_blank" rel="noopener noreferrer" className="flex flex-col items-center hover:text-blue-400">
                    <button className="bg-[#888888] mb-1 flex items-center justify-center w-[44px] h-[44px] xs:w-11 xs:h-11 text-white rounded-full shadow-lg transition-transform hover:scale-110" 
                    onClick={()=>{
                    navigator.share({
                      title: "도어락 비밀번호 분실 해제",
                      url: "https://opiopi76.vercel.app"
                    })
                  }}>
                    <Share2 className="w-4 h-4" />
                  </button>
                    <span className="text-[13px] text-[rgba(255,255,255,.7)]">공유</span>
                  </a> */}

                  <a href="https://open.kakao.com/o/sDhjKjgb" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center hover:text-blue-400">
                    <button className="bg-[#9fb751] mb-1 flex items-center justify-center w-[44px] h-[44px] xs:w-11 xs:h-11 text-white rounded-full shadow-lg transition-transform hover:scale-110" 
                    >
                    <MessageCircle className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-[13px] text-[rgba(255,255,255,.7)]">카톡문의</span>
                  </a>
                </div>
            </div>
        </div>
    </div>
  );
};


export default Gallery3;