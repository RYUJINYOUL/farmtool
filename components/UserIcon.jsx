"use client"
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import app, { db, storage } from '../firebase';

const UserIcon = ({ size = "sm" }) => {
  const dispatch = useDispatch();
  const auth = getAuth(app);
  const handleLogout = () => {
    signOut(auth).then(() => {
      dispatch(clearUser());
    }).catch((err) => {
    
    })
  }

  return (
    <Avatar 
      onClick={handleLogout}
      className={cn(
        "w-[26px] h-[26px]" && size === "lg" && "w-[56px] h-[56px] "
      )}
    >
      <AvatarImage src="https://github.com/shadcn.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
};

export default UserIcon;