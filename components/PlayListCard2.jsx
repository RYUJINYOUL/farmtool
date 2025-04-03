"use client";
import Image from "next/image";
import React from "react";
import { getRandomElementFromArray } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MdMoreVert } from "react-icons/md";
import { FiPlay } from "react-icons/fi";
import IconButton from "./elements/IconButton";


const PlayListCard2 = ({ playlist = [], collection = category } = {}) => {
  console.log(collection);
 
  const { push } = useRouter();
  const { 
    name="", 
    channelId, 
    channel = "", 
    src = "", 
    imageSrc = ""
  } 
  = playlist ?? [];

  const onClickCard = (id) => {
    push(`/playlist?list=${id}`);
  };

  return (
    <article className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {playlist?.map((playlist, index) => {
        return (
          <div key={index}>
        <section onClick={()=>onClickCard(playlist.channelId)} className=" relative h-[136px] ">
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

export default PlayListCard2;
