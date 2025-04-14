import React from 'react'
import { get2 } from '../../lib/geo'

const page = () => {

  async function uploadImage(){
      let dddee= await get2("cndnwnltl")
      console.log(dddee)
    }
  
  return (
    <button onClick={uploadImage}>
    이미지업로드
  </button>
  )
}

export default page
