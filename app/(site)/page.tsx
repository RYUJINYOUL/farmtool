"use client"
import React from 'react'
import Category from '../../components/Category.jsx' 
import useUIState from '@/hooks/useUIState';
import PagePadding from '@/components/pagePadding';
import PlayListCard from '@/components/PlayListCard'
import { dummyPlaylistArray, getPlaylistById } from "@/lib/dummyData";
import { getRandomElementFromArray } from "@/lib/utils";
import PlayListCarousel from '@/components/PlayListCarousel';
import UserIcon from "@/components/UserIcon";
import app from '../../firebase.js';



const page = async () => {
  const categoryList = [
    "조경수매물보기", "조경수매물등록", "조경수삽니다", "시설물질문", "조경공사요청", "파일업로드"
]
  const dummyPlaylistArray1 = [...dummyPlaylistArray];
  const dummyPlaylistArray2 = [...dummyPlaylistArray];
  const dummyPlaylistArray3 = [...dummyPlaylistArray];
  const dummyPlaylistArray4 = [...dummyPlaylistArray];

// eslint-disable-next-line react-hooks/rules-of-hooks
const { homeCategory, setHomeCategory } = useUIState();

  return (
    <PagePadding>
      <div className="mt-9"></div>
      <Category category={categoryList} name="서울" name2="경기" name3="충북" aticle="지역"/>
      <div className="mt-12"></div>
     <PlayListCarousel
      playlistArray={[...dummyPlaylistArray1]}
      Thumbnail={
        <div className="w-[56px] h-[56px] ">
          <UserIcon size={"lg"} />
        </div>
      }
      title="다시 듣기"
      subTitle="도도"
     />
     <div className="mt-20"></div>
        <PlayListCarousel
          playlistArray={[...dummyPlaylistArray2]}
          title="케이시 - Full Bloom"
          subTitle="새로운 앨범"
        />
        <div className="mt-20"></div>
        <PlayListCarousel
          playlistArray={[...dummyPlaylistArray3]}
          title="커뮤니티 제공"
        />
        <div className="mt-20"></div>
        <PlayListCarousel
          playlistArray={[...dummyPlaylistArray4]}
          title="커버 및 리믹스"
        />
    <div>
      {homeCategory}
    </div>
    </PagePadding>
  )
}

export default page
