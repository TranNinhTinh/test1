'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppAuthShell from '@/app/components/AppAuthShell'
import AppButton from '@/app/components/ui/AppButton'
import AppField from '@/app/components/ui/AppField'
import { AuthService } from '@/lib/api/auth.service'

type Step = 'email' | 'otp' | 'new-password'

export default function QuenMatKhau() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) return setError('Vui lòng nhập email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return setError('Email không hợp lệ')

    setLoading(true)
    try {
      await AuthService.forgotPasswordOtp(trimmed)
      startCooldown()
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < 6) return setError('Vui lòng nhập đủ 6 chữ số!')

    setStep('new-password')
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await AuthService.forgotPasswordOtp(email.trim())
      startCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại mã. Vui lòng thử sau!')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newPassword) return setError('Vui lòng nhập mật khẩu mới')
    if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận không khớp')

    setLoading(true)
    try {
      await AuthService.resetPasswordOtp(email.trim(), otp.join(''), newPassword)
      router.push('/dang-nhap?reset=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu')
      if (err instanceof Error && (err.message.includes('OTP') || err.message.includes('hết hạn') || err.message.includes('không hợp lệ'))) {
        setOtp(['', '', '', '', '', ''])
        setStep('otp')
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    } finally {
      setLoading(false)
    }
  }

  const errorBox = error ? (
    <div className="mb-app-sm rounded-app-md border border-red-200 bg-red-50 px-app-sm py-2 text-sm text-app-error" role="alert">
      {error}
    </div>
  ) : null

  if (step === 'otp') {
    return (
      <AppAuthShell
        title="Nhập mã OTP"
        subtitle={`Mã 6 chữ số đã được gửi tới ${email}`}
        showBack
        backHref="/quen-mat-khau"
      >
        {errorBox}

        <form onSubmit={handleVerifyOtp} className="space-y-app-md">
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
            Tiếp tục
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

  if (step === 'new-password') {
    return (
      <AppAuthShell
        title="Đặt mật khẩu mới"
        subtitle="Tạo mật khẩu mới cho tài khoản của bạn"
        showBack
        backHref="/quen-mat-khau"
      >
        {errorBox}

        <form onSubmit={handleResetPassword} className="space-y-app-md">
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
      </AppAuthShell>
    )
  }

  return (
    <AppAuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email tài khoản, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu"
      showBack
      backHref="/dang-nhap"
    >
      {errorBox}

      <form onSubmit={handleSendOtp} className="space-y-app-md">
        <AppField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email của bạn"
          required
          autoComplete="email"
        />

        <AppButton type="submit" variant="filled" className="mt-app-sm w-full" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
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
