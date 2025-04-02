"use client"
import React from 'react'
import useUIState from '@/hooks/useUIState'
import { homeCategoryList } from '@/lib/dummyData'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AiFillCaretDown } from "react-icons/ai";
import { FiCheck } from "react-icons/fi";

const Category = (props) => {
    const { homeCategory, setHomeCategory, setHeaderImageSrc } = useUIState();

    const onClickCategory = (item) => {
        if (homeCategory === item) {
            setHeaderImageSrc("")
            setHomeCategory("")
        }else{
            setHeaderImageSrc(item.src)
            setHomeCategory(item)
        }
    }

  return (
        <ul className='max-w-full overflow-x-auto flex flex-row gap-4'>
            {props.category.map((item) => {
                return <li 
                onClick={() => onClickCategory(item)}
                key={item} 
                className={cn('h-[38px] min-w-fit px-3 flex justify-center items-center border border-transparent rounded-lg bg-[rgba(144,144,144,0.45)] hover:bg-[rgba(144,144,144,0.9)] cursor-pointer', 
                item === homeCategory && "bg-white text-black hover:bg-white")}>
                    {item}</li>
            })}
        </ul>
  )
}

export default Category