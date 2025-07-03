"use server"

export async function getAddress (addr){
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

    console.log(posts)

    return posts.response.result?.items || "없음"
}



export async function getAddressByLatLon(lon, lat) {
  const baseUrl = process.env.V_URL2;
  const apiKey = process.env.V_KEY;
  const params = {
    service: 'address',
    request: 'getAddress',
    key: apiKey,
    point: `${lon},${lat}`,
    type: 'PARCEL',
  };
  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const requrl = `${baseUrl}?${queryString}`;
  console.log(requrl);
  const res = await fetch(requrl);
  const data = await res.json();

  const items = data?.response?.result;
  console.log(items)
  if (!Array.isArray(items)) return [];
  const x = data?.response?.input?.point?.x;
  const y = data?.response?.input?.point?.y;

  return items.map(i => ({
    juso: i.text,
    x,
    y
  }));
}


