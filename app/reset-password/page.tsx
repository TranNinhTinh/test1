'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppAuthShell from '@/app/components/AppAuthShell'
import AppButton from '@/app/components/ui/AppButton'
import AppField from '@/app/components/ui/AppField'
import { AuthService } from '@/lib/api/auth.service'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      setLoading(true)
      setError('')

      await AuthService.resetForgotPassword({
        token,
        newPassword,
        confirmPassword,
      })

      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
      router.push('/dang-nhap')
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppAuthShell title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản của bạn" showBack backHref="/quen-mat-khau">
      {error ? (
        <div className="mb-app-sm rounded-app-md border border-red-200 bg-red-50 px-app-sm py-2 text-sm text-app-error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-app-md">
        <AppField
          label="Mật khẩu mới"
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới"
          required
          autoComplete="new-password"
        />
        <AppField
          label="Xác nhận mật khẩu mới"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          required
          autoComplete="new-password"
        />

        <AppButton type="submit" variant="filled" className="w-full" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </AppButton>
      </form>

      <p className="mt-app-md text-center text-sm text-foreground-muted">
        Quay lại{' '}
        <Link href="/dang-nhap" className="font-semibold text-brand hover:text-brand-dark">
          Đăng nhập
        </Link>
      </p>
    </AppAuthShell>
  )
}
