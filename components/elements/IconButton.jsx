import React from 'react'

const IconButton = ({icon, onClickIcon = () => {} }) => {
  return (
    
       <div onClick={onClickIcon}
         className='flex justify-center items-center w-[30px] h-[30px] hover:bg-[rgba(27,27,27,0.15)] rounded-full cursor-pointer'>
            {icon}
        </div>
  )
}

export default IconButton
