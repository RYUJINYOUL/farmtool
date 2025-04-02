import React from 'react'
import Header3 from '@/components/Header3'


const layout = ({ children }: { children: React.ReactNode }) => {

  return (
    <div className='w-full h-full'>
      <Header3>{children}</Header3>
    </div>
  )
}

export default layout
