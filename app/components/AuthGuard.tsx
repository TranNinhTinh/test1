'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const PUBLIC_ROUTES = new Set([
  '/',
  '/dang-nhap',
  '/dang-ky',
  '/quen-mat-khau',
  '/reset-password',
])

export default function AuthGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (PUBLIC_ROUTES.has(pathname)) return

    const accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (accessToken) return

    // Global fallback: nếu mất token ở route private thì ép về đăng nhập ngay.
    router.replace('/dang-nhap')
  }, [pathname, router])

  return null
}
