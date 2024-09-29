"use client"
import React, { useEffect, useState } from 'react'
import PagePadding from '@/components/pagePadding'
import Category from '@/components/Category'
import PlayListCarousel from '@/components/PlayListCarousel'
import UserIcon from '@/components/UserIcon'
import PlayListCard2 from '@/components/PlayListCard2'
import { getRandomElementFromArray } from '@/lib/utils'
import { dummyPlaylistArray2 } from '@/lib/dummyData'
import { dummyAllSongList } from '@/lib/dummyData'
import app from '../../firebase.js';
import useUIState from '@/hooks/useUIState';
import { getFirestore, collection, where, setDoc, onSnapshot, query} from "firebase/firestore";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AiFillCaretDown } from "react-icons/ai";
import { FiCheck } from "react-icons/fi";



const page = () => {
  const db2 = getFirestore(app);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [message, setMessages] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { homeCategory, setHomeCategory } = useUIState();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [reg, setReg] = useState("전체");


  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    addMessagesListener(homeCategory, reg)
   
    return () => {
    }
  }, [ homeCategory, reg ])


  const addMessagesListener = async (homeCategory, reg) => {
    const tweetsQuery = (reg === "전체")
    ? query(collection(db2, homeCategory))
    : query(collection(db2, homeCategory), where("지역", "==", reg))
    await onSnapshot(tweetsQuery, (snapshot) => { // <---- 
      const tweetList = snapshot.docs.map((doc) => {
        const { name, channelId, channel, src, imageSrc, 지역 } = doc.data();
        return {
          name, channelId, channel, src, imageSrc, 지역
        };
      });
        setMessages(tweetList);
    });
  };

  const categoryList = [
    "추천특수목매물", "추천조경수매물", "조경수매물", "묘목매물"
  ]

  const categoryList2 = [
    ["추천특수목매물", "aaaa"],
    ["추천조경수매물", "bbbb"],
    ["조경수매물", "cccc"],
    ["묘목매물", "dddd"]
  ]

  const region = [
    "수도권/경기", "강원도", "충북", "충남", "경북", "경남", "전북", "전남", "제주도"
  ]

  const onClickRegion = (regs) => {
    if (reg === regs) {
        // setHeaderImageSrc("")
        setReg("")
    }else{
        // setHeaderImageSrc(item.src)
        setReg(regs)
    }
}

  return (
    <PagePadding>
     <div className="mt-9"></div>
     <div className='flex flex-row justify-between items-center gap-4 flex-wrap'>
      <Category category={categoryList}/>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="w-[162px] h-[42px] flex flex-row justify-between items-center
            p-4 bg-white-800 border border-neutral-600 rounded-3xl text-[14px]
            "
            >
              <div>{reg}</div>
              <div>
                <AiFillCaretDown />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px] bg-white-800">
            <DropdownMenuLabel className="p-4">{reg}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white-700" />
            {region.map((reg) => {
              return <DropdownMenuCheckboxItem 
              className="p-4" 
              key={reg}
              onClick={() => onClickRegion(reg)}
              >
              <span className="min-w-[40px]">
                <FiCheck size={20} />
              </span>
              {reg}
            </DropdownMenuCheckboxItem>
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
        </div>
      <div className="mt-12"></div>
      <div>
      <section>
      <PlayListCard2 
           playlist={[...message]} />                
      </section>
      </div>
      <div className='mt-12'>
      <button onClick={addMessagesListener(new Map(categoryList2).get(homeCategory), reg)}>{reg}</button>
      </div>
    </PagePadding>
  )
}

export default page
