'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService } from '@/lib/api/profile.service'
import { orderService, type Order, type OrderStats } from '@/lib/api/order.service'
import { reviewService } from '@/lib/api/review.service'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faUser, faWrench, faCalendarDays } from '@fortawesome/free-solid-svg-icons'

function formatVND(amount: number | string | undefined | null): string {
  const n = Number(amount ?? 0)
  if (!Number.isFinite(n)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

/** Nest trả enum dạng chữ thường (pending, in_progress); UI cũ dùng PENDING, IN_PROGRESS */
function orderStatusKey(status?: string): string {
  const v = (status ?? '').toString().toLowerCase().trim().replace(/-/g, '_')
  const map: Record<string, string> = {
    pending: 'PENDING',
    in_progress: 'IN_PROGRESS',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
    disputed: 'DISPUTED',
    provider_completed: 'PROVIDER_COMPLETED',
  }
  return map[v] || (status ? String(status).toUpperCase().replace(/-/g, '_') : '')
}

function getQuoteIdFromOrder(order: unknown): string | undefined {
  if (!order || typeof order !== 'object') return undefined
  const o = order as Record<string, unknown>
  const direct = (o.quoteId ?? o.quote_id) as string | undefined
  if (direct != null && String(direct).trim() !== '') return String(direct)
  const q = o.quote as { id?: string } | undefined
  if (q?.id) return String(q.id)
  return undefined
}

function readOrderTimestamp(order: unknown, camel: string, snake: string): string | null {
  if (!order || typeof order !== 'object') return null
  const o = order as Record<string, unknown>
  const v = o[camel] ?? o[snake]
  if (v == null || v === '') return null
  return String(v)
}

/** Backend: thợ gọi providerComplete → set providerCompletedAt, status vẫn in_progress */
function hasProviderCompleted(order: unknown): boolean {
  return Boolean(readOrderTimestamp(order, 'providerCompletedAt', 'provider_completed_at'))
}

/** Backend: khách gọi customerComplete → COMPLETED */
function hasCustomerCompleted(order: unknown): boolean {
  return Boolean(readOrderTimestamp(order, 'customerCompletedAt', 'customer_completed_at'))
}

function canProviderMarkWorkDone(order: unknown): boolean {
  if (!order || typeof order !== 'object') return false
  return orderStatusKey((order as Order).status) === 'IN_PROGRESS' && !hasProviderCompleted(order)
}

function canCustomerFinalizeOrder(order: unknown): boolean {
  if (!order || typeof order !== 'object') return false
  return (
    orderStatusKey((order as Order).status) === 'IN_PROGRESS' &&
    hasProviderCompleted(order) &&
    !hasCustomerCompleted(order)
  )
}

export default function DonHangPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [viewerUserId, setViewerUserId] = useState<string | null>(null)
  const [confirmingQuoteId, setConfirmingQuoteId] = useState<string | null>(null)
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null)
  /** Khách: chốt đơn + đánh giá trong modal */
  const [finalizeModal, setFinalizeModal] = useState<{
    order: Order
    phase: 'before_complete' | 'review_failed'
  } | null>(null)
  const [finalizeRating, setFinalizeRating] = useState(5)
  const [finalizeComment, setFinalizeComment] = useState('')
  const [finalizeReviewError, setFinalizeReviewError] = useState('')

  useEffect(() => {
    const token = AuthService.getToken()
    if (!token) {
      router.push('/dang-nhap')
      return
    }

    void (async () => {
      try {
        const me = await ProfileService.getMyProfile()
        setViewerUserId(String((me as any).id ?? '').trim() || null)
      } catch {
        try {
          const raw = localStorage.getItem('user_data')
          if (raw) {
            const u = JSON.parse(raw) as { id?: string }
            if (u?.id) setViewerUserId(String(u.id))
          }
        } catch {
          /* ignore */
        }
      }
    })()

    fetchOrders()
    fetchStats()
  }, [router, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('📦 [Orders Page] Fetching orders...')

      const response = await orderService.getOrders({
        status: statusFilter || undefined,
        limit: 50
      })
      console.log('✅ [Orders Page] Orders fetched from API:', response)
      setOrders(Array.isArray(response?.data) ? response.data : [])
      setError('')
    } catch (err: any) {
      console.error('❌ [Orders Page] Fatal error:', err)
      setError(err.message || 'Không thể tải đơn hàng từ API')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      console.log('📊 [Orders Page] Fetching stats...')

      const response = await orderService.getStats()
      console.log('✅ [Orders Page] Stats fetched from API:', response)
      setStats(response)
    } catch (err: any) {
      console.error('❌ [Orders Page] Error fetching stats:', err)
      setStats(null)
    }
  }

  const handleProviderComplete = async (orderId: string) => {
    if (
      !confirm(
        'Bạn xác nhận đã làm xong công việc?\n\nKhách sẽ nhận thông báo và có thể xác nhận hoàn tất cùng đánh giá.'
      )
    )
      return

    try {
      setCompletingOrderId(orderId)
      await orderService.providerComplete(orderId)
      await fetchOrders()
      await fetchStats()
      if (selectedOrder?.id === orderId) {
        const refreshed = await orderService.getOrderById(orderId)
        setSelectedOrder(refreshed)
      }
    } catch (err) {
      console.error('Error completing order:', err)
      alert('Không thể gửi xác nhận hoàn thành')
    } finally {
      setCompletingOrderId(null)
    }
  }

  const openFinalizeModal = (order: Order) => {
    setFinalizeRating(5)
    setFinalizeComment('')
    setFinalizeReviewError('')
    setFinalizeModal({ order, phase: 'before_complete' })
  }

  const closeFinalizeModal = () => {
    if (completingOrderId) return
    setFinalizeModal(null)
    setFinalizeReviewError('')
  }

  const submitFinalize = async () => {
    const ctx = finalizeModal
    if (!ctx) return

    const rating = finalizeRating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      alert('Vui lòng chọn đánh giá từ 1 đến 5 sao.')
      return
    }

    const orderId = ctx.order.id
    const commentTrim = finalizeComment.trim()

    try {
      setCompletingOrderId(orderId)
      setFinalizeReviewError('')

      if (ctx.phase === 'before_complete') {
        await orderService.customerComplete(orderId)
        try {
          await reviewService.createReview({
            orderId,
            rating,
            comment: commentTrim || undefined,
          })
        } catch (revErr: unknown) {
          console.error('Review after complete:', revErr)
          await fetchOrders()
          await fetchStats()
          if (selectedOrder?.id === orderId) {
            try {
              const refreshed = await orderService.getOrderById(orderId)
              setSelectedOrder(refreshed)
            } catch {
              setSelectedOrder(null)
            }
          }
          setFinalizeModal({ order: ctx.order, phase: 'review_failed' })
          setFinalizeReviewError(revErr instanceof Error ? revErr.message : 'Không gửi được đánh giá')
          return
        }
      } else {
        await reviewService.createReview({
          orderId,
          rating,
          comment: commentTrim || undefined,
        })
      }

      setFinalizeModal(null)
      setFinalizeComment('')
      setSelectedOrder(null)
      await fetchOrders()
      await fetchStats()
    } catch (err: unknown) {
      console.error('Finalize order / review:', err)
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      if (ctx.phase === 'before_complete') {
        alert(`Không thể xác nhận hoàn tất đơn: ${msg}`)
      } else {
        setFinalizeReviewError(msg)
      }
    } finally {
      setCompletingOrderId(null)
    }
  }

  const isOrderProvider = (order: Order) =>
    Boolean(viewerUserId && String(order.providerId) === String(viewerUserId))

  const isOrderCustomer = (order: Order) =>
    Boolean(viewerUserId && String(order.customerId) === String(viewerUserId))

  const filteredOrders = statusFilter
    ? orders.filter((order) => orderStatusKey(order.status) === statusFilter)
    : orders

  /** Đơn PENDING sau khi khách accept-quote-direct / request-order — thợ gọi confirm-from-quote */
  const handleProviderConfirmFromQuote = async (quoteId: string) => {
    if (!quoteId) {
      alert('Thiếu mã báo giá liên kết đơn — không thể xác nhận.')
      return
    }
    if (!confirm('Khách đã đặt đơn theo báo giá. Bạn xác nhận nhận việc và bắt đầu thực hiện?')) return
    try {
      setConfirmingQuoteId(quoteId)
      await orderService.confirmFromQuote(quoteId)
      setSelectedOrder(null)
      await fetchOrders()
      await fetchStats()
      alert('Đã xác nhận. Đơn chuyển sang trạng thái đang thực hiện.')
    } catch (err: any) {
      console.error('confirmFromQuote:', err)
      alert(err?.message || 'Không thể xác nhận đơn')
    } finally {
      setConfirmingQuoteId(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Lý do hủy đơn:')
    if (!reason) return
    
    try {
      await orderService.cancelOrder(orderId, reason)
      fetchOrders()
      fetchStats()
    } catch (err) {
      console.error('Error canceling order:', err)
      alert('Không thể hủy đơn hàng')
    }
  }

  const handleViewOrderDetail = async (orderId: string) => {
    try {
      setDetailLoadingId(orderId)
      const detail = await orderService.getOrderById(orderId)
      setSelectedOrder(detail)
    } catch (err: any) {
      alert(err?.message || 'Không thể tải chi tiết đơn hàng')
    } finally {
      setDetailLoadingId(null)
    }
  }

  // `/orders/:id` → redirect here with `?order=` (see app/orders/[id]/page.tsx)
  const orderDeepLinkHandled = useRef(false)
  useEffect(() => {
    if (orderDeepLinkHandled.current) return
    if (typeof window === 'undefined') return
    if (!AuthService.getToken()) return

    const orderId = new URLSearchParams(window.location.search).get('order')?.trim()
    if (!orderId) return

    orderDeepLinkHandled.current = true
    void (async () => {
      try {
        setDetailLoadingId(orderId)
        const detail = await orderService.getOrderById(orderId)
        setSelectedOrder(detail)
      } catch (err: any) {
        alert(err?.message || 'Không thể tải chi tiết đơn hàng')
      } finally {
        setDetailLoadingId(null)
        window.history.replaceState({}, '', '/don-hang')
      }
    })()
  }, [])

  const getStatusColor = (status: string) => {
    switch (orderStatusKey(status)) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'PROVIDER_COMPLETED':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string, order?: Order | null) => {
    const key = orderStatusKey(status)
    if (order && key === 'IN_PROGRESS') {
      if (hasProviderCompleted(order) && !hasCustomerCompleted(order)) {
        return 'Chờ khách xác nhận'
      }
      if (!hasProviderCompleted(order)) {
        return 'Đang thực hiện'
      }
    }
    switch (key) {
      case 'PENDING':
        return 'Đang chờ'
      case 'CONFIRMED':
        return 'Đã xác nhận'
      case 'IN_PROGRESS':
        return 'Đang thực hiện'
      case 'PROVIDER_COMPLETED':
        return 'Chờ khách xác nhận'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
    <div className="flex h-screen flex-col overflow-hidden bg-surface-lowest">
      <div className="flex-shrink-0 border-b border-outline-variant/60 bg-surface shadow-app-bar">
        <div className="app-container py-app-sm">
          <h1 className="mb-app-sm text-xl font-bold text-foreground">Quản lý đơn hàng</h1>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Tổng đơn</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-600 mb-1">Đang chờ</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600 mb-1">Đang làm</p>
                <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 mb-1">Đã hủy</p>
                <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === '' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'PENDING' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Đang chờ
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'IN_PROGRESS' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Đang làm
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'COMPLETED' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Hoàn thành
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'CANCELLED' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Đã hủy
            </button>
          </div>

        </div>
      </div>

      {/* Orders List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="mb-4 text-gray-300 text-6xl"><FontAwesomeIcon icon={faBox} /></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng</h3>
              <p className="text-gray-500">Các đơn hàng của bạn sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id}>
              <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status, order)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span><FontAwesomeIcon icon={faUser} className="mr-1" />{order.customerName || 'Khách hàng'}</span>
                        <span><FontAwesomeIcon icon={faWrench} className="mr-1" />{order.providerName || 'Thợ'}</span>
                        <span><FontAwesomeIcon icon={faCalendarDays} className="mr-1" />{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {orderStatusKey(order.status) === 'PENDING' &&
                        isOrderProvider(order) &&
                        getQuoteIdFromOrder(order) && (
                        <p className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                          Khách đã chấp nhận / đặt đơn — bấm <strong>Xác nhận nhận việc</strong> để bắt đầu
                          (thông báo đã gửi tới bạn).
                        </p>
                      )}
                      {canProviderMarkWorkDone(order) && isOrderProvider(order) && (
                        <p className="mt-2 text-xs text-green-900 bg-green-50 border border-green-100 rounded-md px-2 py-1.5">
                          Khi làm xong, bấm <strong>Đã làm xong việc</strong> — khách sẽ xác nhận và đánh giá.
                        </p>
                      )}
                      {canCustomerFinalizeOrder(order) && isOrderCustomer(order) && (
                        <p className="mt-2 text-xs text-blue-900 bg-blue-50 border border-blue-100 rounded-md px-2 py-1.5">
                          Thợ đã báo hoàn thành — bấm <strong>Xác nhận đã xong & đánh giá</strong> để kết thúc đơn.
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-orange-600">
                        {formatVND(order.price)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleViewOrderDetail(order.id)}
                      disabled={detailLoadingId === order.id}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      {detailLoadingId === order.id ? 'Đang tải...' : 'Xem chi tiết'}
                    </button>
                    
                    {orderStatusKey(order.status) === 'PENDING' &&
                      isOrderProvider(order) &&
                      getQuoteIdFromOrder(order) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleProviderConfirmFromQuote(String(getQuoteIdFromOrder(order)))
                          }
                          disabled={confirmingQuoteId === getQuoteIdFromOrder(order)}
                          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                        >
                          {confirmingQuoteId === getQuoteIdFromOrder(order)
                            ? 'Đang xác nhận...'
                            : 'Xác nhận nhận việc'}
                        </button>
                      )}

                    {canProviderMarkWorkDone(order) && isOrderProvider(order) && (
                      <button
                        type="button"
                        onClick={() => handleProviderComplete(order.id)}
                        disabled={completingOrderId === order.id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                      >
                        {completingOrderId === order.id ? 'Đang gửi...' : 'Đã làm xong việc'}
                      </button>
                    )}

                    {canCustomerFinalizeOrder(order) && isOrderCustomer(order) && (
                      <button
                        type="button"
                        onClick={() => openFinalizeModal(order)}
                        disabled={completingOrderId === order.id}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
                      >
                        {completingOrderId === order.id ? 'Đang gửi...' : 'Xác nhận đã xong & đánh giá'}
                      </button>
                    )}
                    
                    {(orderStatusKey(order.status) === 'PENDING' ||
                      orderStatusKey(order.status) === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {selectedOrder?.id === order.id && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-4 rounded-lg mt-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-blue-700">Chi tiết đơn hàng đã chọn</p>
                      <h3 className="text-lg font-semibold mt-1">#{selectedOrder.orderNumber}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white border border-blue-100 rounded-lg p-3">
                      <p className="text-blue-700">Giá trị đơn</p>
                      <p className="font-semibold mt-1">{formatVND(selectedOrder.price)}</p>
                    </div>
                    <div className="bg-white border border-blue-100 rounded-lg p-3">
                      <p className="text-blue-700">Trạng thái</p>
                      <p className="font-semibold mt-1">{getStatusText(selectedOrder.status, selectedOrder)}</p>
                    </div>
                    <div className="bg-white border border-blue-100 rounded-lg p-3">
                      <p className="text-blue-700">Ngày tạo</p>
                      <p className="font-semibold mt-1">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-white border border-blue-100 rounded-lg p-3 text-sm text-gray-700">
                    {selectedOrder.description || 'Không có mô tả'}
                  </div>
                  {orderStatusKey(selectedOrder.status) === 'PENDING' &&
                    isOrderProvider(selectedOrder) &&
                    getQuoteIdFromOrder(selectedOrder) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleProviderConfirmFromQuote(String(getQuoteIdFromOrder(selectedOrder)))}
                          disabled={confirmingQuoteId === getQuoteIdFromOrder(selectedOrder)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {confirmingQuoteId === getQuoteIdFromOrder(selectedOrder) ? 'Đang xác nhận...' : 'Xác nhận nhận việc'}
                        </button>
                      </div>
                    )}
                  {canCustomerFinalizeOrder(selectedOrder) && isOrderCustomer(selectedOrder) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openFinalizeModal(selectedOrder)}
                        disabled={completingOrderId === selectedOrder.id}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        {completingOrderId === selectedOrder.id ? 'Đang gửi...' : 'Xác nhận đã xong & đánh giá'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>

      {finalizeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFinalizeModal()
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finalize-review-title"
          >
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <h2 id="finalize-review-title" className="text-lg font-semibold text-gray-900">
                  {finalizeModal.phase === 'review_failed'
                    ? 'Gửi lại đánh giá'
                    : 'Xác nhận hoàn tất & đánh giá'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Đơn #{finalizeModal.order.orderNumber}
                  {finalizeModal.order.providerName ? ` · Thợ ${finalizeModal.order.providerName}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeFinalizeModal}
                disabled={Boolean(completingOrderId)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {finalizeModal.phase === 'review_failed' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Đơn đã được chốt, nhưng đánh giá chưa gửi được. Bạn có thể chỉnh sửa và thử gửi lại.
                </div>
              )}

              {finalizeReviewError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {finalizeReviewError}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Đánh giá mức độ hài lòng (1–5 sao)</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={Boolean(completingOrderId)}
                      onClick={() => setFinalizeRating(n)}
                      className={`text-3xl leading-none transition-transform hover:scale-110 disabled:opacity-50 ${
                        n <= finalizeRating ? 'text-amber-400' : 'text-gray-200'
                      }`}
                      aria-label={`${n} sao`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">{finalizeRating}/5</p>
              </div>

              <div>
                <label htmlFor="finalize-comment" className="text-sm font-medium text-gray-800 block mb-2">
                  Nhận xét (tuỳ chọn)
                </label>
                <textarea
                  id="finalize-comment"
                  rows={4}
                  maxLength={1000}
                  value={finalizeComment}
                  onChange={(e) => setFinalizeComment(e.target.value)}
                  disabled={Boolean(completingOrderId)}
                  placeholder="Ví dụ: Thợ đúng giờ, giao tiếp rõ ràng, chất lượng công việc…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{finalizeComment.length}/1000</p>
              </div>
            </div>

            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={closeFinalizeModal}
                disabled={Boolean(completingOrderId)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void submitFinalize()}
                disabled={Boolean(completingOrderId)}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {completingOrderId === finalizeModal.order.id
                  ? 'Đang xử lý...'
                  : finalizeModal.phase === 'review_failed'
                    ? 'Gửi lại đánh giá'
                    : 'Xác nhận hoàn tất & gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
