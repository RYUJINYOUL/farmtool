"use client"
import { useRouter } from 'next/navigation'
import React from 'react'
import { RxHamburgerMenu } from 'react-icons/rx'
import IconButton from "./IconButton"
import { IoCloseOutline } from 'react-icons/io5'

const Logo = ({ isInDrawer = false, onClickClose = () => {} }) => {
  const { push } = useRouter();
  
  const onCilckLogo = () => {
    push("/");
  };
  
  const onClickMenu = () => {

  };

  return (
    <section className='flex flex-row items-center gap-3'>
      {isInDrawer ? (
        <IconButton
        onClickIcon={onClickClose}
        icon={<IoCloseOutline size={30} />}
        />
      ) : (
        <IconButton
        onClickIcon={onClickMenu}
        icon={<RxHamburgerMenu size={24} />}
        />
      )}
      
        <div className='text-[22px] cursor-pointer' onClick={onCilckLogo}>팜툴</div>
    </section>
  )
}

export default Logo
