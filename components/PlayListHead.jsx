"use client"
import React from 'react'
import { FiMoreVertical } from 'react-icons/fi'
import IconButton from './elements/IconButton'
import Image from 'next/image'
import { getRandomElementFromArray } from '@/lib/utils'

const PlayListHead = ({ playlist = {} } = {}) => {
    const { playlistName, owner, songList } = playlist

    const randomSong = getRandomElementFromArray(songList);
  
    return (
    <section className='flex gap-[50px] flex-row'>
        <div className=' relative h-[160px] w-[160px] lg:w-[240px] lg:h-[240px]'>
            <Image alt="songImg" fill src={randomSong?.imageSrc} />
        </div>
        <article className='flex flex-col justify-center'>
            <div className='font-bold text-[28px]'>{playlistName}</div>
            <div className=" text-neutral-400 mt-4 text-[14px]">
            <div>{`앨범 • ${owner} • 2019`}</div>
            <div>{`${songList.length}곡 • 15분`}</div>
          </div>
            <ul>
                <IconButton icon={<FiMoreVertical size={24} />} />
            </ul>
        </article>
    </section>

  )
}

export default PlayListHead
