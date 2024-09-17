"use client";
import React, { useMemo } from 'react'
import { FaTree } from "react-icons/fa";
import { CgTrees } from "react-icons/cg";
import { GiTreeRoots } from "react-icons/gi";
import { GiParkBench } from "react-icons/gi";
import { GrDocumentText } from "react-icons/gr";
import { TiDocumentText } from "react-icons/ti";
import { usePathname } from 'next/navigation';
import { FiPlus, FiMusic, FiCompass } from "react-icons/fi";
import Link from 'next/link';
import { cn } from '@/lib/utils';

const Navigator = () => {
    const pathname = usePathname();
    console.log(">>pathname", pathname);
    const routes = useMemo(() => {
        return [
            {
                icon: <FaTree size={24} />,
                label: "나무직거래",
                isActive: pathname === "/tree",
                href: "/tree",
            },
            {
                icon: <GiParkBench size={24} />,
                label: "조경시설물",
                isActive: pathname === "/facility",
                href: "/facility",
            },
            {
                icon: <GiTreeRoots size={24} />,
                label: "조경공사",
                isActive: pathname === "/constructure",
                href: "/constructure",
            },
            {
                icon: <TiDocumentText size={24} />,
                label: "견적받기",
                isActive: pathname === "/estimate",
                href: "/estimate",
            },
        ]
    }, [pathname]);

    return (
        <div>
         <section className='flex flex-col gap-2 p-4'>
            {routes.map((route) => {
                return (
                    <Link key={route.label} href={route.href}>
                <div className={cn(
                    'text-[16px] flex flex-row items-center gap-4 hover:bg-gray-100 rounded-lg p-2',
                     route.isActive && "bg-gray-200"
                )}>
                    {route.icon}
                    <span>{route.label}</span>
                </div>
                </Link>
                );
            })}
         </section>
         <section className='px-6'>
        <div className='w-full h-[1px] bg-gray-600'></div>
         </section>
         <section className="px-6">
            <Link href={"/upload"}>
        <div className="hover:bg-gray-600 cursor-pointer
         flex flex-row items-center bg-gray-300 my-6 rounded-3xl p-2 font-[200] justify-center gap-2">
          <FiPlus size={24}></FiPlus>
          <span>업로드</span>
        </div>
        </Link>
        </section>
        </div>
  )
}

export default Navigator
