'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

// Paths where the header should NOT appear (auth/landing pages)
const HIDDEN_PATHS = ['/', '/dang-nhap', '/dang-ky', '/quen-mat-khau', '/reset-password']

export default function GlobalHeader() {
  const pathname = usePathname()
  if (HIDDEN_PATHS.includes(pathname)) return null
  return <Header />
}
