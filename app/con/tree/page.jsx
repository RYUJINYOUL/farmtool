"use client"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import React, { useState } from 'react'
import Question from '@/components/ui/Question'
import { useRouter } from "next/navigation"
import Page from "./write/page"

const page = () => {
  const [pag, setPag] = useState("account")

  return (
    <div className='relative md:top-20 top-24'>
        <section className='flex justify-center items-center m-4'>
        <div className="md:w-[1100px] w-full lg:mt-10 pt-3.5">
        <Tabs value={pag} onValueChange={setPag} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">추천매물</TabsTrigger>
          <TabsTrigger value="upload">업로드</TabsTrigger>
        </TabsList>


        <TabsContent value="account">
            <Page />
        </TabsContent>


        <TabsContent value="upload">
            <Question pag={pag} setPag={setPag} />
        </TabsContent>
      </Tabs>
      </div>
      </section>
  </div>
  )
}

export default page
