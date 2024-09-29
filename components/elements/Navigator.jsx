"use client";
import React, { useMemo, useState } from 'react'
import { FaTree } from "react-icons/fa";
import { CgTrees } from "react-icons/cg";
import { GiTreeRoots } from "react-icons/gi";
import { GiParkBench } from "react-icons/gi";
import { GrDocumentText } from "react-icons/gr";
import { TiDocumentText } from "react-icons/ti";
import { usePathname } from 'next/navigation';
import { FiPlus, FiMusic, FiCompass } from "react-icons/fi";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, query} from "firebase/firestore";
import app from '../../firebase';

const Navigator = () => {
    const pathname = usePathname();
    const db2 = getFirestore(app);
    const [show, setShow] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const routes = useMemo(() => {
        return [
            {
                icon: <FaTree size={24} />,
                label: "나무직거래",
                isActive: pathname === "/tree",
                href: "/tree",
            },
            {
                icon: <GiParkBench size={24} />,
                label: "조경시설물",
                isActive: pathname === "/facility",
                href: "/facility",
            },
            {
                icon: <GiTreeRoots size={24} />,
                label: "조경공사",
                isActive: pathname === "/constructure",
                href: "/constructure",
            },
            {
                icon: <TiDocumentText size={24} />,
                label: "견적받기",
                isActive: pathname === "/estimate",
                href: "/estimate",
            },
        ]
    }, [pathname]);


    const handleSubmit = async (e) => {

        const user = auth.currentUser;
       
        e.preventDefault();
        
        if (isFormValid(name, description)) {
          const chatRoomsRef = doc(db2, "chatRooms", name); 
          try{
            await setDoc(chatRoomsRef, {
              id: chatRoomsRef.id,
              name: name,
              description: description,
              typing: [],
              createdBy: {
                name: currentUser.displayName,
                image: currentUser.photoURL
              }
            });
            setName('');
            setDescription('');
            setShow(false);
            document.getElementById('my_modal_1').close()
          } catch(error) {
           console.log(error)
          }
    }
      }



    return (
        <div>
         <section className='flex flex-col gap-2 p-4'>
            {routes.map((route) => {
                return (
                    <Link key={route.label} href={route.href}>
                <div className={cn(
                    'text-[16px] flex flex-row items-center gap-4 hover:bg-gray-100 rounded-lg p-2',
                     route.isActive && "bg-gray-200"
                )}>
                    {route.icon}
                    <span>{route.label}</span>
                </div>
                </Link>
                );
            })}
         </section>
         <section className='px-6'>
        <div className='w-full h-[1px] bg-gray-600'></div>
         </section>
         <section className="px-6">
            {/* <Link href={"/upload"}> */}
            <div className="w-full h-[1px] bg-neutral-700"></div>
      </section>
      <section className="px-6">
      <div className="btn hover:bg-gray-500 cursor-pointer
         flex flex-row items-center bg-gray-700 my-6 rounded-3xl p-2 font-[200] justify-center gap-2" onClick={()=>document.getElementById('my_modal_1').showModal()}>
       
          <FiPlus className='text-white' size={24}></FiPlus>
          <span className='text-white'>업로드</span>
      
        </div>
        {/* </Link> */}
        </section>

        <dialog id="my_modal_1" className="modal w-[500px] rounded-2xl">
        <h6 className='bg-white p-4 text-black'>채팅방 생성하기</h6>
        <div className="modal-box bg-white gap-2">
          <div className="group relative flex flex-col gap-2 p-4">
            <div className='text-black'>방 이름</div>
            
            <input className="bg-white rounded-md border-2 border-gray-300 h-9" label="방 이름을 입력하세요" onChange={(e) => setName(e.target.value)}/>
            
            <div className='text-black'>방 설명</div>
          
            <input className="bg-white rounded-md border-2 border-gray-300 h-9" label="방 설명을 입력하세요" onChange={(e) => setDescription(e.target.value)}/>
          
        </div>
   
          <div className="modal-action flex gap-3 p-4">
            <form method="dialog">
              <button className="btn text-black">닫힘</button>
            </form>
            <form onClick={handleSubmit}>
              <button className="btn text-black">생성</button>
            </form>
          </div>
        </div>
      </dialog>
   
      <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>채팅 방 생성하기</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>방 이름</Form.Label>
            <Form.Control
            onChange={(e) => setName(e.target.value)}
            type='text'
            placeholder='채팅 방 이름을 입력하세요'
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>방 이름</Form.Label>
            <Form.Control
            onChange={(e) => setDescription(e.target.value)}
            type='text'
            placeholder='채팅 방 설명을 작성하세요'
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow(false)}>
          취소
        </Button>
        <Button variant='primary' onClick={handleSubmit}>
          생성
        </Button>
      </Modal.Footer>
    </Modal>


        </div>

        
  )
}

export default Navigator
