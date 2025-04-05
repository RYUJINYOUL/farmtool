"use client";
import { useEffect, useState, useMemo } from "react";

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
  images: [{ src: string, title: string, desc: string[]}];
}

const Gallery = ({ images }: GalleryProps) => {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

   const mainImage = useMemo(
      () =>
        images.map((image, index) => (
          <CarouselItem key={index} className="relative aspect-video w-full">
            <Image
              src={image.src}
              alt={`Carousel Main Image ${index + 1}`}
              fill
              className='object-cover w-full ml-4'
            />
            {/* <div className='absolute h-[400px] top-0 bg-white opacity-10 w-full'></div>
            <div className='absolute h-[400px] top-0 bg-gradient-to-t from-white w-full'></div> */}
            <div className="absolute text-red-600 text-3xl top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {image.title}
            </div>
            {image.desc.map((description, index) => (
            <div key={index} className="absolute text-white text-1xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {description}
          </div>
           ))}
          </CarouselItem>
        )),
      [images],
    );

  const thumbnailImages = useMemo(
    () =>
      images.map((image, index) => (
        <CarouselItem
          key={index}
          className="relative aspect-video basis-1/5"
          onClick={() => handleClick(index)}
        >
          <Image
            className={`${index === current ? "border-2" : ""}`}
            src={image.src}
            width={60}
            height={60}
            alt={`Carousel Thumbnail Image ${index + 1}`}
            style={{ objectFit: "cover" }}
          />
        </CarouselItem>
      )),
    [images, current],
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
      <Carousel setApi={setMainApi}>
        <CarouselContent>{mainImage}</CarouselContent>
        {/* <div className="left-[500px]"> */}
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
         <Carousel className="absolute right-1 bottom-0 pr-2" setApi={setThumbnailApi}>
        <CarouselContent>{thumbnailImages}</CarouselContent>
      </Carousel>      
        {/* </div> */}
      </Carousel>
    </div>
  );
};


export default Gallery;