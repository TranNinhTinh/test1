import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
// Import socket initialization to run on app load (no component needed)
import '@/lib/socket-init'
import AuthGuard from './components/AuthGuard'

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'Thợ Tốt - Kết nối khách hàng và thợ chuyên nghiệp',
  description: 'Nền tảng kết nối khách hàng với thợ chuyên nghiệp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={roboto.variable}>
      <body className={`${roboto.className} min-h-screen`}>
        <AuthGuard />
        {children}
      </body>
    </html>
  )
}
