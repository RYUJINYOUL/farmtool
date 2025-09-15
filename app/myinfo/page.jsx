import React from "react";
import MyInfo from "@/components/MyInfo"
import Footer from '@/components/template/Footer';


export default function MyPage() {
  

  return (
    <>
    <div className="pt-1">
      <section className='flex justify-center items-center m-4'>
      <div className="md:w-[1100px] w-full pt-2">
      <MyInfo /> 
    </div>
      </section>
  </div>
   <Footer />
   </>
  );
}