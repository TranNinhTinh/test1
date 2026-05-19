'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { quoteService, type Quote } from '@/lib/api/quote.service'
import { orderService } from '@/lib/api/order.service'
import { chatService } from '@/lib/api/chat.service'
import { ProfileService } from '@/lib/api/profile.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { useRouter } from 'next/navigation'
import { resolveMediaUrl as normalizeImageUrl } from '@/lib/media-url'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoneyBillWave, faClock } from '@fortawesome/free-solid-svg-icons'

interface QuoteSectionProps {
  postId: string
  /** Từ trang cha (có thể sai nếu thiếu user_data) */
  isPostOwner: boolean
  /** ID khách đăng bài — từ API bài đăng; dùng cùng getMyProfile để bật đúng 3 nút */
  postCustomerId?: string
}

const normStatus = (status?: string) =>
  (status ?? '').toString().toLowerCase().trim().replace(/-/g, '_')

const isPending = (s: string) => s === 'pending'
const isNegotiating = (s: string) => s === 'accepted_for_chat' || s === 'revising'

const noCustomerActions = (s: string) =>
  ['rejected', 'cancelled', 'order_requested', 'confirmed', 'expired', 'accepted'].includes(s)

export default function QuoteSection({ postId, isPostOwner, postCustomerId }: QuoteSectionProps) {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewerUserId, setViewerUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
        if (raw) {
          const u = JSON.parse(raw) as Record<string, unknown>
          const fromLs = String(u?.id ?? u?.userId ?? u?.sub ?? '').trim()
          if (fromLs && !cancelled) setViewerUserId(fromLs)
        }
      } catch {
        /* ignore */
      }
      try {
        const me = await ProfileService.getMyProfile()
        if (cancelled) return
        const id = String((me as any).id ?? '').trim()
        if (id) setViewerUserId(id)
      } catch {
        /* vẫn dùng id từ localStorage nếu có */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId])

  const ownerIdNorm = (postCustomerId ?? '').toString().trim()
  const viewerIdNorm = (viewerUserId ?? '').toString().trim()
  const isCustomerPostOwner = useMemo(() => {
    if (ownerIdNorm && viewerIdNorm && ownerIdNorm === viewerIdNorm) return true
    return Boolean(isPostOwner)
  }, [ownerIdNorm, viewerIdNorm, isPostOwner])

  const navigateToQuoteChat = useCallback(
    async (quoteId: string) => {
      try {
        const convs = await chatService.getConversations()
        const c = convs.find(
          (x) => String((x as any).quoteId ?? (x as any).quote_id ?? '') === quoteId
        )
        if (c?.id) {
          router.push(`/tin-nhan?conversation=${encodeURIComponent(c.id)}`)
          return
        }
      } catch (e) {
        console.error('navigateToQuoteChat:', e)
      }
      router.push('/tin-nhan')
    },
    [router]
  )

  useEffect(() => {
    void loadQuotes()
  }, [postId, isCustomerPostOwner])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const raw = await quoteService.getQuotesByPostId(postId)
      const arr = Array.isArray(raw) ? raw : (raw as any)?.data
      const data: Quote[] = Array.isArray(arr) ? arr : []

      const enhancedQuotes = await Promise.all(
        data.map(async (quote) => {
          const quoteData = quote as any
          let providerName = quote.providerName || 'Thợ'
          let providerAvatar: string | undefined =
            normalizeImageUrl(
              quote.providerAvatar ||
                quoteData.providerAvatarUrl ||
                quoteData.avatar ||
                quoteData.avatarUrl ||
                quoteData.provider?.avatar ||
                quoteData.provider?.avatarUrl
            ) || undefined

          if (quote.providerId) {
            try {
              const profile = await ProfileService.getUserProfile(quote.providerId)
              const profileData = profile as any
              providerName = profileData.displayName || profileData.fullName || providerName
              providerAvatar =
                normalizeImageUrl(profileData.avatarUrl || profileData.avatar || providerAvatar) ||
                providerAvatar

              if (!providerAvatar && typeof window !== 'undefined') {
                const avatarKey = `user_avatar_${quote.providerId}`
                const savedAvatar = localStorage.getItem(avatarKey)
                if (savedAvatar) {
                  providerAvatar = normalizeImageUrl(savedAvatar) || undefined
                }
              }
            } catch (error) {
              console.error('Error loading provider profile:', error)
            }
          }

          return {
            ...quote,
            status: normStatus(quote.status),
            providerName,
            providerAvatar: providerAvatar || undefined,
          } as Quote
        })
      )

      enhancedQuotes.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setQuotes(enhancedQuotes)
    } catch (err) {
      console.error('Error loading quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  /** Trao đổi thêm — giống Mobile: pending → accept-for-chat rồi mở chat; đang thương lượng → chỉ mở chat */
  const handleExchangeMore = async (quoteId: string, statusKey: string) => {
    if (processingId) return
    try {
      setProcessingId(quoteId)
      if (isPending(statusKey)) {
        const result = await quoteService.acceptQuoteForChat(quoteId)
        if (!chatSocketService.isConnected()) {
          chatSocketService.connect()
          await new Promise((r) => setTimeout(r, 400))
        }
        if (result.conversationId) {
          await chatSocketService.joinConversation(result.conversationId)
        }
        await loadQuotes()
        await navigateToQuoteChat(quoteId)
      } else if (isNegotiating(statusKey)) {
        await navigateToQuoteChat(quoteId)
      }
    } catch (error: any) {
      console.error('handleExchangeMore:', error)
      alert(error?.message || 'Không thể mở trao đổi')
    } finally {
      setProcessingId(null)
    }
  }

  /** Chấp nhận (tạo đơn) — pending: accept-quote-direct; accepted_for_chat/revising: request-order */
  const handleAcceptOrder = async (quoteId: string, statusKey: string) => {
    if (processingId) return
    try {
      setProcessingId(quoteId)
      if (isPending(statusKey)) {
        await orderService.acceptQuoteDirect(quoteId)
        alert('Đã tạo đơn hàng. Thợ sẽ xác nhận sớm.')
      } else if (isNegotiating(statusKey)) {
        await quoteService.requestOrder(quoteId)
        alert('Đã gửi yêu cầu đặt đơn theo giá hiện tại.')
      } else {
        return
      }
      await loadQuotes()
      router.push('/don-hang')
    } catch (error: any) {
      console.error('handleAcceptOrder:', error)
      alert(error?.message || 'Không thể thực hiện')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectQuote = async (quoteId: string) => {
    if (processingId) return
    const reason = window.prompt('Lý do từ chối (tuỳ chọn):') ?? ''
    try {
      setProcessingId(quoteId)
      await quoteService.rejectQuote(quoteId, reason.trim() || undefined)
      await loadQuotes()
      alert('Đã từ chối chào giá')
    } catch (error: any) {
      console.error('handleRejectQuote:', error)
      alert(error?.message || 'Không thể từ chối')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    const s = normStatus(status)
    switch (s) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted_for_chat':
      case 'revising':
        return 'bg-blue-100 text-blue-800'
      case 'order_requested':
        return 'bg-purple-100 text-purple-800'
      case 'confirmed':
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    const s = normStatus(status)
    const map: Record<string, string> = {
      pending: 'Đang chờ',
      accepted_for_chat: 'Đang trao đổi',
      revising: 'Đang chỉnh sửa giá',
      order_requested: 'Đã yêu cầu đặt đơn',
      confirmed: 'Đã tạo đơn hàng',
      accepted: 'Đã chấp nhận',
      rejected: 'Đã từ chối',
      cancelled: 'Đã hủy',
      expired: 'Hết hạn',
    }
    return map[s] || status
  }

  const formatPrice = (q: Quote) => {
    const n = Number(q.price)
    if (Number.isNaN(n)) return '—'
    return `${n.toLocaleString('vi-VN')} đ`
  }

  const renderQuoteCard = (quote: Quote, readOnly: boolean) => {
    const s = normStatus(quote.status)
    const busy = processingId === quote.id
    const finished = noCustomerActions(s)
    const exchangeEnabled = !busy && !finished && (isPending(s) || isNegotiating(s))
    const acceptOrderEnabled = !busy && !finished && (isPending(s) || isNegotiating(s))
    const rejectEnabled = !busy && !finished && isPending(s)

    return (
      <div
        key={quote.id}
        className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg hover:border-blue-400 transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => quote.providerId && router.push(`/profile/${quote.providerId}`)}
          >
            {quote.providerAvatar ? (
              <img
                src={quote.providerAvatar}
                alt={quote.providerName || 'Thợ'}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {(quote.providerName || 'T').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {quote.providerName || 'Thợ'}
              </p>
              <p className="text-xs text-gray-400">Nhấn để xem profile</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-orange-600">{formatPrice(quote)}</p>
            <span
              className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(quote.status)}`}
            >
              {getStatusText(quote.status)}
            </span>
          </div>
        </div>

        {quote.description ? (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400">
            <p className="text-sm text-gray-700">{quote.description}</p>
          </div>
        ) : null}

        {!readOnly && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                disabled={!exchangeEnabled}
                title="Mở chat với thợ để trao đổi thêm; chốt giá rồi mới bấm Chấp nhận để lên đơn."
                onClick={() => void handleExchangeMore(quote.id, s)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                Trao đổi thêm
              </button>
              <button
                type="button"
                disabled={!acceptOrderEnabled}
                title="Tạo đơn theo giá chào hiện tại (pending: ngay; sau trao đổi: yêu cầu đặt đơn)."
                onClick={() => void handleAcceptOrder(quote.id, s)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                Chấp nhận
              </button>
              <button
                type="button"
                disabled={!rejectEnabled}
                title="Chỉ từ chối được khi chào giá đang chờ (pending)."
                onClick={() => void handleRejectQuote(quote.id)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-red-400 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Từ chối
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-600">
              Trao đổi thêm → chat · Chấp nhận → đặt đơn · Từ chối → bỏ chào giá
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
          {quote.estimatedDuration ? (
            <span className="text-gray-600">
              <FontAwesomeIcon icon={faClock} className="mr-1" /> Dự kiến:{' '}
              {quote.estimatedDuration >= 60
                ? `${Math.floor(quote.estimatedDuration / 60)}h ${
                    quote.estimatedDuration % 60 > 0 ? `${quote.estimatedDuration % 60}m` : ''
                  }`
                : `${quote.estimatedDuration} phút`}
            </span>
          ) : (
            <span className="text-gray-400">Không có thời gian dự kiến</span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    )
  }

  if (!isCustomerPostOwner) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4 space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-3"><FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-green-600" />Các chào giá ({quotes.length})</h3>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Đang tải...</p>
          ) : quotes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Chưa có báo giá</p>
          ) : (
            <div className="space-y-3">{quotes.map((q) => renderQuoteCard(q, true))}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Các chào giá ({quotes.length})
      </h3>

      {loading ? (
        <p className="text-center text-gray-500 py-4">Đang tải...</p>
      ) : quotes.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Chưa có chào giá</p>
      ) : (
        <div className="space-y-3">{quotes.map((q) => renderQuoteCard(q, false))}</div>
      )}
    </div>
  )
}
