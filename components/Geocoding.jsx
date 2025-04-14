
// const Geocoding = async (props) => {
//     console.log(props.addr)
//     const data = await fetch('https://api.vworld.kr/req/address?service=address&request=getCoord&key=592E9FA9-F45E-3CEF-8C97-499B33C882FE&address=%EC%8B%A0%EC%96%91%EB%A6%AC247-6&type=parcel', {cache: "no-cache"})
//     const posts = await data.json()
//   return (
//     <div>{posts.response.result.point.x}</div>
//   )
// }

// export default Geocoding


export default async function Geocoding(addr) {   //redux에 address
    
    const data = await fetch('https://api.vworld.kr/req/address?service=address&request=getCoord&key=592E9FA9-F45E-3CEF-8C97-499B33C882FE&address=%EC%8B%A0%EC%96%91%EB%A6%AC247-6&type=parcel', {cache: "no-cache"})
    const posts = await data.json()


    return posts.response.result.point.x
  }