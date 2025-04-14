"use client"
import React, { useEffect, useState } from 'react'
import {get2} from '../../lib/geo'
import { useForm } from 'react-hook-form';
import PagePadding from '@/components/pagePadding.jsx'
import { useRouter } from "next/navigation";


const page = async () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [addr, setAddr] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [reg, setReg] = useState("");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { register, handleSubmit, formState: { errors } } = useForm();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { push } = useRouter();
  const result = [];
  

  async function addrs (data) {
    setAddr([])
    const res = await get2(data.address)

    
    for (let i of res) {
      result.push({juso: i.address.road, x: i.point.x, y: i.point.y}) 
    }
    return setAddr(result)
  }

  console.log(addr)

  const onClickAddr = (id) => {
    push(`/upload?addr=${id.juso}&x=${id.x}&y=${id.y}`);
    // push(`/test/?name=${id}collection=${collection}`);
  };

  return (
  <PagePadding>
    <div>
    <form onSubmit={handleSubmit(addrs)}>
      <div className='mt-5' />
      <input
            placeholder="주소"
            name="address"
            type="text"
            {...register("address")}
        />
      <div className='mt-5' />
          {
          addr?.map((ad, index) => {
            return (
              <div
              onClick={
                () => onClickAddr(ad)  
              }
              key={index} 
              value={ad.juso}>
                {ad.juso}
                </div>
            )
          })}
    </form>
    </div>
</PagePadding>
  )
}

export default page
