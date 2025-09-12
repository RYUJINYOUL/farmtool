import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/themeProvider";
import ClientLayout from "@/components/ClientLayout";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";


const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: '건설톡',
  description: '건설톡',
  keywords: '건설톡, 장비톡, 건자재톡, 건설 구인구직, 건설전문인력, 인허가, 나라장터',
  openGraph: {
    title: '건설톡',
    description: '건설톡, 장비톡, 건자재톡, 건설 구인구직, 건설전문인력, 인허가, 나라장터',
    locale: 'ko_KR',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/Image/logo.png', type: 'image/png' },
    ],
    shortcut: ['/Image/logo.png'],
    apple: [
      { url: '/Image/logo.png' },
    ],
  },
  verification: {
    google: "1ZwXlaJ3DtfEgDHAjZxBSmjOO6UxbSo4_72IRnyTshw",
    other: {
      'naver-site-verification': '3e3c2769a630ba77d8cadb2026d2c8eefe6dd8fc',
    },
  },
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
