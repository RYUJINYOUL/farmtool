import React from 'react'
import Image from 'next/image'
import UserIcon from '@/components/UserIcon'
import PagePadding from '@/components/pagePadding'
import { FaChromecast } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
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
  

  const HeaderDrawer = () => {
    return (
        <Drawer>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                <DrawerDescription>This action cannot be undone.</DrawerDescription>
                 </DrawerHeader>
                <DrawerFooter>
                <DrawerClose>
                </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
  }

const Header = ({children}) => {
  return (
    <header className='relative overflow-y-auto w-full h-full'>
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
      <section className='sticky'>
        <PagePadding>
        <div className='h-[64px] flex flex-row justify-between items-center'>
          <article className='h-[42px] min-w-[480px] flex flex-row items-center bg-[rgba(244,246,243,0.74)] rounded-2xl px-[16px] gap-[16px]'>
            <div>
             <FiSearch size={24} />
            </div>
            <input className='h-full w-full bg-transparent'
            placeholder='나무 검색하세요'
            type='text' />
          </article>
          <HeaderDrawer />
           <article className='flex flex-row gap-6 items-center'>
            <FaChromecast size={26} />
          <UserIcon />
        </article>
        </div>
        </PagePadding>
        

      </section>
      <section className='absolute'>{children}</section>
    </header>
  )
}

export default Header
