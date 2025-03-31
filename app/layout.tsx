// "use client"
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/themeProviders";
import Sidebar from "@/components/Sidebar"
import { Provider } from "react-redux";
import { store } from '../store'
import { Metadata } from "next";
import ClientLayout from "@/components/ClientLayout";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "팜툴",
  description: "조경에 모든 것",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ClientLayout>
        <ThemeProvider
              attribute="class"
              defaultTheme="root"
              enableSystem
              disableTransitionOnChange
            >
            <Sidebar>
            {children}
            </Sidebar>
          </ThemeProvider>
     </ClientLayout>
      </body>
    </html>
  );
}
