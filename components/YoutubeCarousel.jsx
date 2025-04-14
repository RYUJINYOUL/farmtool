import { Playlist } from "@/types";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PlayListCard from "./PlayListCard";
import YouTube from 'react-youtube';

let slides = [
  "1G32tYloRf0"
   ,
  "jjxbNFW57kI"
   ,
  "zaFyc9rR6sE"
 ]

const YoutubeCarousel = () => {
  return (
    <div className="w-full">
      <Carousel>
        <div className="flex flex-row justify-between items-end my-2">
          <article className="flex flex-row gap-3">
              <div className="text-[34px] font-bold leading-[34px] ">
                동영상
              </div>
          </article>
          <div className="relative left-[-45px]">
            <div className="absolute bottom-[20px]">
              <CarouselPrevious className="right-2" />
              <CarouselNext className=" left-2" />
            </div>
          </div>
        </div>
        <CarouselContent className="mt-4">
          {slides?.map((playlist, index) => {
            return (
              <CarouselItem
                key={index}
                // className="min-[400px]:basis-3/4 md:basis-1/3 lg:basis-1/4 xl:basis-1/4"
                className="basis-3/4"
              >
                <YouTube
                videoId={playlist}
    
                opts={{
                  width: "100%",
                  height: "400",
                  playerVars: {
                    autoplay: 0, //자동재생 O
                    rel: 0, //관련 동영상 표시하지 않음 (근데 별로 쓸모 없는듯..)
                    modestbranding: 1, // 컨트롤 바에 youtube 로고를 표시하지 않음
                  },
                }}
              
                onEnd={(e)=>{e.target.stopVideo(0);}}      
              />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default YoutubeCarousel;
