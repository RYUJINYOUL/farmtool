"use client"
import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import UserIcon from '@/components/UserIcon'
import PagePadding from '@/components/pagePadding'
import { FaChromecast } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { cn } from "@/lib/utils"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
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

const Header = ({children}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const headRef = useRef();

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
    <header ref={headRef} className='relative overflow-y-auto w-full h-full'>
      <section className='absolute top-0 w-full'>
        <div className='relative h-[400px] w-full'>
            <Image 
            alt="mediaItem"
            className='object-cover'
            fill
            src="https://www.redwoodhikes.com/JedSmith/JedSmith1.jpg" />
        </div>
        <div className='absolute h-[400px] top-0 bg-white opacity-40 w-full'></div>
        <div className='absolute h-[400px] top-0 bg-gradient-to-t from-white w-full'></div>
      </section>
      <section className={cn('sticky top-0 left-0 z-10', isScrolled&&"bg-white")}>
        <PagePadding>
        <div className='h-[64px] flex flex-row justify-between items-center'>
          <article className='h-[42px] min-w-[480px] hidden lg:flex flex-row items-center bg-[rgba(244,246,243,0.74)] rounded-2xl px-[16px] gap-[16px] border border-neutral-500 '>
            <div>
             <FiSearch size={24} />
            </div>
            <input className='h-full w-full bg-transparent'
            placeholder='나무 검색하세요'
            type='text' />
          </article>
            <HeaderDrawer>
            <article className='lg:hidden'>
               <Logo />
              </article>
            </HeaderDrawer>
           <article className='flex flex-row gap-6 items-center'>
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

export default Header
