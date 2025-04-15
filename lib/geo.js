"use server"
export async function get () {
    const data = await fetch('https://api.vworld.kr/req/address?service=address&request=getCoord&key=592E9FA9-F45E-3CEF-8C97-499B33C882FE&address=%EC%8B%A0%EC%96%91%EB%A6%AC247-6&type=parcel', {cache: "no-cache"})
    const posts = await data.json()
 
    return posts.response.result.point.x
}

export async function get2 (addr){
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
    console.log(requrl)

    const data = await fetch(requrl)
    const posts = await data.json()

    return posts.response.result?.items || "없음"
}


// const URL = "https://nomad-movies.nomadcoders.workers.dev/movies";
// const URL = "https://api.vworld.kr/req/search?key=592E9FA9-F45E-3CEF-8C97-499B33C882FE&request=search&type=ADDRESS&category=ROAD&query=주덕읍&size=2";
const URL = "https://dapi.kakao.com/v3/search/book?query=아이유"


export const getMovies = async () => {
  return await fetch(URL, {headers: {
      Authorization: 'KakaoAK 7b17be9f2b4d0308caf1e29d0dd7d43b',
    }},
  )
    .then((res) => res.json())
    .catch((err) => "error");
};
