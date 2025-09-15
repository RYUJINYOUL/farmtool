"use client"
import React, { useEffect, useState, useRef } from 'react'
import Logo from '../ui/Logo'
import Menu from '@/components/ui/Menu'
import Menu2 from '@/components/ui/Menu2'
import Menu3 from '@/components/ui/Menu3'
import Menu4 from '@/components/ui/Menu4'
import Menu5 from '@/components/ui/Menu5'
import Navigator from '../ui/Navigator'
import PagePadding from '../ui/PagePadding'
import useUIState from "@/hooks/useUIState";
import Gallery from '@/components/ui/Gallery3'
import { usePathname } from 'next/navigation'

import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer"
import { RiMenu4Line, RiUser3Line } from "react-icons/ri";
import { cn } from "@/lib/utils";
import Link from "next/link";


const HeaderDrawer = ({ children }) => {
  return (<Drawer direction='left'>
  <DrawerTrigger>{children}</DrawerTrigger>
  <DrawerContent className='w-[280px] h-full'>
    <DrawerTitle className="sr-only">메인 메뉴</DrawerTitle>
    <nav className='w-full h-full bg-white'>
      <div className='p-6 border-b border-gray-100'>
        <Logo total={true}/>
      </div>
      <div className='py-4'>
        <Navigator />
      </div>
    </nav>
  </DrawerContent>
</Drawer>
  );
}



const Header2 = ({children}) => {
   const pathname = usePathname()
   const [isScrolled, setIsScrolled] = useState(false);
   const { homeCategory, setHomeCategory, headerImageSrc, setHeaderImageSrc } = useUIState();
   const headRef = useRef();


   useEffect(() => {
    if (pathname === '/') {
      setHomeCategory(null);
    }
   }, [pathname, setHomeCategory]);
 

   useEffect(() => {
      const handleScroll = () => {
        const scrollValue = headRef?.current?.scrollTop;
        setIsScrolled(scrollValue !== 0);
      };
  
      headRef?.current?.addEventListener("scroll", handleScroll);
      return () => {
        headRef?.current?.removeEventListener("scroll", handleScroll);
      }
    }, []);



  return (
    <header ref={headRef} className="overflow-y-auto w-full h-full pt-1">
      
     {/* <section className="relative top-0 w-full">
        <div className={cn('block sticky top-100 w-full', (pathname !== "/")&&"hidden")}><Gallery/></div>
      </section> */}

       <PagePadding>  
   <section className={cn('absolute w-full top-1 left-0 flex md:h-[62px] h-[48px] z-10 items-start md:justify-center sm:justify-between', 
    isScrolled&&"md:bg-white bg-gray-50")}>
      
   <div className='flex flex-col'>
      <div className='md:absolute sm:absolute lg:relative lg:w-[1100px] w-full flex items-center justify-between sm:justify-between'>
          <section
        className={cn(
          'absolute w-full top-0 left-0 z-10',
          isScrolled && 'md:bg-white bg-bg-gray-50',
        )}
      >
        {/* 헤더: 좌중앙우 */}
        <div className="relative mx-auto flex h-[48px] w-full items-center justify-between lg:w-[1100px] md:h-[62px]">
          {/* 중앙: 로고 */}
          <div>
            <Logo total={isScrolled} />
          </div>
          

          <section className='flex items-center'>
              <article className='hidden lg:block'>
              <Menu total={isScrolled} />
              </article>

              <div className="flex items-center gap-4 lg:hidden">
                <Link href="/myinfo" className="flex items-center">
                  <RiUser3Line className={cn("text-black", isScrolled&&"text-black")} size={24} />
                </Link>
                <HeaderDrawer>
                  <article className='pr-5'>
                    <RiMenu4Line className={cn("text-black", isScrolled&&"text-black")} size={28} />
                  </article>
                </HeaderDrawer>
              </div>
            </section>
        </div>

        {/* ▼ 아래로 내려간 카테고리 메뉴 */}
        {/* {(homeCategory === '건설업' ||
          homeCategory === '건설장비' ||
          homeCategory === '건설자재' ||
          homeCategory === '인허가' ||
          homeCategory === '나라장터' ||
          homeCategory === '구인구직' ||
          homeCategory === '전문인력') &&
          pathname !== "/" && ( // ← 홈일 땐 표시 안 함
            <div className="w-full bg-[#fafafa]">
              <div className="mx-auto lg:w-[1100px]">
                {homeCategory === '조경공사' && <Menu2 total={true} />}
                {homeCategory === '조경수' && <Menu3 total={true} />}
                {homeCategory === '조경시설물' && <Menu4 total={true} />}
                {homeCategory === '장비및철거' && <Menu5 total={true} />}
                <div className="mt-2.5" />
                <hr className="border-1 bg-neutral-100 opacity-100 dark:opacity-50" />
              </div>
            </div>
      )} */}
      </section>

    </div>
      </div>
      </section>
      </PagePadding>
    <section>{children}</section>

    </header>
  )
}

export default Header2

