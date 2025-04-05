import Header2 from '@/components/Header2'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='w-full h-full'>
    <Header2>{children}</Header2>
  </div>
  )
}

export default layout
