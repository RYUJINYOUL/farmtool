"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import app from "../../firebase";
import useUIState from "@/hooks/useUIState";
import { cn } from "@/lib/utils";

export default function Navigator() {
  const { push } = useRouter();
  const auth = getAuth(app);
  const [currentUser, setCurrentUser] = useState(null);

  const { homeCategory, setHomeCategory, setHeaderImageSrc } = useUIState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsubscribe();
  }, [auth]);

  const homeCategoryList = [
    { label: "건설업", src: "/construction" },
    { label: "건설장비", src: "/equipment" },
    { label: "건설자재", src: "/materials" },
    // { label: "인허가", src: "/permit" },
    // { label: "나라장터낙찰", src: "/nara" },
    // { label: "구인구직", src: "/job" },
    { label: "전문인력", src: "/professionals" },
    { label: "내정보", src: "/myinfo" },
  ];

  const onClickCategory = (item) => {
    if (homeCategory === item.label) {
      setHeaderImageSrc("");
      setHomeCategory(item.label);
    } else {
      setHeaderImageSrc(item.src);
      setHomeCategory(item.label);
    }
    push(item.src, { scroll: false });
  };

  const handleLogin = () => {
    push("/login", { scroll: false });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      push("/login", { scroll: false });
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  return (
    <div>
      <section className="flex flex-row pl-7 pt-4 pb-4 gap-5">
        <div
          className="text-[14px] text-black items-center hover:text-cyan-600 cursor-pointer"
          onClick={currentUser ? handleLogout : handleLogin}
        >
          {currentUser ? "로그아웃" : "로그인"}
        </div>
        <div className="text-[14px] text-black items-center">|</div>
        <div
          className="text-[14px] text-black items-center hover:text-cyan-600 cursor-pointer"
          onClick={() => push("/register", { scroll: false })}
        >
          회원가입
        </div>
      </section>

      <section className="flex flex-col gap-2 p-4">
        {homeCategoryList.map((item) => (
          <div
            onClick={() => onClickCategory(item)}
            key={item.label}
            className={cn(
              "h-[38px] text-black min-w-fit px-2 flex justify-start items-center border border-transparent rounded-lg hover:text-cyan-600",
              item.label === homeCategory && "underline underline-offset-8"
            )}
          >
            {item.label}
          </div>
        ))}
      </section>
    </div>
  );
}