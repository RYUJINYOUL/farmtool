"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/themeProviders";
import Sidebar from "@/components/Sidebar"
import { Provider } from "react-redux";
import { store } from '../store'


const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "팜툴",
//   description: "대한민국 조경, 모든 것",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Provider store={store}>
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
          </Provider>
      </body>
    </html>
  );
}
