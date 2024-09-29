"use client";
import Image from "next/image";
import React from "react";
import { getRandomElementFromArray } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MdMoreVert } from "react-icons/md";
import { FiPlay } from "react-icons/fi";
import IconButton from "./elements/IconButton";


const PlayListCard = ({ playlist = [] }) => {
 
  const { push } = useRouter();
  const { 
    name="", 
    channelId, 
    channel = "", 
    src = "", 
    imageSrc = ""
  } 
  = playlist ?? [];

  // const songListLen = songList?.length;
  // const imageSrc = getRandomElementFromArray(songList)?.imageSrc;

  const onClickCard = () => {
    if (id) push(`/particular?list=${id}`);
  };

  const onClickPlay = (e) => {
 
  };

  return (
    <article className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {playlist?.map((playlist, index) => {
        return (
          <div key={index}>
        <section onClick={onClickCard} className=" relative h-[136px] ">
        <Image
          src={
            playlist.imageSrc ||
            "https://www.redwoodhikes.com/JedSmith/JedSmith1.jpg"
          }
          fill={true}
          alt="thumbnail"
          className="object-cover rounded-md"
        />
        <div className="hidden relative group-hover:block bg-gradient-to-b from-[rgba(0,0,0,0.7)] top-0 w-full h-[136px] ">
          <div className=" absolute top-2 right-4">
            <IconButton icon={<MdMoreVert size={20} />} />
          </div>
          <div
            onClick={onClickPlay}
            className=" absolute bottom-4 right-4 flex items-center justify-center
           transform-gpu transition-transform hover:scale-110 
           bg-[rgba(0,0,0,0.7)] w-[45px] h-[45px] rounded-full
           hover:bg-[rgba(0,0,0,0.9)] pl-[1.5px]
           "
          >
            <FiPlay size={22} color="red" />
          </div>
        </div>
      </section>
      <section className="mt-2">
        <div>{playlist.name}</div>
        <div className="text-neutral-500">{`${channel} - 트랙 ${channelId}개`}</div>
      </section>
      </div>
        )
      })}
    </article>
  );
};

export default PlayListCard;
