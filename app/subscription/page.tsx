'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import {
  SubscriptionService,
  type SubscriptionPlan,
  type SubscriptionStatusSummary,
  type SubscriptionPayment,
  type BillingCycle,
} from '@/lib/api/subscription.service'
import { AuthService } from '@/lib/api/auth.service'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faClock, faCircleCheck, faTriangleExclamation, faBan, faCircleXmark, faGift, faArrowRight, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Status Banner ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { border: string; bg: string; text: string; icon: IconDefinition }> = {
  trial:     { border: 'border-amber-300',  bg: 'bg-amber-50',  text: 'text-amber-800',  icon: faClock },
  active:    { border: 'border-green-300',  bg: 'bg-green-50',  text: 'text-green-800',  icon: faCircleCheck },
  past_due:  { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800', icon: faTriangleExclamation },
  cancelled: { border: 'border-gray-300',   bg: 'bg-gray-50',   text: 'text-gray-600',   icon: faBan },
  expired:   { border: 'border-red-300',    bg: 'bg-red-50',    text: 'text-red-700',    icon: faCircleXmark },
}

const STATUS_LABEL: Record<string, string> = {
  trial: 'Đang dùng thử', active: 'Đang hoạt động',
  past_due: 'Quá hạn thanh toán', cancelled: 'Đã hủy', expired: 'Đã hết hạn',
}

function StatusBanner({ status }: { status: SubscriptionStatusSummary }) {
  const style = STATUS_STYLE[status.status] ?? STATUS_STYLE.expired
  const expiryDate = status.status === 'trial' ? status.trialEndDate : status.currentPeriodEnd

  return (
    <div className={`rounded-app-xl border ${style.border} ${style.bg} p-app-md`}>
      <div className="flex items-start justify-between gap-app-sm">
        <div className="flex items-center gap-app-sm">
          <FontAwesomeIcon icon={style.icon} className="text-2xl" aria-hidden />
          <div>
            <div className="flex items-center gap-app-xs">
              <p className={`font-bold text-base ${style.text}`}>
                {STATUS_LABEL[status.status] ?? status.status}
              </p>
              {status.daysUntilExpiry !== undefined && status.daysUntilExpiry >= 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}>
                  {status.daysUntilExpiry} ngày còn lại
                </span>
              )}
            </div>
            <p className={`mt-0.5 text-sm ${style.text} opacity-80`}>{status.statusMessage}</p>
            {expiryDate && (
              <p className={`mt-0.5 text-xs ${style.text} opacity-70`}>
                {status.status === 'trial' ? 'Hết thử nghiệm' : 'Hết hạn'}: {formatDate(expiryDate)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'Hàng tháng',
  annual: 'Hàng năm',
}

function PlanCard({
  plan,
  selected,
  onSelect,
  disabled,
}: {
  plan: SubscriptionPlan
  selected: boolean
  onSelect: () => void
  disabled: boolean
}) {
  const isAnnual = plan.billingCycle === 'annual'
  const monthlyEquivalent = isAnnual ? Math.round(plan.price / 12) : null

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`relative w-full rounded-app-xl border-2 p-app-md text-left transition-all duration-200 ${
        selected
          ? 'border-brand bg-brand-tint/30 shadow-app-card-hover'
          : 'border-outline-variant/60 bg-surface hover:border-brand/40 hover:shadow-app-card'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      {isAnnual && (
        <span className="absolute -top-3 right-app-md rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-sm">
          Tiết kiệm nhất
        </span>
      )}

      <div className="flex items-start justify-between gap-app-sm">
        <div className="flex-1">
          <p className="font-bold text-foreground">{plan.name}</p>
          <p className="mt-0.5 text-xs text-foreground-muted">{CYCLE_LABEL[plan.billingCycle]}</p>
          {plan.description && (
            <p className="mt-app-xs text-sm text-foreground-muted">{plan.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-brand">{formatPrice(plan.price)}</p>
          {monthlyEquivalent && (
            <p className="mt-0.5 text-xs text-foreground-muted">
              ≈ {formatPrice(monthlyEquivalent)}/tháng
            </p>
          )}
        </div>
      </div>

      {plan.features && plan.features.length > 0 && (
        <ul className="mt-app-sm space-y-1.5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground">
              <svg className="h-4 w-4 flex-shrink-0 text-brand" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className={`mt-app-md flex items-center gap-2 ${selected ? 'text-brand' : 'text-foreground-muted'}`}>
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-brand bg-brand' : 'border-outline-variant'}`}>
          {selected && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </div>
        <span className="text-sm font-medium">{selected ? 'Đã chọn' : 'Chọn gói này'}</span>
      </div>
    </button>
  )
}

// ─── Payment History ──────────────────────────────────────────────────────────

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xác nhận' },
  paid:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Đã thanh toán' },
  failed:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Thất bại' },
  refunded: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Đã hoàn tiền' },
}

function PaymentHistoryRow({ payment }: { payment: SubscriptionPayment }) {
  const ps = PAYMENT_STATUS_STYLE[payment.status] ?? PAYMENT_STATUS_STYLE.pending

  return (
    <tr className="border-t border-outline-variant/40">
      <td className="py-3 pr-app-sm text-sm text-foreground">
        {formatDate(payment.createdAt)}
      </td>
      <td className="py-3 pr-app-sm text-sm text-foreground">
        {payment.plan?.name ?? '—'}
      </td>
      <td className="py-3 pr-app-sm text-right text-sm font-medium text-foreground">
        {formatPrice(payment.finalAmount)}
        {payment.discountAmount > 0 && (
          <span className="ml-1 text-xs text-foreground-muted line-through">
            {formatPrice(payment.amount)}
          </span>
        )}
      </td>
      <td className="py-3 text-right">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ps.bg} ${ps.text}`}>
          {ps.label}
        </span>
      </td>
    </tr>
  )
}

// ─── Cancel Dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (reason: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-app-xl bg-surface p-app-md shadow-app-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-foreground">Hủy đăng ký?</h3>
        <p className="mt-1 text-sm text-foreground-muted">
          Bạn vẫn có thể sử dụng dịch vụ đến hết kỳ thanh toán hiện tại.
        </p>
        <label className="mt-app-md block">
          <span className="text-sm font-medium text-foreground">Lý do hủy (tùy chọn)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ví dụ: Không còn nhu cầu, chi phí..."
            className="mt-1 w-full rounded-app-lg border border-outline-variant/80 bg-surface-lowest px-app-sm py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
          />
        </label>
        <div className="mt-app-md flex gap-app-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-app-lg border border-outline-variant/60 bg-surface py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-highest disabled:opacity-60"
          >
            Giữ lại
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 rounded-app-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentParam = searchParams.get('payment')
  const paymentSuccess = paymentParam === 'success'
  const paymentProcessing = paymentParam === 'processing'
  const paymentFailed = paymentParam === 'failed'

  const [status, setStatus] = useState<SubscriptionStatusSummary | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [error, setError] = useState('')

  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  // Discount
  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountResult, setDiscountResult] = useState<{
    valid: boolean
    discountAmount?: number
    finalAmount?: number
    message?: string
  } | null>(null)

  // Cancel dialog
  const [showCancel, setShowCancel] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const isProvider = !!AuthService.getAccessToken()

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const s = await SubscriptionService.getMyStatus()
      setStatus(s)
    } catch {
      // Not a provider — silently ignore; page will show non-provider state
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true)
    try {
      const data = await SubscriptionService.getPlans()
      setPlans(data.sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải gói đăng ký')
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  const loadPayments = useCallback(async () => {
    setLoadingPayments(true)
    try {
      const data = await SubscriptionService.getMyPayments()
      setPayments(data.payments)
      setPaymentTotal(data.total)
    } catch {
      // Not a provider or no payments — silently ignore
    } finally {
      setLoadingPayments(false)
    }
  }, [])

  useEffect(() => {
    if (!isProvider) {
      router.push('/dang-nhap')
      return
    }
    void loadStatus()
    void loadPlans()
    void loadPayments()
  }, [isProvider, router, loadStatus, loadPlans, loadPayments])

  const handleValidateDiscount = async () => {
    if (!discountCode.trim() || !selectedPlanId) return
    const plan = plans.find((p) => p.id === selectedPlanId)
    if (!plan) return

    setDiscountLoading(true)
    setDiscountResult(null)
    try {
      const result = await SubscriptionService.validateDiscount(
        discountCode.trim().toUpperCase(),
        plan.billingCycle,
      )
      setDiscountResult(result)
    } catch (e) {
      setDiscountResult({ valid: false, message: e instanceof Error ? e.message : 'Mã không hợp lệ' })
    } finally {
      setDiscountLoading(false)
    }
  }

  const handleProceedToCheckout = () => {
    if (!selectedPlanId) return
    const qs = new URLSearchParams({ planId: selectedPlanId })
    if (discountResult?.valid && discountCode) {
      qs.set('discountCode', discountCode.trim().toUpperCase())
    }
    router.push(`/subscription/checkout?${qs.toString()}`)
  }

  const handleCancel = async (reason: string) => {
    setCancelLoading(true)
    try {
      await SubscriptionService.cancelSubscription(reason || undefined)
      setShowCancel(false)
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hủy đăng ký')
    } finally {
      setCancelLoading(false)
    }
  }

  const canSubscribe =
    !status || status.status === 'trial' || status.status === 'cancelled' || status.status === 'expired'

  const canCancel = status?.status === 'active' || status?.status === 'past_due'

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest">

        <main className="app-container max-w-3xl py-app-md">
          {/* Page header */}
          <div className="mb-app-md">
            <h1 className="text-xl font-bold text-foreground">Gói đăng ký</h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Quản lý gói dịch vụ và lịch sử thanh toán của bạn
            </p>
          </div>

          {/* Payment result banners */}
          {paymentSuccess && (
            <div className="mb-app-md rounded-app-xl border border-green-300 bg-green-50 px-app-md py-app-sm">
              <p className="flex items-center gap-2 font-semibold text-green-800">
                <FontAwesomeIcon icon={faGift} aria-hidden />
                Thanh toán thành công! Gói của bạn đang được kích hoạt.
              </p>
              <p className="mt-0.5 text-sm text-green-700 opacity-80">
                Trạng thái sẽ cập nhật trong vài giây. Vui lòng làm mới trang nếu cần.
              </p>
            </div>
          )}
          {paymentProcessing && (
            <div className="mb-app-md rounded-app-xl border border-blue-300 bg-blue-50 px-app-md py-app-sm">
              <p className="flex items-center gap-2 font-semibold text-blue-800">
                <FontAwesomeIcon icon={faClock} aria-hidden />
                Thanh toán đang được xử lý.
              </p>
              <p className="mt-0.5 text-sm text-blue-700 opacity-80">
                Bạn sẽ nhận thông báo khi gói được kích hoạt. Quá trình thường mất vài phút.
              </p>
            </div>
          )}
          {paymentFailed && (
            <div className="mb-app-md rounded-app-xl border border-red-300 bg-red-50 px-app-md py-app-sm">
              <p className="flex items-center gap-2 font-semibold text-red-800">
                <FontAwesomeIcon icon={faCircleXmark} aria-hidden />
                Thanh toán không thành công.
              </p>
              <p className="mt-0.5 text-sm text-red-700 opacity-80">
                Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-app-md rounded-app-lg border border-app-error/30 bg-red-50 px-app-md py-app-sm text-sm text-app-error">
              {error}
            </div>
          )}

          {/* ── Status Banner ── */}
          {loadingStatus ? (
            <div className="mb-app-md h-24 animate-pulse rounded-app-xl bg-surface-highest" />
          ) : status ? (
            <div className="mb-app-md">
              <StatusBanner status={status} />
              {canCancel && (
                <div className="mt-app-sm flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCancel(true)}
                    className="text-sm text-foreground-muted underline-offset-2 hover:text-app-error hover:underline"
                  >
                    Hủy đăng ký
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* ── Plan Selection ── */}
          {canSubscribe && (
            <section className="mb-app-md">
              <h2 className="mb-app-sm text-base font-bold text-foreground">
                {status?.status === 'trial' ? 'Nâng cấp lên gói trả phí' : 'Chọn gói đăng ký'}
              </h2>

              {loadingPlans ? (
                <div className="grid gap-app-sm sm:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-48 animate-pulse rounded-app-xl bg-surface-highest" />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-foreground-muted">Chưa có gói nào khả dụng.</p>
              ) : (
                <div className="grid gap-app-sm sm:grid-cols-2">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedPlanId === plan.id}
                      onSelect={() => {
                        setSelectedPlanId(plan.id)
                        setDiscountResult(null)
                      }}
                      disabled={false}
                    />
                  ))}
                </div>
              )}

              {/* Discount Code */}
              {selectedPlanId && (
                <div className="mt-app-md rounded-app-lg border border-outline-variant/60 bg-surface p-app-md">
                  <p className="mb-app-sm text-sm font-semibold text-foreground">
                    Mã giảm giá (tùy chọn)
                  </p>
                  <div className="flex gap-app-sm">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase())
                        setDiscountResult(null)
                      }}
                      placeholder="Nhập mã giảm giá..."
                      className="flex-1 rounded-app-lg border border-outline-variant/80 bg-surface-lowest px-app-sm py-2.5 text-sm uppercase tracking-wider text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/18"
                    />
                    <button
                      type="button"
                      onClick={handleValidateDiscount}
                      disabled={!discountCode.trim() || discountLoading}
                      className="rounded-app-lg bg-brand px-app-md py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                    >
                      {discountLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>

                  {discountResult && (
                    <div
                      className={`mt-app-sm rounded-app-md px-app-sm py-2 text-sm ${
                        discountResult.valid
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-app-error'
                      }`}
                    >
                      {discountResult.valid ? (
                        <>
                          <span className="font-semibold"><FontAwesomeIcon icon={faCheck} className="mr-1" />Mã hợp lệ! </span>
                          Tiết kiệm {formatPrice(discountResult.discountAmount ?? 0)} <FontAwesomeIcon icon={faArrowRight} />
                          Còn lại {formatPrice(discountResult.finalAmount ?? 0)}
                        </>
                      ) : (
                        discountResult.message ?? 'Mã không hợp lệ'
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary + CTA */}
              {selectedPlan && (
                <div className="mt-app-md rounded-app-xl border border-brand/30 bg-brand-tint/20 p-app-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{selectedPlan.name}</p>
                      <p className="text-sm text-foreground-muted">
                        {CYCLE_LABEL[selectedPlan.billingCycle]}
                        {discountResult?.valid && (
                          <span className="ml-2 font-medium text-green-700">
                            (Đã giảm {formatPrice(discountResult.discountAmount ?? 0)})
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-brand">
                      {formatPrice(
                        discountResult?.valid ? (discountResult.finalAmount ?? selectedPlan.price) : selectedPlan.price,
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="mt-app-md w-full rounded-app-lg bg-brand py-3 text-base font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-95"
                  >
                    Tiến hành thanh toán <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── Active plan summary (non-subscribe state) ── */}
          {!canSubscribe && status?.status === 'active' && (
            <section className="mb-app-md rounded-app-xl border border-outline-variant/60 bg-surface p-app-md">
              <h2 className="mb-app-xs text-sm font-bold text-foreground">Gói hiện tại</h2>
              <p className="text-2xl font-bold text-brand">
                {(status as unknown as { plan?: { name: string } })?.plan?.name ?? '—'}
              </p>
              <p className="mt-0.5 text-sm text-foreground-muted">
                Hết hạn: {formatDate(status.currentPeriodEnd)}
              </p>
            </section>
          )}

          {/* ── Payment History ── */}
          <section>
            <h2 className="mb-app-sm text-base font-bold text-foreground">Lịch sử thanh toán</h2>

            {loadingPayments ? (
              <div className="h-24 animate-pulse rounded-app-lg bg-surface-highest" />
            ) : payments.length === 0 ? (
              <div className="rounded-app-lg border border-outline-variant/40 bg-surface px-app-md py-app-lg text-center">
                <p className="text-sm text-foreground-muted">Chưa có giao dịch nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-app-lg border border-outline-variant/60 bg-surface">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
                      <th className="py-app-sm pr-app-sm pl-app-md text-xs font-semibold uppercase tracking-wide text-foreground-muted">Ngày</th>
                      <th className="py-app-sm pr-app-sm text-xs font-semibold uppercase tracking-wide text-foreground-muted">Gói</th>
                      <th className="py-app-sm pr-app-sm text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Số tiền</th>
                      <th className="py-app-sm pr-app-md text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t border-outline-variant/40">
                        <td className="py-3 pr-app-sm pl-app-md text-sm text-foreground">{formatDate(p.createdAt)}</td>
                        <td className="py-3 pr-app-sm text-sm text-foreground">{p.plan?.name ?? '—'}</td>
                        <td className="py-3 pr-app-sm text-right text-sm font-medium text-foreground">
                          {formatPrice(p.finalAmount)}
                          {p.discountAmount > 0 && (
                            <span className="ml-1 text-xs text-foreground-muted line-through">
                              {formatPrice(p.amount)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-app-md text-right">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLE[p.status]?.bg ?? 'bg-gray-100'} ${PAYMENT_STATUS_STYLE[p.status]?.text ?? 'text-gray-600'}`}>
                            {PAYMENT_STATUS_STYLE[p.status]?.label ?? p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {paymentTotal > payments.length && (
                  <p className="px-app-md py-app-sm text-center text-xs text-foreground-muted">
                    Hiển thị {payments.length} / {paymentTotal} giao dịch
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Back link */}
          <div className="mt-app-lg text-center">
            <Link href="/home" className="text-sm text-brand hover:text-brand-dark">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />Về trang chủ
            </Link>
          </div>
        </main>
      </div>

      {/* Cancel dialog */}
      {showCancel && (
        <CancelDialog
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={cancelLoading}
        />
      )}
    </AppShell>
  )
}
