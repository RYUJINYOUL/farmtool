import Header2 from "@/components/ui/Header2";
import Footer from "@/components/template/Footer";

export default function BoardLayout({ children }) {
  return (
    <div className="w-full h-full">
      <Header2>
        {children}
      </Header2>
      <Footer />
    </div>
  );
}
