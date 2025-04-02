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
  let slides = [
    "/Image/main2.jpg"
     ,
    "/Image/main1.jpg"
     ,
    "/Image/main3.jpg"
     ,
     "/Image/main4.jpg"
     ,    
     "/Image/main5.jpg"   
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
      <section className='relative top-0 w-full'>
        <div className='sticky top-100 mb-8 w-full'><Gallery images={slides} /></div>
      </section>
      <section className={cn('lg:sticky sm:absolute w-full top-0 left-0 z-10', isScrolled&&"bg-white")}>
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
