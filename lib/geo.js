"use server";

export async function get () {
    const data = await fetch('https://api.vworld.kr/req/address?service=address&request=getCoord&key=592E9FA9-F45E-3CEF-8C97-499B33C882FE&address=%EC%8B%A0%EC%96%91%EB%A6%AC247-6&type=parcel', {cache: "no-cache"})
    const posts = await data.json()
 
    return posts.response.result.point.x
}

// export const dynamic = "force-dynamic";
export async function get2 (addr){
  console.log("시작")
    const baseUrl = process.env.V_URL
    const params = {
      'key' : process.env.V_KEY,
      'request': 'search',
      'type': 'ADDRESS',
      'category': 'ROAD',
      'query': addr,
      'size': "10",
    }

    const queryString = new URLSearchParams(params).toString()
    const requrl = `${baseUrl}?${queryString}`

    const data = await fetch(requrl)
    const posts = await data.json()


    return posts.response.result?.items || "없음"
}

