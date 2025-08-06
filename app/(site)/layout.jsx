
import React from 'react'

import Header2 from '@/components/ui/Header2'
import Footer from '@/components/template/Footer'

const layout = ({ children }) => {

  return (
    <div className="w-full h-full bg-gray-50">
     <Header2>
      {children}
      <Footer />
    </Header2>   
    </div>
  )
}

export default layout