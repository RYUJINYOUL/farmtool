"use client"

import Header2 from "@/components/ui/Header2";
import Footer from "@/components/template/Footer";

export default function GalleryLayout({ children }) {
  return (
    <>
      <Header2 />
      {children}
      <Footer />
    </>
  );
}
