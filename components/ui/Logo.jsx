"use client"
import React from 'react'
import useUIState from "@/hooks/useUIState";
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation'

function Logo(props) {
    const { push } = useRouter();
    const pathname = usePathname()
    const { homeCategory, setHomeCategory, setHeaderImageSrc, headerImageSrc} = useUIState();
    let total = props
    const onClickLogo = () =>{
      setHomeCategory("");  // ← 초기화 명확하게
      setHeaderImageSrc(""); // ← 필요하다면
      push("/", {scroll: false});
    }


  return (
    <section className='items-center'>
        {/* <div className="lg:hidden">
        <IconButton
        onClickIcon={onClickMenu}
        icon={<RxHamburgerMenu size={24} />}
        />
        </div> */}
        <div className='cursor-pointer flex flex-row items-center' onClick={onClickLogo} >
           
            <div className={cn('font-semibold md:text-[20px] text-[20px] text-black cursor-pointer whitespace-nowrap pl-4', 
            total.total&&"text-black",
            // pathname!=="/"&&"text-black",
          )}
             >건설톡</div>
        </div>
       
    </section>
  )
}

export default Logo
