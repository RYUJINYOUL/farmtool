import React from 'react'
import Upload from '@/components/upload';

async function page (props) {
  const key = props.searchParams.addr
  const x = props.searchParams.x
  const y = props.searchParams.y

  console.log(key, x, y)

  return (
    <Upload props={[key, x, y]}/>
  )
}

export default page
