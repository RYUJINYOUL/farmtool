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
import { RiMenu4Line, RiUser3Line, RiKakaoTalkFill } from "react-icons/ri";
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
    <header ref={headRef} className="w-full">
      <div className="w-full pt-[15px] pb-[13px] md:py-[5px] bg-white">
        <PagePadding>  
          <div className="w-full max-w-[1100px] mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <Logo total={isScrolled} />
              </div>

              <div className="flex items-center">
                <div className="hidden lg:block">
                  <Menu total={isScrolled} />
                </div>

                 <div className="flex items-center gap-4 lg:hidden">
                  {/* <Link href="/board" className="flex items-center">
                    <img 
                      src="/Image/icon1.png" 
                      alt="전문가 갤러리"
                      className="w-5 h-5 object-contain" 
                    />
                  </Link>
                  <Link href="/gallery" className="flex items-center">
                    <img 
                      src="/Image/icon2.png" 
                      alt="공사 갤러리"
                      className="w-5 h-5 object-contain" 
                    />
                  </Link> */}
                  <Link href="/chat" className="flex items-center">
                    <img 
                      src="/Image/kakao-icon.png" 
                      alt="카카오톡 상담"
                      className="w-5 h-5 object-contain" 
                    />
                  </Link>
                  <Link href="/myinfo" className="flex items-center">
                    <RiUser3Line className={cn("text-black", isScrolled&&"text-black")} size={20} />
                  </Link>
                  <HeaderDrawer>
                    <div className="pr-5">
                      <RiMenu4Line className={cn("text-black", isScrolled&&"text-black")} size={24} />
                    </div>
                  </HeaderDrawer>
                </div>
              </div>
            </div>
          </div>
        </PagePadding>
      </div>
      <section>{children}</section>
    </header>
  );
}

export default Header2

