
import React from 'react'

import Header2 from '@/components/ui/Header2'

const layout = ({ children }) => {

  return (
    <div className="w-full h-full">
     <Header2>
      {children}
    </Header2>   
    </div>
  )
}

export default layout
