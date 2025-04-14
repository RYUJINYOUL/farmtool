
import React from 'react'
import Geocoding from '@/components/Geocoding'
import Upload from '@/components/upload'

async function page () { 
  const data = await Geocoding();   //upload에서 주소를 받아??
  
  return (
   <Upload props={data}>    
    {/* <Geocoding addr="주덕읍 신양리"/> */}
   </Upload>
  )
}

export default page
