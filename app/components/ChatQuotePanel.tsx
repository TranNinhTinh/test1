'use client'

import { useState, useEffect, useCallback } from 'react'
import { quoteService, type PostQuoteGroup } from '@/lib/api/quote.service'
import { orderService } from '@/lib/api/order.service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuoteRevisionDetail {
  id: string
  revisionNumber?: number
  price: number
  description: string
  terms?: string
  estimatedDuration?: number
  changeReason?: string
  priceChange?: number
  percentChange?: number
  usedForOrderId?: string
  createdAt: string
}

export interface ChatQuotePanelProps {
  customerId: string
  providerId: string
  quoteId?: string
  currentUserRole: 'CUSTOMER' | 'PROVIDER'
  isOpen: boolean
  onClose: () => void
  onActionCompleted?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:            { label: 'Chờ phản hồi',       color: 'bg-yellow-100 text-yellow-800'  },
  accepted_for_chat:  { label: 'Đang thương lượng',   color: 'bg-blue-100 text-blue-800'     },
  revising:           { label: 'Đang xem xét lại',    color: 'bg-indigo-100 text-indigo-800' },
  order_requested:    { label: 'Đã yêu cầu đặt đơn',  color: 'bg-purple-100 text-purple-800' },
  confirmed:          { label: 'Đã tạo đơn hàng',     color: 'bg-green-100 text-green-800'   },
  rejected:           { label: 'Đã từ chối',           color: 'bg-red-100 text-red-800'       },
  cancelled:          { label: 'Đã hủy',               color: 'bg-gray-100 text-gray-600'    },
  accepted:           { label: 'Đã chấp nhận',         color: 'bg-green-100 text-green-800'  },
  expired:            { label: 'Hết hạn',              color: 'bg-gray-100 text-gray-400'    },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeStatus(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/-/g, '_').trim()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`
  }
  return `${minutes} phút`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RevisionCard({
  revision,
  index,
  total,
}: {
  revision: QuoteRevisionDetail
  index: number
  total: number
}) {
  const isLatest = index === total - 1
  const revNum = revision.revisionNumber ?? index + 1
  const isOriginal = revNum === 1

  return (
    <div
      className={`relative rounded-xl border p-4 transition-colors ${
        isLatest ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      {index < total - 1 && (
        <div className="absolute left-5 -bottom-4 w-0.5 h-4 bg-gray-200 z-10" />
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isOriginal ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'
          }`}
        >
          {isOriginal ? 'Báo giá gốc' : `Chào giá lần ${revNum}`}
        </span>
        {isLatest && (
          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
            Mới nhất
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-2 mb-2">
        <span className="text-xl font-bold text-gray-900">
          {formatCurrency(revision.price)}
        </span>
        {typeof revision.priceChange === 'number' && revision.priceChange !== 0 && (
          <span
            className={`text-xs font-semibold ${
              revision.priceChange < 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {revision.priceChange > 0 ? '+' : ''}
            {formatCurrency(revision.priceChange)}
            {typeof revision.percentChange === 'number' && (
              <span className="ml-1 opacity-80">
                ({revision.percentChange > 0 ? '+' : ''}
                {revision.percentChange.toFixed(1)}%)
              </span>
            )}
          </span>
        )}
      </div>

      {revision.description && (
        <p className="text-sm text-gray-700 leading-relaxed mb-2">{revision.description}</p>
      )}

      {revision.terms && (
        <p className="text-xs text-gray-500 italic mb-2">{revision.terms}</p>
      )}

      {revision.changeReason && (
        <div className="mt-2 text-xs text-gray-500 border-l-2 border-orange-300 pl-2 leading-relaxed">
          <span className="font-medium text-orange-700">Lý do điều chỉnh: </span>
          {revision.changeReason}
        </div>
      )}

      {revision.estimatedDuration && revision.estimatedDuration > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Thời gian dự kiến: {formatDuration(revision.estimatedDuration)}
        </div>
      )}

      <div className="mt-2.5 text-xs text-gray-400">{formatDateTime(revision.createdAt)}</div>

      {revision.usedForOrderId && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Đã được dùng cho đơn hàng
        </div>
      )}
    </div>
  )
}

