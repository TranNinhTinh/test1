'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Stripe redirects here after 3DS / bank-redirect payment methods complete.
// URL params: ?payment_intent=pi_...&payment_intent_client_secret=pi_..._secret_...&redirect_status=succeeded|processing|requires_payment_method

function PaymentReturnInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...')

  useEffect(() => {
    const status = searchParams.get('redirect_status')

    if (status === 'succeeded') {
      setMessage('Thanh toán thành công! Đang chuyển hướng...')
      setTimeout(() => router.replace('/subscription?payment=success'), 1200)
    } else if (status === 'processing') {
      setMessage('Thanh toán đang được xử lý. Bạn sẽ nhận thông báo khi hoàn tất.')
      setTimeout(() => router.replace('/subscription?payment=processing'), 2000)
    } else {
      // requires_payment_method or unknown — redirect back to subscription with error
      setMessage('Thanh toán không thành công. Đang chuyển về trang gói đăng ký...')
      setTimeout(() => router.replace('/subscription?payment=failed'), 2000)
    }
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-lowest px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-4 text-sm text-foreground-muted">{message}</p>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      }
    >
      <PaymentReturnInner />
    </Suspense>
  )
}
