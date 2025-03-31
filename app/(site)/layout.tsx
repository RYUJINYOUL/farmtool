import React from 'react'
import Header from '@/components/Header'
import type { Metadata } from "next";

const layout = ({ children }: { children: React.ReactNode }) => {

  return (
    <div className='w-full h-full'>
      <Header>{children}</Header>
    </div>
  )
}

export default layout
