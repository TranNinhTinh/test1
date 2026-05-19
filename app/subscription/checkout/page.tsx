'use client'

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import AppShell from '@/app/components/AppShell'
import { SubscriptionService, type PaymentCreationResult } from '@/lib/api/subscription.service'
import { AuthService } from '@/lib/api/auth.service'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

// ─── Stripe init ──────────────────────────────────────────────────────────────

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
if (!STRIPE_PK && typeof window !== 'undefined') {
  console.error(
    '[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. ' +
    'Add it to frontend/.env.local as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...',
  )
}
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const CYCLE_LABEL: Record<string, string> = { monthly: 'Hàng tháng', annual: 'Hàng năm' }

// Stripe Elements appearance — matches the app's design tokens
const ELEMENTS_APPEARANCE: import('@stripe/stripe-js').Appearance = {
  theme: 'stripe',
  variables: {
    fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
    fontSizeBase: '15px',
    borderRadius: '10px',
    colorPrimary: '#6750a4',
    colorText: '#1d1b20',
    colorTextPlaceholder: '#49454f',
    colorDanger: '#b3261e',
  },
  rules: {
    '.Input': { border: '1px solid #cac4d0', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #6750a4', boxShadow: '0 0 0 2px rgba(103,80,164,0.12)' },
    '.Label': { color: '#49454f', fontWeight: '500' },
  },
}

// ─── Inner payment form (must be inside <Elements>) ───────────────────────────

interface CheckoutFormProps {
  result: PaymentCreationResult
  planName: string
  billingCycle: string
}

function CheckoutForm({ result, planName, billingCycle }: CheckoutFormProps) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const [ready, setReady] = useState(false)
  const [complete, setComplete] = useState(false)
  const [paying, setPaying] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !ready || !complete) return

    setPaying(true)
    setStripeError('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe redirects here for 3DS / bank-redirect payment methods
        return_url: `${window.location.origin}/subscription/return`,
      },
      // Cards that don't require redirect succeed immediately without a page change
      redirect: 'if_required',
    })

    if (error) {
      // Immediate decline or validation error — no redirect occurred
      const msg =
        error.type === 'validation_error'
          ? error.message ?? 'Thông tin thanh toán không hợp lệ.'
          : error.message ?? 'Thanh toán thất bại. Vui lòng thử lại.'
      setStripeError(msg)
      setPaying(false)
      return
    }

    // paymentIntent is defined here (redirect: 'if_required' + immediate result)
    if (paymentIntent?.status === 'succeeded') {
      setSucceeded(true)
      setTimeout(() => router.push('/subscription?payment=success'), 2000)
    } else if (paymentIntent?.status === 'processing') {
      setSucceeded(true)
      setTimeout(() => router.push('/subscription?payment=processing'), 2000)
    } else {
      setStripeError('Thanh toán chưa hoàn tất. Vui lòng thử lại hoặc chọn phương thức khác.')
      setPaying(false)
    }
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center py-app-xl text-center">
        <div className="mb-app-sm flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">Thanh toán thành công!</h2>
        <p className="mt-1 text-sm text-foreground-muted">Đang chuyển về trang quản lý gói...</p>
        <div className="mt-app-sm h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-app-md" noValidate>
      {/* Order summary */}
      <div className="rounded-app-xl border border-outline-variant/60 bg-surface">
        <div className="border-b border-outline-variant/40 px-app-md py-app-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Tóm tắt đơn hàng
          </p>
        </div>
        <div className="space-y-2 px-app-md py-app-sm">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Gói đăng ký</span>
            <span className="font-medium text-foreground">{planName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Chu kỳ</span>
            <span className="font-medium text-foreground">{CYCLE_LABEL[billingCycle] ?? billingCycle}</span>
          </div>
          {result.discountAmount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Giá gốc</span>
                <span className="font-medium text-foreground line-through">{formatPrice(result.amount)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-700">
                <span>Giảm giá</span>
                <span className="font-semibold">− {formatPrice(result.discountAmount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-outline-variant/40 pt-2">
            <span className="font-bold text-foreground">Tổng thanh toán</span>
            <span className="text-xl font-bold text-brand">{formatPrice(result.finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Element — handles cards, Apple Pay, Google Pay, etc. */}
      <div className="rounded-app-xl border border-outline-variant/60 bg-surface">
        <div className="border-b border-outline-variant/40 px-app-md py-app-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Thông tin thanh toán
          </p>
        </div>
        <div className="px-app-md py-app-md">
          <PaymentElement
            onReady={() => setReady(true)}
            onChange={(e) => {
              setComplete(e.complete)
              if (!e.complete) setStripeError('')
            }}
          />

          {stripeError && (
            <p className="mt-3 text-sm text-app-error" role="alert">{stripeError}</p>
          )}

          {!ready && (
            <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-foreground-muted border-t-transparent" />
              Đang tải phương thức thanh toán...
            </div>
          )}

          <p className="mt-app-sm text-center text-xs text-foreground-muted">
            Thẻ thử nghiệm:{' '}
            <span className="font-mono font-semibold text-foreground">4242 4242 4242 4242</span>
            {' '}· MM/YY bất kỳ · CVC bất kỳ
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || !ready || !complete || paying}
        className="w-full rounded-app-lg bg-brand py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {paying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Đang xử lý...
          </span>
        ) : (
          `Thanh toán ${formatPrice(result.finalAmount)}`
        )}
      </button>

      {/* Security note */}
      <p className="flex items-center justify-center gap-1.5 text-xs text-foreground-muted">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Bảo mật bởi{' '}
        <span className="font-semibold text-[#635bff]">Stripe</span>
        {' '}· Dữ liệu thẻ được mã hóa TLS
      </p>
    </form>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────

function CheckoutPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const planId = searchParams.get('planId')
  const discountCode = searchParams.get('discountCode') || undefined

  const [result, setResult] = useState<PaymentCreationResult | null>(null)
  const [planName, setPlanName] = useState('')
  const [billingCycle, setBillingCycle] = useState('')
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState('')
  const [hasPending, setHasPending] = useState(false)
  const [cancelingPending, setCancelingPending] = useState(false)

  const initPayment = useCallback(async () => {
    if (!planId) return

    setLoading(true)
    setInitError('')
    setHasPending(false)

    try {
      const [plans, paymentResult] = await Promise.all([
        SubscriptionService.getPlans(),
        SubscriptionService.subscribe(planId, discountCode),
      ])

      const plan = plans.find((p) => p.id === planId)
      setPlanName(plan?.name ?? 'Gói đăng ký')
      setBillingCycle(plan?.billingCycle ?? '')
      setResult(paymentResult)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không thể khởi tạo thanh toán'
      // Only show the "pending" UI for the explicit conflict the backend still throws
      // when a PENDING payment exists but Stripe PI retrieval failed
      if (
        msg.toLowerCase().includes('pending payment') ||
        msg.toLowerCase().includes('thanh toán đang chờ') ||
        msg.includes('PENDING_PAYMENT_EXISTS')
      ) {
        setHasPending(true)
      } else {
        setInitError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [planId, discountCode])

  useEffect(() => {
    if (!AuthService.getAccessToken()) {
      router.push('/dang-nhap')
      return
    }
    if (!planId) {
      router.push('/subscription')
      return
    }
    void initPayment()
  }, [planId, router, initPayment])

  const handleCancelPending = async () => {
    setCancelingPending(true)
    try {
      await SubscriptionService.cancelPendingPayment()
      setHasPending(false)
      await initPayment()
    } catch (e) {
      setInitError(e instanceof Error ? e.message : 'Không thể hủy thanh toán cũ')
    } finally {
      setCancelingPending(false)
    }
  }

  // Elements options — clientSecret is required for PaymentElement
  const elementsOptions = result
    ? {
        clientSecret: result.clientSecret,
        locale: 'vi' as const,
        appearance: ELEMENTS_APPEARANCE,
      }
    : undefined

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest">
        <main className="app-container max-w-lg py-app-md">
          {/* Back */}
          <Link
            href="/subscription"
            className="mb-app-md inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-brand"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại gói đăng ký
          </Link>

          <h1 className="mb-app-md text-xl font-bold text-foreground">Thanh toán</h1>

          {/* Pending payment conflict (only when Stripe PI retrieval failed on backend) */}
          {hasPending && !loading && (
            <div className="rounded-app-xl border border-amber-300 bg-amber-50 p-app-md">
              <p className="font-semibold text-amber-800">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" />Bạn đang có thanh toán chưa hoàn tất
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Hủy thanh toán cũ để tiến hành đăng ký mới với gói đã chọn.
              </p>
              <div className="mt-app-sm flex gap-app-sm">
                <Link
                  href="/subscription"
                  className="rounded-app-lg border border-amber-400 bg-white px-app-md py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
                >
                  Quay lại
                </Link>
                <button
                  type="button"
                  onClick={handleCancelPending}
                  disabled={cancelingPending}
                  className="rounded-app-lg bg-amber-600 px-app-md py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {cancelingPending ? 'Đang hủy...' : 'Hủy và tạo lại'}
                </button>
              </div>
            </div>
          )}

          {/* Init error */}
          {initError && !hasPending && (
            <div className="rounded-app-xl border border-app-error/30 bg-red-50 p-app-md">
              <p className="font-semibold text-app-error">Không thể khởi tạo thanh toán</p>
              <p className="mt-1 text-sm text-app-error/80">{initError}</p>
              <div className="mt-app-sm flex gap-app-sm">
                <Link
                  href="/subscription"
                  className="rounded-app-lg border border-outline-variant/60 bg-white px-app-md py-2 text-sm text-foreground hover:bg-surface"
                >
                  Quay lại
                </Link>
                <button
                  type="button"
                  onClick={() => void initPayment()}
                  className="rounded-app-lg bg-brand px-app-md py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-app-md">
              <div className="h-40 animate-pulse rounded-app-xl bg-surface-highest" />
              <div className="h-48 animate-pulse rounded-app-xl bg-surface-highest" />
              <div className="h-14 animate-pulse rounded-app-lg bg-surface-highest" />
            </div>
          )}

          {/* Stripe key missing — config error, show clear message */}
          {!loading && !stripePromise && (
            <div className="rounded-app-xl border border-app-error/30 bg-red-50 p-app-md">
              <p className="font-semibold text-app-error">Cấu hình thanh toán chưa hoàn tất</p>
              <p className="mt-1 text-sm text-app-error/80">
                Biến môi trường <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> chưa được thiết lập.
                Vui lòng liên hệ quản trị viên.
              </p>
            </div>
          )}

          {/* Stripe Elements + PaymentElement form */}
          {!loading && result && elementsOptions && stripePromise && (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <CheckoutForm
                result={result}
                planName={planName}
                billingCycle={billingCycle}
              />
            </Elements>
          )}
        </main>
      </div>
    </AppShell>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="app-container max-w-lg py-app-md space-y-app-md">
            <div className="h-6 w-32 animate-pulse rounded bg-surface-highest" />
            <div className="h-40 animate-pulse rounded-app-xl bg-surface-highest" />
            <div className="h-48 animate-pulse rounded-app-xl bg-surface-highest" />
          </div>
        </AppShell>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  )
}
