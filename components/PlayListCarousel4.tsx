
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PlayListCard4 from "./PlayListCard4";

interface PlayListCarouselProps {
  playlistArray?:[];
}

const PlayListCarousel4: React.FC<PlayListCarouselProps> = ({
  playlistArray,
}) => {
  return (
    <div className="w-full">
      <Carousel>
        <CarouselContent className="mt-4">
          {playlistArray?.map((playlist, index) => {
            return (
              <CarouselItem
                key={index}
                // className="min-[400px]:basis-3/4 md:basis-1/3 lg:basis-1/4 xl:basis-1/4"
                className="md:basis-3/5 basis-5/6"
              >
                <PlayListCard4 playlist={playlist} />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default PlayListCarousel4;
