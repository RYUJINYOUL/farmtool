import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/store/provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '건설톡',
  description: '건설톡',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 