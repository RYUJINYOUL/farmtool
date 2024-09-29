import React from 'react'
import PagePadding from '@/components/pagePadding'
import Category from '@/components/Category'
import PlayListCarousel from '@/components/PlayListCarousel'
import UserIcon from '@/components/UserIcon'
import PlayListCard from '@/components/PlayListCard'
import { getRandomElementFromArray } from '@/lib/utils'
import { dummyPlaylistArray2 } from '@/lib/dummyData'



const page = () => {
  const categoryList = [
    "조경수매물보기", "조경수매물등록", "조경수삽니다", "시설물질문", "조경공사요청", "파일업로드"
]

  return (
    <PagePadding>
     <div className="mt-9"></div>
      <Category category={categoryList} name="서울" name2="경기" name3="충북" aticle="지역"/>
      <div className="mt-12"></div>
      <section className='grid grid-cols-3 gap-6 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />   
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />   
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />   
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} /> 
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />   
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} /> 
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />   
      <PlayListCard 
           playlist={getRandomElementFromArray(dummyPlaylistArray2)} />                              
      </section>
      <div className='mt-12'></div>
    </PagePadding>
  )
}

export default page
