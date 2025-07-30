import React from "react";
import MyInfo from "@/components/MyInfo"


export default function MyPage() {
  

  return (
    <div className="pt-5">
      <section className='flex justify-center items-center m-4'>
      <div className="md:w-[1100px] w-full lg:mt-10 pt-3.5">
      <MyInfo /> 
    </div>
      </section>
  </div>
  );
}