"use client"
import React from 'react';
import useAuth from '@/hooks/useAuth';
import PagePadding from '@/components/pagePadding';
import { dummyPlaylistArray } from "@/lib/dummyData";
// import PlayListCarousel from '@/components/PlayListCarousel.jsx';
import UserIcon from "@/components/UserIcon";
import PlayListCarousel from '@/components/PlayListCarousel';
import GenreListCarousel from '@/components/GenreListCarousel'
import SongListCarousel from '@/components/SongListCarousel'
import { dymmyGenreList, getAllPlaylist, getSongListTop10 } from '@/lib/dummyData'
import YouTube from 'react-youtube';
import Gallery2 from '@/components/Caroucel4'

const AuthLayout = async () => {

  useAuth

  let slides = [
    "1G32tYloRf0"
     ,
    "jjxbNFW57kI"
     ,
    "zaFyc9rR6sE"
   ]

  const [playlistArray, songListTop10] = await Promise.all([
      getAllPlaylist(),
      getSongListTop10()
    ]);

  const categoryList = [
    "조경수매물보기", "조경수매물등록", "조경수삽니다", "시설물질문", "조경공사요청", "파일업로드"
]
  const dummyPlaylistArray1 = [...dummyPlaylistArray];
  const dummyPlaylistArray2 = [...dummyPlaylistArray];
  const dummyPlaylistArray3 = [...dummyPlaylistArray];
  const dummyPlaylistArray4 = [...dummyPlaylistArray];


  return (
    <PagePadding>
   
   <PlayListCarousel
    playlistArray={playlistArray}
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
      <SongListCarousel
        songListTop10={songListTop10}
        title="인기곡"
      />
      <div className="mt-20"></div> 
      <GenreListCarousel 
        genreList={dymmyGenreList} 
        title="분위기 및 장르"
      />  
          <div className="mt-20"></div>   
          <div className='lg:hidden pt-16 w-full'>
            <Gallery2 images={slides} />
          
          </div>
          <div className='min-[400px] hidden lg:flex flex-row items-center justify-center gap-x-8 mt-8 pt-14'>
          <YouTube
                videoId={"1G32tYloRf0"}
    
                opts={{
                  width: "640",
                  height: "362",
                  playerVars: {
                    autoplay: 0, //자동재생 O
                    rel: 0, //관련 동영상 표시하지 않음 (근데 별로 쓸모 없는듯..)
                    modestbranding: 1, // 컨트롤 바에 youtube 로고를 표시하지 않음
                  },
                }}
              
                onEnd={(e)=>{e.target.stopVideo(0);}}      
              />
             <YouTube
                videoId={"jjxbNFW57kI"}
    
                opts={{
                  width: "640",
                  height: "362",
                  playerVars: {
                    autoplay: 0, //자동재생 O
                    rel: 0, //관련 동영상 표시하지 않음 (근데 별로 쓸모 없는듯..)
                    modestbranding: 1, // 컨트롤 바에 youtube 로고를 표시하지 않음
                  },
                }}
              
                onEnd={(e)=>{e.target.stopVideo(0);}}      
              />
            <YouTube
                videoId={"zaFyc9rR6sE"}
    
                opts={{
                  width: "640",
                  height: "362",
                  playerVars: {
                    autoplay: 0, //자동재생 O
                    rel: 0, //관련 동영상 표시하지 않음 (근데 별로 쓸모 없는듯..)
                    modestbranding: 1, // 컨트롤 바에 youtube 로고를 표시하지 않음
                  },
                }}
              
                onEnd={(e)=>{e.target.stopVideo(0);}}      
              />
      </div>   
          <div className="mt-20"></div>   
          <div className="mt-20"></div>   
          <div className="mt-20"></div>   
          <div className="mt-20"></div>   
      
  </PagePadding>
  )
};

export default AuthLayout;