function PostQuoteSection({
  group,
  currentUserRole,
  onPlaceOrder,
  onConfirmOrder,
  actionLoadingId,
}: {
  group: PostQuoteGroup
  currentUserRole: 'CUSTOMER' | 'PROVIDER'
  onPlaceOrder: (quoteId: string) => void
  onConfirmOrder: (quoteId: string) => void
  actionLoadingId: string | null
}) {
  const [expanded, setExpanded] = useState(true)
  const { quote, postTitle, quoteId } = group
  const statusKey = normalizeStatus(quote.status)
  const statusCfg = STATUS_CONFIG[statusKey] ?? { label: quote.status, color: 'bg-gray-100 text-gray-600' }
  const currentPrice = (quote.currentPrice ?? quote.price) || 0
  const revisions = quote.revisions ?? []
  const isLoading = actionLoadingId === quoteId

  const customerCanPlaceOrder =
    currentUserRole === 'CUSTOMER' && (statusKey === 'accepted_for_chat' || statusKey === 'revising')
  const customerWaiting = currentUserRole === 'CUSTOMER' && statusKey === 'order_requested'
  const customerConfirmed = currentUserRole === 'CUSTOMER' && statusKey === 'confirmed'
  const providerCanConfirm = currentUserRole === 'PROVIDER' && statusKey === 'order_requested'
  const providerConfirmed = currentUserRole === 'PROVIDER' && statusKey === 'confirmed'
  const providerNegotiating =
    currentUserRole === 'PROVIDER' && (statusKey === 'accepted_for_chat' || statusKey === 'revising')

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-800 truncate">{postTitle}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Giá hiện tại</span>
              <span className="font-bold text-blue-700">{formatCurrency(currentPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Lần báo giá</span>
              <span className="font-medium text-gray-800">{revisions.length} lần</span>
            </div>
            {quote.chatOpenedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Bắt đầu thương lượng</span>
                <span className="text-xs text-gray-600">{formatDateTime(quote.chatOpenedAt)}</span>
              </div>
            )}
            {quote.orderRequestedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Yêu cầu đặt đơn</span>
                <span className="text-xs text-gray-600">{formatDateTime(quote.orderRequestedAt)}</span>
              </div>
            )}
          </div>

          {/* Revision history */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Lịch sử báo giá (cũ → mới)
            </h4>
            {revisions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có lịch sử báo giá</p>
            ) : (
              <div className="relative space-y-4">
                {revisions.map((rev, idx) => (
                  <RevisionCard key={rev.id} revision={rev} index={idx} total={revisions.length} />
                ))}
              </div>
            )}
          </div>

          {/* Per-quote action buttons */}
          <div className="space-y-2">
            {customerCanPlaceOrder && (
              <button
                type="button"
                onClick={() => onPlaceOrder(quoteId)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Đặt đơn với giá hiện tại'
                )}
              </button>
            )}

            {customerWaiting && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-purple-50 border border-purple-200 py-2.5 text-sm text-purple-700 font-medium">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Đã yêu cầu đặt đơn — chờ thợ xác nhận
              </div>
            )}

            {customerConfirmed && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 py-2.5 text-sm text-green-700 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đã tạo đơn hàng — đang tiến hành
              </div>
            )}

            {providerCanConfirm && (
              <button
                type="button"
                onClick={() => onConfirmOrder(quoteId)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận nhận việc'
                )}
              </button>
            )}

            {providerConfirmed && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 py-2.5 text-sm text-green-700 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đã tạo đơn hàng — đang tiến hành
              </div>
            )}

            {providerNegotiating && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 py-2.5 px-3 text-sm text-blue-700 text-center">
                Đang thương lượng — chờ khách hàng đặt đơn
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatQuotePanel({
  customerId,
  providerId,
  quoteId,
  currentUserRole,
  isOpen,
  onClose,
  onActionCompleted,
}: ChatQuotePanelProps) {
  const [groups, setGroups] = useState<PostQuoteGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const groups = await quoteService.getQuotesBetweenUsers(customerId, providerId)
      setGroups(groups as PostQuoteGroup[])
    } catch (err: any) {
      setFetchError(err.message || 'Không thể tải thông tin báo giá')
    } finally {
      setLoading(false)
    }
  }, [customerId, providerId])

  useEffect(() => {
    if (isOpen) {
      void loadGroups()
    }
  }, [isOpen, loadGroups])

  useEffect(() => {
    if (!actionSuccess) return
    const t = setTimeout(() => setActionSuccess(''), 4000)
    return () => clearTimeout(t)
  }, [actionSuccess])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handlePlaceOrder = async (quoteId: string) => {
    setActionLoadingId(quoteId)
    setActionError('')
    try {
      await quoteService.requestOrder(quoteId)
      setActionSuccess('Đặt đơn thành công! Đang chờ thợ xác nhận.')
      await loadGroups()
      onActionCompleted?.()
    } catch (err: any) {
      setActionError(err.message || 'Không thể đặt đơn. Vui lòng thử lại.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmOrder = async (quoteId: string) => {
    setActionLoadingId(quoteId)
    setActionError('')
    try {
      await orderService.confirmFromQuote(quoteId)
      setActionSuccess('Xác nhận nhận việc thành công! Đơn hàng bắt đầu tiến hành.')
      await loadGroups()
      onActionCompleted?.()
    } catch (err: any) {
      setActionError(err.message || 'Không thể xác nhận đơn. Vui lòng thử lại.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-label="Quản lý báo giá"
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* ── Panel header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">Quản lý báo giá</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Đóng panel báo giá"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && fetchError && (
            <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {fetchError}
              <button
                type="button"
                onClick={() => void loadGroups()}
                className="ml-2 underline hover:no-underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !fetchError && (
            <div className="p-4 space-y-3">
              {actionSuccess && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              {groups.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">
                  Chưa có báo giá nào trong cuộc trò chuyện này
                </p>
              ) : (
                groups.map((group) => (
                  <PostQuoteSection
                    key={group.quoteId}
                    group={group}
                    currentUserRole={currentUserRole}
                    onPlaceOrder={handlePlaceOrder}
                    onConfirmOrder={handleConfirmOrder}
                    actionLoadingId={actionLoadingId}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Footer — always show refresh ─────────────────────────────── */}
        {!loading && (
          <div className="shrink-0 border-t bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => void loadGroups()}
              disabled={loading}
              className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Làm mới
            </button>
          </div>
        )}
      </div>
    </>
  )
}
