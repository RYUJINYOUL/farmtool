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

const AuthLayout = async () => {

  useAuth

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
          <div className="mt-20"></div>   
          <div className="mt-20"></div>   
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
  </PagePadding>
  )
};

export default AuthLayout;