"use client";
import { useEffect, useState, useMemo } from "react";
import YouTube from 'react-youtube';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Image from "next/image";

interface GalleryProps {
  images: string[];
}

const Gallery2 = ({ images }: GalleryProps) => {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const mainImage = useMemo(
    () =>
        images.map((image, index) => (
        <YouTube key={index}
                videoId={image}
    
                opts={{
                  width: "400",
                  height: "300",
                  playerVars: {
                    autoplay: 0, //자동재생 O
                    rel: 0, //관련 동영상 표시하지 않음 (근데 별로 쓸모 없는듯..)
                    modestbranding: 1, // 컨트롤 바에 youtube 로고를 표시하지 않음
                  },
                }}
              
                onEnd={(e:any)=>{e.target.stopVideo(0);}}      
              />
      )),
    [images],
  );


  useEffect(() => {
    if (!mainApi || !thumbnailApi) {
      return;
    }

    const handleTopSelect = () => {
      const selected = mainApi.selectedScrollSnap();
      setCurrent(selected);
      thumbnailApi.scrollTo(selected);
    };

    const handleBottomSelect = () => {
      const selected = thumbnailApi.selectedScrollSnap();
      setCurrent(selected);
      mainApi.scrollTo(selected);
    };

    mainApi.on("select", handleTopSelect);
    thumbnailApi.on("select", handleBottomSelect);

    return () => {
      mainApi.off("select", handleTopSelect);
      thumbnailApi.off("select", handleBottomSelect);
    };
  }, [mainApi, thumbnailApi]);

  const handleClick = (index: number) => {
    if (!mainApi || !thumbnailApi) {
      return;
    }
    thumbnailApi.scrollTo(index);
    mainApi.scrollTo(index);
    setCurrent(index);
  };

  return (
    <div className="w-full sm:w-auto">
      <Carousel className="flex justify-center items-center" setApi={setMainApi}>
        <CarouselContent className="w-[400px]">{mainImage}</CarouselContent>
        <CarouselPrevious className="left-20"/>
        <CarouselNext className="right-20" />
      </Carousel>
    </div>
  );
};


export default Gallery2;