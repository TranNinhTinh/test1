'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService } from '@/lib/api/profile-new.service'
import {
  customRequestService,
  type CustomRequest,
  type QuoteForCustomRequest,
} from '@/lib/api/custom-request.service'
import { quoteService } from '@/lib/api/quote.service'
import { orderService } from '@/lib/api/order.service'
import { chatService } from '@/lib/api/chat.service'
import { resolveMediaUrl } from '@/lib/media-url'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'

type ViewerRole = 'customer' | 'provider' | null

const REQUEST_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}
const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ phản hồi',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
}

const QUOTE_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ khách phản hồi',
  accepted_for_chat: 'Đang trao đổi',
  revising: 'Đang chỉnh sửa giá',
  order_requested: 'Đã yêu cầu đặt đơn',
  confirmed: 'Đã tạo đơn hàng',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
  expired: 'Đã hết hạn',
}
const QUOTE_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted_for_chat: 'bg-blue-100 text-blue-800',
  revising: 'bg-blue-100 text-blue-800',
  order_requested: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <span className="text-sm text-gray-500 min-w-36">{label}</span>
      <span className="text-sm text-gray-900 font-medium flex-1">{value}</span>
    </div>
  )
}

function UserCard({ user, role }: { user: CustomRequest['customer']; role: string }) {
  if (!user) return null
  const name = user.displayName || user.fullName || role
  const avatar = resolveMediaUrl(user.avatarUrl)
  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold text-sm">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div>
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  )
}

