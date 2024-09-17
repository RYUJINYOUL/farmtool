"use client"
import { useRouter } from 'next/navigation'
import React from 'react'
import { RxHamburgerMenu } from 'react-icons/rx'
import IconButton from "./IconButton"

const Logo = () => {
  const { push } = useRouter();
  
  const onCilckLogo = () => {
    push("/");
  };
  
  const onClickMenu = () => {

  };

  return (
    <section className='flex flex-row items-center gap-3'>
        <IconButton
          onClickIcon={onClickMenu}
          icon={<RxHamburgerMenu size={24} />}
        />
        <div className='text-[22px] cursor-pointer' onClick={onCilckLogo}>팜툴</div>
    </section>
  )
}

export default Logo
