import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/themeProvider";
import ClientLayout from "@/components/ClientLayout";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";


const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: '팜툴 - 나만의 링크 모음',
  description: '당신만의 특별한 링크 모음을 만들어보세요',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko"
     suppressHydrationWarning>
      <body className={inter.className}>
      <ServiceWorkerRegister />
      <ClientLayout>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
            {/* <FabButton /> */}
        </ClientLayout>
          </body>
    </html>
  );
}
