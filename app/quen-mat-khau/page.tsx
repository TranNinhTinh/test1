'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppAuthShell from '@/app/components/AppAuthShell'
import AppButton from '@/app/components/ui/AppButton'
import AppField from '@/app/components/ui/AppField'
import { AuthService } from '@/lib/api/auth.service'

export default function QuenMatKhau() {
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  })

  const requestResetLink = async () => {
    const identifier = (contactType === 'email' ? formData.email : formData.phone).trim()
    if (!identifier) {
      setError('Vui lòng nhập email hoặc số điện thoại')
      return
    }

    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setError('Email không hợp lệ')
      return
    }

    if (contactType === 'phone' && !/^0\d{9,10}$/.test(identifier)) {
      setError('Số điện thoại không hợp lệ')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccessMessage('')

      const result = await AuthService.forgotPassword({
        identifier,
        email: contactType === 'email' ? identifier : undefined,
        phone: contactType === 'phone' ? identifier : undefined,
      })
      setSuccessMessage(result.message || 'Nếu tài khoản tồn tại, chúng tôi đã gửi link đặt lại mật khẩu về email của bạn')
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message || 'Không thể gửi yêu cầu quên mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    await requestResetLink()
  }

  const segment = (active: boolean) =>
    `flex-1 rounded-app-md py-2 px-app-sm text-sm font-medium transition-colors duration-app-fast ease-app-emphasized ${
      active ? 'bg-surface text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'
    }`

  return (
    <AppAuthShell title="Quên mật khẩu" subtitle="Nhập thông tin tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu qua email" showBack backHref="/dang-nhap">
      {error ? (
        <div className="mb-app-sm rounded-app-md border border-red-200 bg-red-50 px-app-sm py-2 text-sm text-app-error" role="alert">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-app-sm rounded-app-md border border-emerald-200 bg-emerald-50 px-app-sm py-2 text-sm text-emerald-800" role="status">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-app-md flex rounded-app-lg bg-surface-highest/60 p-1">
        <button type="button" onClick={() => setContactType('email')} className={segment(contactType === 'email')}>
          Email
        </button>
        <button type="button" onClick={() => setContactType('phone')} className={segment(contactType === 'phone')}>
          Số điện thoại
        </button>
      </div>

      <form onSubmit={handleSendRequest} className="space-y-app-md">
        {contactType === 'email' ? (
          <AppField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Nhập email của bạn"
            required
            autoComplete="email"
          />
        ) : (
          <AppField
            label="Số điện thoại"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Nhập số điện thoại của bạn"
            required
            autoComplete="tel"
          />
        )}

        <AppButton type="submit" variant="filled" className="mt-app-sm w-full" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </AppButton>
      </form>

      <p className="mt-app-md text-center text-sm text-foreground-muted">
        Nhớ mật khẩu?{' '}
        <Link href="/dang-nhap" className="font-semibold text-brand hover:text-brand-dark">
          Đăng nhập
        </Link>
      </p>
    </AppAuthShell>
  )
}
