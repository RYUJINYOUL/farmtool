import React from 'react'

const IconButton = ({icon, onClickIcon = () => {} }) => {
  return (
    <div>
       <div
        onClick={onClickIcon}
        className='flex justify-center items-center w-[36px] h-[36px]
         hover:bg-gray-100 rounded-full cursor-pointer'>
            {icon}
            {/* <RxHamburgerMenu size={24} /> */}
            </div>
    </div>
  )
}

export default IconButton