export default function CustomRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [myId, setMyId] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<ViewerRole>(null)
  const [request, setRequest] = useState<CustomRequest | null>(null)
  const [quote, setQuote] = useState<QuoteForCustomRequest | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(true)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [error, setError] = useState('')

  // Provider: accept request modal
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [acceptPrice, setAcceptPrice] = useState('')
  const [acceptDesc, setAcceptDesc] = useState('')
  const [acceptDuration, setAcceptDuration] = useState('')
  const [acceptTerms, setAcceptTerms] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  // Provider: reject request modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  // Customer: quote actions (shared processing state, mirrors QuoteSection)
  const [processingQuote, setProcessingQuote] = useState(false)
  const [quoteActionError, setQuoteActionError] = useState('')

  // Customer: reject quote modal
  const [showRejectQuoteModal, setShowRejectQuoteModal] = useState(false)
  const [rejectQuoteReason, setRejectQuoteReason] = useState('')
  const [rejectingQuote, setRejectingQuote] = useState(false)
  const [rejectQuoteError, setRejectQuoteError] = useState('')

  useEffect(() => {
    if (!AuthService.getToken()) {
      router.replace('/dang-nhap')
      return
    }
    loadMe()
  }, [])

  useEffect(() => {
    if (myId) loadRequest()
  }, [myId])

  const loadQuote = useCallback(async () => {
    try {
      setLoadingQuote(true)
      const q = await customRequestService.getQuote(requestId)
      setQuote(q)
    } catch {
      /* quote may not exist yet */
    } finally {
      setLoadingQuote(false)
    }
  }, [requestId])

  useEffect(() => {
    if (request?.status === 'accepted') loadQuote()
  }, [request, loadQuote])

  const loadMe = async () => {
    try {
      const profile = await ProfileService.getMyProfile()
      setMyId(String((profile as any).id ?? ''))
      setMyRole(profile.role ?? 'customer')
    } catch {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      if (raw) {
        try {
          const u = JSON.parse(raw) as { id?: string; role?: string }
          setMyId(u.id ?? null)
          setMyRole((u.role as ViewerRole) ?? 'customer')
        } catch { /* ignore */ }
      }
    }
  }

  const loadRequest = async () => {
    try {
      setLoadingRequest(true)
      setError('')
      const data = await customRequestService.getById(requestId)
      setRequest(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải yêu cầu')
    } finally {
      setLoadingRequest(false)
    }
  }

  // Navigate to the chat conversation linked to this quote
  const navigateToChat = async (quoteId: string) => {
    try {
      const convs = await chatService.getConversations()
      const c = convs.find(
        (x) => String((x as any).quoteId ?? (x as any).quote_id ?? '') === quoteId,
      )
      if (c?.id) {
        router.push(`/tin-nhan?conversation=${encodeURIComponent(c.id)}`)
        return
      }
    } catch { /* fallback */ }
    router.push('/tin-nhan')
  }

  // Provider: accept custom request and send quote
  const handleAcceptRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setAcceptError('')
    const price = parseFloat(acceptPrice)
    if (!price || price <= 0) { setAcceptError('Vui lòng nhập giá báo hợp lệ.'); return }
    if (!acceptDesc.trim()) { setAcceptError('Vui lòng mô tả phạm vi công việc.'); return }
    try {
      setAccepting(true)
      const scheduledLine = acceptDuration
        ? `Thời gian đến làm: ${new Date(acceptDuration).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}`
        : ''
      const finalTerms = [scheduledLine, acceptTerms.trim()].filter(Boolean).join('\n') || undefined
      const updated = await customRequestService.accept(requestId, {
        acceptedPrice: price,
        quoteDescription: acceptDesc.trim(),
        terms: finalTerms,
      })
      setRequest(updated)
      setShowAcceptModal(false)
      await loadQuote()
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Không thể chấp nhận yêu cầu')
    } finally {
      setAccepting(false)
    }
  }

  // Provider: reject custom request
  const handleRejectRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setRejectError('')
    try {
      setRejecting(true)
      const updated = await customRequestService.reject(requestId, rejectReason.trim() || undefined)
      setRequest(updated)
      setShowRejectModal(false)
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Không thể từ chối yêu cầu')
    } finally {
      setRejecting(false)
    }
  }

  // ─── "Trao đổi thêm" ───
  // pending  → acceptQuoteForChat then open chat
  // accepted_for_chat / revising → just open chat
  const handleExchangeMore = async () => {
    if (!quote || processingQuote) return
    setQuoteActionError('')
    setProcessingQuote(true)
    try {
      const s = quote.status
      if (s === 'pending') {
        const result = await quoteService.acceptQuoteForChat(quote.id)
        await loadQuote()
        if (result.conversationId) {
          router.push(`/tin-nhan?conversation=${encodeURIComponent(result.conversationId)}`)
        } else {
          await navigateToChat(quote.id)
        }
      } else if (s === 'accepted_for_chat' || s === 'revising') {
        await navigateToChat(quote.id)
      }
    } catch (err) {
      setQuoteActionError(err instanceof Error ? err.message : 'Không thể mở trao đổi')
      // Refresh so UI stays in sync with DB state after any failure
      await loadQuote().catch(() => {})
    } finally {
      setProcessingQuote(false)
    }
  }

  // ─── "Chấp nhận" ───
  // pending              → acceptQuoteDirect (tạo đơn ngay)
  // accepted_for_chat / revising → requestOrder (thợ xác nhận)
  const handleAcceptOrder = async () => {
    if (!quote || processingQuote) return
    setQuoteActionError('')
    setProcessingQuote(true)
    try {
      const s = quote.status
      if (s === 'pending') {
        await orderService.acceptQuoteDirect(quote.id)
      } else if (s === 'accepted_for_chat' || s === 'revising') {
        await quoteService.requestOrder(quote.id)
      } else {
        return
      }
      await loadQuote()
      router.push('/don-hang')
    } catch (err) {
      setQuoteActionError(err instanceof Error ? err.message : 'Không thể thực hiện')
    } finally {
      setProcessingQuote(false)
    }
  }

  // ─── "Từ chối" ─── (only when pending)
  const handleRejectQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote) return
    setRejectQuoteError('')
    setRejectingQuote(true)
    try {
      await quoteService.rejectQuote(quote.id, rejectQuoteReason.trim() || undefined)
      await loadQuote()
      setShowRejectQuoteModal(false)
      setRejectQuoteReason('')
    } catch (err) {
      setRejectQuoteError(err instanceof Error ? err.message : 'Không thể từ chối báo giá')
    } finally {
      setRejectingQuote(false)
    }
  }

  if (loadingRequest) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center bg-surface-lowest">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !request) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy yêu cầu'}</p>
          <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Quay lại
          </button>
        </div>
      </AppShell>
    )
  }

  const isCustomer = myId === request.customerId
  const isProvider = myId === request.providerId
  const isPending = request.status === 'pending'
  const isAccepted = request.status === 'accepted'
  const isRejected = request.status === 'rejected'

  const quoteStatus = quote?.status ?? ''
  const isPendingQ = quoteStatus === 'pending'
  const isNegotiatingQ = quoteStatus === 'accepted_for_chat' || quoteStatus === 'revising'
  const noActionsQ = ['rejected', 'cancelled', 'order_requested', 'confirmed', 'expired'].includes(quoteStatus)

  const exchangeEnabled = !processingQuote && !noActionsQ && (isPendingQ || isNegotiatingQ)
  const acceptOrderEnabled = !processingQuote && !noActionsQ && (isPendingQ || isNegotiatingQ)
  const rejectEnabled = !processingQuote && !noActionsQ && isPendingQ

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col bg-surface-lowest">

        <div className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <button
              onClick={() => router.push('/yeu-cau-rieng')}
              className="text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center gap-1 text-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />Danh sách yêu cầu
            </button>

            {/* Status banner */}
            <div
              className={`mb-6 rounded-xl px-4 py-3 flex items-center gap-3 ${
                isAccepted ? 'bg-green-50 border border-green-200'
                  : isRejected ? 'bg-red-50 border border-red-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}
            >
              <span className={`flex-shrink-0 text-sm font-semibold px-3 py-1 rounded-full ${REQUEST_STATUS_COLOR[request.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {REQUEST_STATUS_LABEL[request.status] ?? request.status}
              </span>
              <span className="text-sm text-gray-700">
                {isPending && isCustomer && 'Đang chờ thợ xem xét và phản hồi.'}
                {isPending && isProvider && 'Khách hàng đang chờ bạn phản hồi.'}
                {isAccepted && isCustomer && 'Thợ đã chấp nhận và gửi báo giá. Xem chi tiết bên dưới.'}
                {isAccepted && isProvider && 'Bạn đã chấp nhận và gửi báo giá cho khách.'}
                {isRejected && isCustomer && 'Thợ đã từ chối yêu cầu của bạn.'}
                {isRejected && isProvider && 'Bạn đã từ chối yêu cầu này.'}
              </span>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Các bên tham gia</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Khách hàng</p>
                  <UserCard user={request.customer} role="Khách hàng" />
                </div>
                <div className="hidden sm:flex items-center text-gray-300 text-2xl"><FontAwesomeIcon icon={faArrowRight} /></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Thợ / Nhà cung cấp</p>
                  <UserCard user={request.provider} role="Thợ" />
                </div>
              </div>
            </div>

            {/* Request details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Chi tiết yêu cầu</h2>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{request.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{request.description}</p>
              <div className="space-y-2.5 border-t pt-4">
                <InfoRow label="Địa điểm" value={request.location} />
                <InfoRow
                  label="Thời gian mong muốn"
                  value={request.desiredTime ? new Date(request.desiredTime).toLocaleString('vi-VN', { dateStyle: 'long', timeStyle: 'short' }) : null}
                />
                <InfoRow
                  label="Ngân sách dự kiến"
                  value={request.budget ? `${Number(request.budget).toLocaleString('vi-VN')} VNĐ` : null}
                />
                <InfoRow label="Gửi lúc" value={new Date(request.createdAt).toLocaleString('vi-VN')} />
              </div>
            </div>

            {/* Rejection reason (request) */}
            {isRejected && request.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-4">
                <p className="text-sm font-semibold text-red-800 mb-1">Lý do từ chối</p>
                <p className="text-sm text-red-700">{request.rejectionReason}</p>
              </div>
            )}

            {/* ─── QUOTE SECTION ─── */}
            {isAccepted && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Báo giá từ thợ</h2>
                  {quote && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${QUOTE_STATUS_COLOR[quoteStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {QUOTE_STATUS_LABEL[quoteStatus] ?? quoteStatus}
                    </span>
                  )}
                </div>

                {loadingQuote ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto" />
                  </div>
                ) : quote ? (
                  <div className="space-y-3">
                    {/* Price */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <span className="text-sm text-gray-600 font-medium">Giá báo</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {Number(quote.price).toLocaleString('vi-VN')} <span className="text-base font-semibold">đ</span>
                      </span>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phạm vi công việc</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{quote.description}</p>
                    </div>

                    {quote.estimatedDuration && (
                      <InfoRow
                        label="Thời gian ước tính"
                        value={
                          quote.estimatedDuration >= 60
                            ? `${Math.floor(quote.estimatedDuration / 60)}h ${quote.estimatedDuration % 60 > 0 ? `${quote.estimatedDuration % 60}m` : ''}`
                            : `${quote.estimatedDuration} phút`
                        }
                      />
                    )}

                    {quote.terms && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Điều khoản</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.terms}</p>
                      </div>
                    )}

                    {/* ─── CUSTOMER: THREE ACTION BUTTONS (same logic as QuoteSection) ─── */}
                    {isCustomer && !noActionsQ && (
                      <div className="pt-3 border-t mt-3">
                        {quoteActionError && (
                          <p className="text-xs text-red-600 mb-3 text-center">{quoteActionError}</p>
                        )}
                        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                              type="button"
                              disabled={!exchangeEnabled}
                              onClick={() => void handleExchangeMore()}
                              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                              {processingQuote ? (
                                <span className="flex items-center justify-center gap-1.5">
                                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  Đang xử lý...
                                </span>
                              ) : 'Trao đổi thêm'}
                            </button>
                            <button
                              type="button"
                              disabled={!acceptOrderEnabled}
                              onClick={() => void handleAcceptOrder()}
                              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                              Chấp nhận
                            </button>
                            <button
                              type="button"
                              disabled={!rejectEnabled}
                              onClick={() => setShowRejectQuoteModal(true)}
                              className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-red-400 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Từ chối
                            </button>
                          </div>
                          <p className="mt-2 text-center text-xs text-gray-600">
                            Trao đổi thêm → chat · Chấp nhận → đặt đơn · Từ chối → bỏ báo giá
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Customer: status info when no actions available */}
                    {isCustomer && noActionsQ && (
                      <div className="pt-3 border-t mt-3">
                        {quoteStatus === 'order_requested' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-purple-800 mb-1">Yêu cầu đặt đơn đã gửi</p>
                            <p className="text-xs text-purple-700 mb-3">Đang chờ thợ xác nhận và tạo đơn hàng.</p>
                            <button onClick={() => navigateToChat(quote.id)} className="text-xs text-blue-600 hover:underline">
                              Nhắn tin với thợ <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                          </div>
                        )}
                        {quoteStatus === 'confirmed' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-green-800 mb-2">Đơn hàng đã được tạo!</p>
                            <button
                              onClick={() => router.push('/don-hang')}
                              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                            >
                              Xem đơn hàng của tôi
                            </button>
                          </div>
                        )}
                        {(quoteStatus === 'rejected' || quoteStatus === 'cancelled' || quoteStatus === 'expired') && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center">
                            <p className="text-sm text-gray-600 mb-3">
                              {quoteStatus === 'rejected' && 'Bạn đã từ chối báo giá này.'}
                              {quoteStatus === 'cancelled' && 'Báo giá này đã bị hủy.'}
                              {quoteStatus === 'expired' && 'Báo giá này đã hết hạn.'}
                            </p>
                            <button onClick={() => router.push('/posts/search')} className="text-sm text-blue-600 hover:underline">
                              Tìm thợ khác <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── PROVIDER VIEW OF QUOTE STATUS ─── */}
                    {isProvider && (
                      <div className="pt-3 border-t mt-3">
                        {isPendingQ && (
                          <p className="text-xs text-center text-gray-500">Đang chờ khách hàng xem xét và phản hồi báo giá.</p>
                        )}
                        {isNegotiatingQ && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => navigateToChat(quote.id)}
                              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                            >
                              <FontAwesomeIcon icon={faComments} className="mr-1" />Nhắn tin với khách
                            </button>
                          </div>
                        )}
                        {quoteStatus === 'order_requested' && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-orange-800 mb-1">Khách đã yêu cầu đặt đơn!</p>
                            <p className="text-xs text-orange-700 mb-3">Vào trang đơn hàng để xem xét và xác nhận.</p>
                            <button
                              onClick={() => router.push('/don-hang')}
                              className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700"
                            >
                              Xem &amp; xác nhận đơn hàng
                            </button>
                          </div>
                        )}
                        {quoteStatus === 'confirmed' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-green-800 mb-2">Đơn hàng đã xác nhận!</p>
                            <button onClick={() => router.push('/don-hang')} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                              Xem đơn hàng
                            </button>
                          </div>
                        )}
                        {(quoteStatus === 'rejected' || quoteStatus === 'cancelled') && (
                          <p className="text-xs text-center text-gray-500">
                            {quoteStatus === 'rejected' ? 'Khách hàng đã từ chối báo giá.' : 'Báo giá đã được hủy.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có thông tin báo giá.</p>
                )}
              </div>
            )}

            {/* Provider action buttons (pending state) */}
            {isProvider && isPending && (
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 px-4 py-3 border border-red-300 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-50"
                >
                  Từ chối yêu cầu
                </button>
                <button
                  onClick={() => setShowAcceptModal(true)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
                >
                  Chấp nhận &amp; gửi báo giá
                </button>
              </div>
            )}

            {/* Customer CTA when request is rejected */}
            {isCustomer && isRejected && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <p className="text-sm text-gray-700 mb-4">Bạn có thể tìm thợ khác và gửi yêu cầu mới.</p>
                <button
                  onClick={() => router.push('/posts/search')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Tìm thợ khác
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: Provider accept request ─── */}
      {showAcceptModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAcceptModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header — matches "Chào giá cho bài đăng" brand color */}
            <div className="flex items-center gap-3 bg-[#0D9488] px-6 py-4 text-white rounded-t-2xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </span>
              <h2 className="flex-1 text-lg font-bold">Chấp nhận &amp; gửi báo giá</h2>
              <button onClick={() => setShowAcceptModal(false)} disabled={accepting} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAcceptRequest} className="p-6 space-y-4">
              {acceptError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{acceptError}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Giá báo (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" value={acceptPrice} onChange={(e) => setAcceptPrice(e.target.value)}
                  min={1} placeholder="500000" required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {acceptPrice && !isNaN(parseFloat(acceptPrice)) && (
                  <p className="text-xs text-gray-500 mt-1">≈ {parseFloat(acceptPrice).toLocaleString('vi-VN')} VNĐ</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Mô tả phạm vi công việc <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4} value={acceptDesc} onChange={(e) => setAcceptDesc(e.target.value)}
                  maxLength={2000} placeholder="Mô tả chi tiết những gì bạn sẽ thực hiện..." required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right">{acceptDesc.length}/2000</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Thời gian đến làm</label>
                <input
                  type="datetime-local" value={acceptDuration} onChange={(e) => setAcceptDuration(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Điều khoản (tùy chọn)</label>
                <textarea
                  rows={2} value={acceptTerms} onChange={(e) => setAcceptTerms(e.target.value)}
                  maxLength={1000} placeholder="Ví dụ: Bao gồm vật liệu; không bao gồm sơn lại..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowAcceptModal(false)} disabled={accepting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={accepting}
                  className="flex-1 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-semibold hover:bg-[#0F766E] disabled:opacity-60 flex items-center justify-center gap-2">
                  {accepting ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang gửi...</>
                  ) : 'Gửi báo giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Provider reject request ─── */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRejectModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Từ chối yêu cầu</h2>
              <button onClick={() => setShowRejectModal(false)} disabled={rejecting} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleRejectRequest} className="p-6 space-y-4">
              {rejectError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{rejectError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Lý do từ chối (tùy chọn)</label>
                <textarea
                  rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500} placeholder="Ví dụ: Lịch đã kín, không có kinh nghiệm trong lĩnh vực này..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRejectModal(false)} disabled={rejecting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={rejecting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {rejecting ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang xử lý...</>
                  ) : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Customer reject quote ─── */}
      {showRejectQuoteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRejectQuoteModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Từ chối báo giá</h2>
              <button onClick={() => setShowRejectQuoteModal(false)} disabled={rejectingQuote} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleRejectQuote} className="p-6 space-y-4">
              {rejectQuoteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{rejectQuoteError}</div>
              )}
              <p className="text-sm text-gray-600">
                Bạn sẽ từ chối báo giá của thợ. Sau đó bạn có thể tìm và gửi yêu cầu tới thợ khác.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Lý do (tùy chọn)</label>
                <textarea
                  rows={3} value={rejectQuoteReason} onChange={(e) => setRejectQuoteReason(e.target.value)}
                  maxLength={500} placeholder="Ví dụ: Giá quá cao so với dự kiến..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRejectQuoteModal(false)} disabled={rejectingQuote}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={rejectingQuote}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {rejectingQuote ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang xử lý...</>
                  ) : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
