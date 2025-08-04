import React from "react";
import MyInfo from "@/components/MyInfo"
import MainMenu from "@/components/MainMenu"
import CheckoutPage from "@/app/payments/checkout/page"
import Footer from '@/components/template/Footer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


export default function MyPage() {
  

  return (
    <div className="pt-10">
      <section className='flex justify-center items-center m-4'>
      <div className="md:w-[1100px] w-full lg:mt-10 pt-3.5">
             <CheckoutPage />
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">메뉴</TabsTrigger>
          <TabsTrigger value="upload">내정보</TabsTrigger>
        </TabsList>

   
        <TabsContent value="account">
            <MainMenu />
        </TabsContent>


        <TabsContent value="upload">
           <MyInfo />
        </TabsContent>


      </Tabs> 
    </div>
      </section>

      <Footer />
  </div>
  );
}