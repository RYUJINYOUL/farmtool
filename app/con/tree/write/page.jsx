
import React from 'react'
import DefaultTable2 from '@/components/ui/DefaultTable2'


const page = () => {
  const TABLE_HEAD = ["이미지", "글제목", "글쓴이", "작성일"];
 
  

  return (
    <div className='w-full h-full'>
      <DefaultTable2 props={[TABLE_HEAD]} />
    </div>
    
  )
}

export default page
