"use client"
import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import UserIcon from '@/components/UserIcon'
import PagePadding from '@/components/pagePadding'
import { FaChromecast } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { cn } from "@/lib/utils"
import Gallery from '@/components/Caroucel3'
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
  } from "@/components/ui/drawer"
import Logo from './elements/Logo'
import Navigator from './elements/Navigator'  
  

  const HeaderDrawer = ({children}) => {
    const [isOpen, setIsOpen ] = useState(false)

    return (
        <Drawer direction="left" open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger>{children}</DrawerTrigger>
            <DrawerContent className='w-[240px] h-full'>
              <div className='py-3'>
                <div className='px-3'>
                    <Logo isInDrawer onClickClose={() => {setIsOpen(false)}} />
                </div>
                <Navigator />
              </div>
            </DrawerContent>
        </Drawer>
    )
  }

const Header3 = ({children}) => {
  // const { headerImageSrc } = useUIState();
  const [isScrolled, setIsScrolled] = useState(false);
  const headRef = useRef()
  // let slides = [
  //   "https://cdn.pixabay.com/photo/2019/02/08/21/53/plant-3984065_1280.jpg"
  //    ,
  //   "https://cdn.pixabay.com/photo/2015/07/14/07/18/greece-844269_1280.jpg"
  //    ,
  //   "https://cdn.pixabay.com/photo/2018/01/11/20/20/trees-3076834_1280.jpg"
  //    ,
  //    "/Image/main4.jpg"
  //    ,    
  //    "/Image/main5.jpg"   
  //  ]

  let slides = [
    {
      src : "https://cdn.pixabay.com/photo/2017/11/24/06/33/sky-2974197_1280.jpg",
      title: "팜툴 자재",
      desc: [
        "안전한 화장품을 위한 아로마티카의 시작 No, 미네랄오일 & 실리콘 - 아로마테라피롤온, 마사지 오일 출시 Free 파라벤 & 실리콘 - 로즈 스킨케어 라인 출시",
      ],
    }
     ,
    {
      src :"https://cdn.pixabay.com/photo/2020/03/23/02/52/pension-4959272_1280.jpg",
      title: "팜툴 조경",
      desc: 
        ["기업 부설 연구소 설립 천연 방부제 특허 취득 Free 실리콘 & 설페이트 - 샴푸 출시 Free 합성향 - 페이셜 미스트 출시"]
    },
    {
      src :"https://cdn.pixabay.com/photo/2020/05/04/19/57/river-5130498_1280.jpg",
      title: "팜툴 물류",
      desc: [
        "Free PEG & 페녹시에탄올 - 알로에 베라 젤 출시 EWG Skindeep 전성분 등재",
      ],
    },
     {
      src :"https://cdn.pixabay.com/photo/2018/01/27/19/59/flowers-3112055_1280.jpg",
      title: "팜툴 모바일",
      desc: [
        "100% PCR 용기 제품 출시 국내 뷰티 브랜드 최초 리필 스테이션 오픈",
      ],
     },    
     {
      src :"https://cdn.pixabay.com/photo/2016/05/14/14/14/cable-car-1391925_1280.jpg",
      title: "팜툴 App",
      desc: [
        "안전한 화장품을 위한 아로마티카의 시작 No, 미네랄오일 & 실리콘 - 아로마테라피롤온, 마사지 오일 출시 Free 파라벤 & 실리콘 - 로즈 스킨케어 라인 출시",
      ],
     }  
   ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollValue = headRef?.current?.scrollTop;
      setIsScrolled(scrollValue !== 0);
    };

    headRef?.current?.addEventListener("scroll", handleScroll);
    return ()=> {
      headRef?.current?.removeEventListener("scroll", handleScroll);
    }
  }, []);


  return (
    <header ref={headRef} className='overflow-y-auto w-full h-full'>
      <section className='relative top-0 w-full justify-center items-center '>

        <div className='sticky top-100 mb-8 w-full'><Gallery images={slides} /></div>
   
      </section>
      <section className={cn('lg:sticky min-[400px]:absolute w-full top-0 left-0 z-10', isScrolled&&"bg-white")}>
        <PagePadding>
        <div className='h-[64px] flex flex-row justify-between items-center'>
            <HeaderDrawer>
            <article className='lg:hidden'>
               <Logo />
              </article>
            </HeaderDrawer>
           <article className='flex flex-row gap-6 items-center pr-5'>
            <FaChromecast size={26} />
          <UserIcon />
        </article>
        </div>
        </PagePadding>
        

      </section>
      <section className='relative'>{children}</section>
    </header>
  )
}

export default Header3
