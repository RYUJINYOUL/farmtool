import React from 'react'
import LoginOutButton from '@/components/ui/LoginOutButton'
import Header2 from '@/components/ui/Header2'

const layout = ({ children }) => {
  return (
  
      <div className="w-full min-h-screen bg-white">
        <div>
       {/* <LoginOutButton /> */}
         <Header2 />
       </div>
        <div className="px-4 py-8">
          {children}
        </div>
      </div>
    
  )
}

export default layout
