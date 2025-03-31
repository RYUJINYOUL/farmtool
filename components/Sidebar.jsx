import React from 'react'
import Logo from './elements/Logo.jsx'
import Navigator from './elements/Navigator.jsx'

const Sidebar = ({children}) => {

  return (
    <div className='flex flex-row h-dvh' >
      <nav className='hidden lg:block w-[240px] border-r-[1px] border-gray-600'>
        <div className='p-[24px]'>
            <Logo />
        </div>
        <div>
            <Navigator />
        </div>
      </nav>
        <div className='w-full lg:w-[calc(100%-240px)]'>{children}</div>
    </div>
  )
}

export default Sidebar
