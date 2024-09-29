import React from 'react'
import { LuCastle } from "react-icons/lu";
import { FiBarChart } from 'react-icons/fi';
import { FiSmile } from 'react-icons/fi';

const CategoryMenu = ({ icon, label }) => {
    return (
        <div  className="w-full h-[56px] py-4 px-[24px] flex flex-row gap-4 items-center
        bg-gray-300 text-[20px] cursor-pointer rounded-sm hover:bg-gray-500 transition
        ">
            {icon}
            {label}
        </div>
    )
};

const Category = () => {
    return (
      <div className="flex flex-col gap-4 w-full lg:flex-row">
        <CategoryMenu label={"조경시설물"} icon={<LuCastle/>} />
        <CategoryMenu label={"놀이시설"} icon={<FiBarChart/>} />
        <CategoryMenu
          label={"편의시설"}
          icon={<FiSmile/>}
        />
      </div>
    );
  };

export default Category
