'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppAuthShell from '@/app/components/AppAuthShell'
import AppButton from '@/app/components/ui/AppButton'
import AppField from '@/app/components/ui/AppField'
import { AuthService, RegisterRequest } from '@/lib/api/auth.service'

type Step = 'form' | 'otp'

export default function DangKy() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'WORKER' | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = () => {
    setResendCooldown(60)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!accountType) return setError('Vui lòng chọn loại tài khoản!')
    if (!formData.fullName.trim()) return setError('Vui lòng nhập họ và tên!')
    if (!formData.email.trim()) return setError('Vui lòng nhập email!')
    if (!formData.phone.trim()) return setError('Vui lòng nhập số điện thoại!')
    if (!formData.password) return setError('Vui lòng nhập mật khẩu!')
    if (formData.password !== formData.confirmPassword) return setError('Mật khẩu xác nhận không khớp!')

    setLoading(true)
    try {
      let phoneNumber = formData.phone.trim()
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+84' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+84' + phoneNumber
      }

      const registerData: RegisterRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: phoneNumber,
        password: formData.password,
        role: accountType === 'CUSTOMER' ? 'customer' : 'provider',
      }

      await AuthService.register(registerData)
      startCooldown()
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < 6) return setError('Vui lòng nhập đủ 6 chữ số!')

    setLoading(true)
    try {
      await AuthService.verifyEmail(formData.email.trim(), code)
      router.push('/dang-nhap?verified=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại. Vui lòng thử lại!')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await AuthService.resendVerificationOtp(formData.email.trim())
      startCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại mã. Vui lòng thử sau!')
    } finally {
      setLoading(false)
    }
  }

  const chip = (active: boolean) =>
    `flex-1 rounded-app-md py-2 px-app-sm text-sm font-semibold transition-colors duration-app-fast ease-app-emphasized ${
      active ? 'bg-brand text-white shadow-sm' : 'bg-surface-highest/80 text-foreground-muted hover:bg-surface-highest'
    }`

  if (step === 'otp') {
    return (
      <AppAuthShell title="Xác thực email" subtitle={`Nhập mã 6 chữ số đã gửi tới ${formData.email}`} showBack backHref="/dang-ky">
        {error ? (
          <div className="mb-app-sm rounded-app-md border border-red-200 bg-red-50 px-app-sm py-2 text-sm text-app-error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleVerify} className="space-y-app-md">
          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-14 w-12 rounded-app-md border border-outline bg-surface text-center text-2xl font-bold text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <AppButton type="submit" variant="filled" className="w-full" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </AppButton>
        </form>

        <div className="mt-app-md text-center text-sm text-foreground-muted">
          Không nhận được mã?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="font-semibold text-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại'}
          </button>
        </div>
      </AppAuthShell>
    )
  }

  return (
    <AppAuthShell title="Đăng ký" subtitle="Tạo tài khoản để kết nối với Thợ Tốt" showBack backHref="/dang-nhap">
      {error ? (
        <div className="mb-app-sm rounded-app-md border border-red-200 bg-red-50 px-app-sm py-2 text-sm text-app-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mb-app-md flex gap-app-xs">
        <button type="button" onClick={() => setAccountType('CUSTOMER')} className={chip(accountType === 'CUSTOMER')}>
          Khách hàng
        </button>
        <button type="button" onClick={() => setAccountType('WORKER')} className={chip(accountType === 'WORKER')}>
          Thợ
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-app-sm">
        <AppField
          name="fullName"
          label="Họ và tên"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Họ và tên"
          required
        />
        <AppField
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
          required
          autoComplete="email"
        />
        <AppField
          name="phone"
          type="tel"
          label="Số điện thoại"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="Số điện thoại"
          required
          autoComplete="tel"
        />
        <AppField
          name="password"
          type="password"
          label="Mật khẩu"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Mật khẩu"
          required
          autoComplete="new-password"
        />
        <AppField
          name="confirmPassword"
          type="password"
          label="Xác nhận mật khẩu"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="Xác nhận mật khẩu"
          required
          autoComplete="new-password"
        />

        <AppButton type="submit" variant="filled" className="mt-app-sm w-full" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </AppButton>
      </form>

      <p className="mt-app-md text-center text-xs text-foreground-muted">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="font-semibold text-brand hover:text-brand-dark">
          Đăng nhập
        </Link>
      </p>
      <p className="mt-app-xs text-center text-xs text-foreground-muted">Bạn trao tôi niềm tin tôi trao bạn tất cả.</p>
    </AppAuthShell>
  )
}
