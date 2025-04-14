"use client";
import Image from "next/image";
import React from "react";
import { getRandomElementFromArray } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MdMoreVert } from "react-icons/md";
import { FiPlay } from "react-icons/fi";
import IconButton from "./elements/IconButton";
import Link from 'next/link'


const PlayListCard2 = ({ playlist = [], collection = "" } = {}) => {

  const { push } = useRouter();
  const { 
    name, description, url, 
    title, address, phoneNumber, userKey, category,
    createdDate, NumOfLikes, geoFirePoint, id
  } 
  = playlist ?? [];

  const onClickCard = (id) => {
    push(`/test?list=${id}&col=${collection}`);
    // push(`/test/?name=${id}collection=${collection}`);
  };
  

  return (
    <article className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {playlist?.map((playlist, index) => {
        return (
          <div key={index}>
        <section onClick={()=>onClickCard(playlist.id)} className=" relative h-[136px] ">
        <Image
          src={
            playlist?.url[0] ||
            "https://www.redwoodhikes.com/JedSmith/JedSmith1.jpg"
          }
          fill={true}
          alt="thumbnail"
          className="object-fill rounded-md"
        />
        <div className="hidden relative group-hover:block bg-gradient-to-b from-[rgba(0,0,0,0.7)] top-0 w-full h-[136px] ">
          <div className=" absolute top-2 right-4">
            <IconButton icon={<MdMoreVert size={20} />} />
          </div>
        </div>
      </section>
      <section className="mt-2">
        <div>{playlist.name}</div>
        <div className="text-neutral-500">{`${playlist.channel} - 트랙 ${playlist.channelId}개`}</div>
      </section>
      </div>
        )
      })}
    </article>
  );
};

export default PlayListCard2;
