"use client";
import Image from "next/image";
import React from "react";
import { getRandomElementFromArray } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MdMoreVert } from "react-icons/md";
import { FiPlay } from "react-icons/fi";
import IconButton from "./elements/IconButton";
import Link from 'next/link'


const PlayListCard4 = ({ playlist = [], collection = "" } = {}) => {

  const { push } = useRouter();
  const { 
    name, description, url, 
    title, address, phoneNumber, userKey, category,
    createdDate, NumOfLikes, geoFirePoint, id
  } 
  = playlist ?? [];

  const onClickCard = (id) => {
    push(`/playlist?list=${id}&col=${collection}`);
    // push(`/test/?name=${id}collection=${collection}`);
  };
  

  return (
    <article className="">
    <section className="relative h-[350px]">
      <Image
        src={
          playlist ||
          ""
        }
        fill={true}
        alt="thumbnail"
        className="object-cover rounded-md border-2"
      />
  
    </section>

  </article>
);
};

export default PlayListCard4;
