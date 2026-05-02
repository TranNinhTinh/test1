'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppAuthShell from '@/app/components/AppAuthShell'
import AppButton from '@/app/components/ui/AppButton'
import AppField from '@/app/components/ui/AppField'
import { AuthService, LoginRequest } from '@/lib/api/auth.service'

export default function DangNhap() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const credentials = AuthService.getRememberedCredentials()
    if (credentials) {
      setFormData({
        identifier: credentials.identifier,
        password: credentials.password,
        rememberMe: true,
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const identifier = formData.identifier.trim()
      const loginData: LoginRequest = {
        identifier,
        password: formData.password,
      }
      const response = await AuthService.login(loginData, formData.rememberMe)
      if (response.user) {
        localStorage.setItem('user_data', JSON.stringify(response.user))
      }
      sessionStorage.removeItem('auth_expired_notice_shown')
      router.push('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email hoặc số điện thoại hoặc mật khẩu không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppAuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay trở lại!">
      {error ? (
        <div className="mb-app-sm rounded-app-md border border-red-200 bg-red-50 px-app-sm py-2 text-sm text-app-error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-app-sm">
        <AppField
          name="identifier"
          type="text"
          label="Email hoặc số điện thoại"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          placeholder="Email hoặc số điện thoại"
          required
          autoComplete="username"
        />
        <AppField
          name="password"
          type="password"
          label="Mật khẩu"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Mật khẩu"
          required
          autoComplete="current-password"
        />

        <label className="flex cursor-pointer items-center gap-app-xs text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            className="h-4 w-4 rounded border-outline-variant text-brand focus:ring-brand"
          />
          Ghi nhớ đăng nhập
        </label>

        <AppButton type="submit" variant="filled" className="mt-app-sm w-full" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </AppButton>
      </form>

      <div className="mt-app-md text-center">
        <Link href="/quen-mat-khau" className="text-sm font-semibold text-brand hover:text-brand-dark">
          Quên mật khẩu?
        </Link>
      </div>

      <div className="my-app-md flex items-center gap-app-sm">
        <span className="h-px flex-1 bg-outline-variant/80" />
        <span className="text-xs text-foreground-muted">hoặc</span>
        <span className="h-px flex-1 bg-outline-variant/80" />
      </div>

      <Link href="/dang-ky" className="block w-full">
        <AppButton type="button" variant="outlined" className="w-full">
          Tạo tài khoản mới
        </AppButton>
      </Link>

      <p className="mt-app-lg text-center text-xs text-foreground-muted">Bạn trao tôi niềm tin tôi trao bạn tất cả.</p>
    </AppAuthShell>
  )
}
