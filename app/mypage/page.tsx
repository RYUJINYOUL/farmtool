import React from 'react'
import { getMovies } from '../../lib/geo'

const page = async () => {
  const movies = await getMovies();
  
  return (
    <>
      <div>{JSON.stringify(movies)}</div>
    </>
  );
};

export default page
