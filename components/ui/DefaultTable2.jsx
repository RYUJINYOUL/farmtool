"use client"
import React, { useEffect, useState } from 'react'
import moment from 'moment';
import { Card, Typography } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from 'react-redux';
import { GiSpeaker } from "react-icons/gi";
import { BsCardText } from "react-icons/bs";
import { getFirestore, collection, where, orderBy, onSnapshot, query} from "firebase/firestore";
import app from '../../firebase';
import Image from "next/image";
import Link from 'next/link';



export default function DefaultTable({props}) {
  const db2 = getFirestore(app);
  const [message, setMessages] = useState([]);
  const { push } = useRouter();
  const { currentUser } = useSelector(state => state.user)
  const timeFromNow = timestamp => moment(timestamp).format('YYYY.MM.DD');


  useEffect(() => {
    // addMessagesListener(new Map(categoryList2).get(homeCategory), reg)
    
    addMessagesListener()
 
    return () => {
    }
  }, [])


  const addMessagesListener = async () => {

      const tweetsQuery = query(
          collection(db2, "contree"),
          orderBy("isNotice", "desc"),       // 공지사항이 먼저
          orderBy("createdDate", "desc")     // 최신순 정렬
       );

      await onSnapshot(tweetsQuery, (snapshot) => {
        const tweetList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            url: data.url,
            title: data.title,
            date: data.createdDate.toDate(),
            NumOfLikes: data.NumOfLikes,
            userKey: data.userKey,
            isNotice: data.isNotice ?? false,
          };
        });

      setMessages(tweetList);
    });
  };






  const onClickCard = ({ id }) => {     //url은 []
    push(`/qu/playlist?id=${id}`)
    // push(`/test/?name=${id}collection=${collection}`);
  };

  
  return (
    <section className='flex justify-center items-center'>
    <div className="w-[1100px] lg:mt-10 pt-3.5">
    <Card className="h-full w-full overflow-scroll">
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {props[0].map((head) => (
              <th
                key={head}
                className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 bg-gray-100"
              >
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal leading-none opacity-70"
                >
                  {head}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {message.map(({ title, name, isNotice, date, id, url }, index) => {
            const classes = "p-4";
 
            return (
              <tr key={id}>
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal truncate w-[40px]"
                  >
                    
                {isNotice
                     ? <GiSpeaker className='h-5.5 w-5.5'/>
                     :  
                     (url.length !== 0)
                      ? <Image
                        alt="mediaItem"
                        className="object-contain"
                        width={30}
                        height={50}
                        src={url[0]}
                      /> 
                      : <BsCardText className='h-5 w-5'/>
                    }
                  </Typography>
                </td>
                <td className={classes}>
                  <Link href={`/con/tree/${id}`}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                      className="font-normal truncate md:w-[500px] w-[60px] line-clamp-1 cursor-pointer hover:text-blue-600"
                  >
                    {title}
                  </Typography>
                  </Link>
                </td>
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal"
                  >
                    {name}
                  </Typography>
                </td>
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium"
                  >
                  {timeFromNow(date)}
                  </Typography>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
      {/* <section className='block'>
        <div className='flex justify-start gap-2 mt-3 ml-3'>
              <div className='rounded-md my-3 lg:text-start text-center text-[15px] p-2 bg-black text-white'>
              {/* <div className='text-white' onClick={() => {push(props[2])}}>글쓰기</div> */}
              {/* </div>
            </div>   */}
        {/* </section> */} 
    </div>
    </section>
  );
}