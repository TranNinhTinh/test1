'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/api/auth.service'
import { quoteService, type Quote, type QuoteWithRevisions } from '@/lib/api/quote.service'
import { PostService } from '@/lib/api/post.service'

type QuoteWithPost = {
  quote: Quote
  post: any | null
}

export default function GioHangPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [quotedPosts, setQuotedPosts] = useState<QuoteWithPost[]>([])
  const [error, setError] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [selectedRevisions, setSelectedRevisions] = useState<QuoteWithRevisions['revisions']>([])
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const formatDateTime = (isoDate?: string) => {
    if (!isoDate) return 'Không rõ thời gian'
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return 'Không rõ thời gian'

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: Quote['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ phản hồi'
      case 'ACCEPTED':
        return 'Đã được chấp nhận'
      case 'IN_CHAT':
        return 'Đang trao đổi'
      case 'REJECTED':
        return 'Đã bị từ chối'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  const getStatusClassName = (status: Quote['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700'
      case 'ACCEPTED':
        return 'bg-emerald-100 text-emerald-700'
      case 'IN_CHAT':
        return 'bg-cyan-100 text-cyan-700'
      case 'REJECTED':
        return 'bg-rose-100 text-rose-700'
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const loadMyQuotedPosts = async () => {
    try {
      setIsLoading(true)
      setError('')

      const quoteResponse: any = await quoteService.getMyQuotes({ limit: 100 })
      const allQuotes: Quote[] = Array.isArray(quoteResponse)
        ? quoteResponse
        : Array.isArray(quoteResponse?.data)
          ? quoteResponse.data
          : []

      const latestQuoteByPost = new Map<string, Quote>()

      for (const quote of allQuotes) {
        const existing = latestQuoteByPost.get(quote.postId)
        if (!existing) {
          latestQuoteByPost.set(quote.postId, quote)
          continue
        }

        const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime()
        const currentTime = new Date(quote.updatedAt || quote.createdAt).getTime()
        if (currentTime > existingTime) {
          latestQuoteByPost.set(quote.postId, quote)
        }
      }

      const latestQuotes = Array.from(latestQuoteByPost.values()).sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )

      const postEntries = await Promise.all(
        latestQuotes.map(async (quote) => {
          try {
            const post = await PostService.getPostById(quote.postId)
            return [quote.postId, post] as const
          } catch (postError) {
            console.warn('Không tải được bài đăng:', quote.postId, postError)
            return [quote.postId, null] as const
          }
        }),
      )

      const postMap = new Map(postEntries)

      const items: QuoteWithPost[] = latestQuotes.map((quote) => ({
        quote,
        post: postMap.get(quote.postId) || null,
      }))

      setQuotedPosts(items)
    } catch (err: any) {
      console.error('Error loading quoted posts:', err)
      setError(err?.message || 'Không thể tải danh sách bài đã chào giá')
      setQuotedPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewQuoteDetail = async (quoteId: string) => {
    try {
      setLoadingDetailId(quoteId)
      const detail = await quoteService.getQuoteById(quoteId)
      setSelectedQuote(detail)
      setSelectedRevisions([])
    } catch (err: any) {
      alert(err?.message || 'Không thể tải chi tiết báo giá')
    } finally {
      setLoadingDetailId(null)
    }
  }

  const handleViewQuoteRevisions = async (quoteId: string) => {
    try {
      setLoadingDetailId(quoteId)
      const detail = await quoteService.getQuoteWithRevisions(quoteId)
      setSelectedQuote(detail)
      setSelectedRevisions(detail.revisions || [])
    } catch (err: any) {
      alert(err?.message || 'Không thể tải lịch sử chào giá')
    } finally {
      setLoadingDetailId(null)
    }
  }

  const handleUpdateQuote = async (quote: Quote) => {
    const rawPrice = prompt('Nhập giá mới (VND):', String(quote.price))
    if (!rawPrice) return

    const parsedPrice = Number(rawPrice.replace(/[^0-9]/g, ''))
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Giá không hợp lệ')
      return
    }

    const newDescription = prompt('Nhập mô tả mới:', quote.description || '')
    if (newDescription === null) return

    try {
      setActionLoadingId(quote.id)
      await quoteService.updateQuote(quote.id, {
        postId: quote.postId,
        price: parsedPrice,
        description: newDescription.trim() || quote.description,
        estimatedDuration: quote.estimatedDuration,
      })
      await loadMyQuotedPosts()
      alert('Đã cập nhật báo giá')
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật báo giá')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancelQuote = async (quoteId: string) => {
    const reason = prompt('Lý do hủy báo giá (không bắt buộc):')
    if (reason === null) return

    try {
      setActionLoadingId(quoteId)
      await quoteService.cancelQuote(quoteId, reason || undefined)
      await loadMyQuotedPosts()
      alert('Đã hủy báo giá')
    } catch (err: any) {
      alert(err?.message || 'Không thể hủy báo giá')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa báo giá này?')) return

    try {
      setActionLoadingId(quoteId)
      await quoteService.deleteQuote(quoteId)
      await loadMyQuotedPosts()
      alert('Đã xóa báo giá')
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa báo giá')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Kiểm tra authentication và load danh sách bài đã chào giá
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/dang-nhap')
      return
    }

    loadMyQuotedPosts()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/home" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Chào giá của tôi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {selectedQuote && (
          <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-cyan-900">Chi tiết báo giá đã chọn</h3>
                <p className="text-sm text-cyan-700 mt-1">Mã báo giá: {selectedQuote.id}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedQuote(null)
                  setSelectedRevisions([])
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-100"
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white border border-cyan-100 p-3">
                <div className="text-cyan-700">Giá hiện tại</div>
                <div className="font-semibold text-cyan-900 mt-1">{Number(selectedQuote.price || 0).toLocaleString('vi-VN')}đ</div>
              </div>
              <div className="rounded-lg bg-white border border-cyan-100 p-3">
                <div className="text-cyan-700">Trạng thái</div>
                <div className="font-semibold text-cyan-900 mt-1">{getStatusLabel(selectedQuote.status)}</div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-white border border-cyan-100 p-3 text-sm text-slate-700">
              {selectedQuote.description || 'Không có mô tả'}
            </div>

            {selectedRevisions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-cyan-900 mb-2">Lịch sử chỉnh sửa ({selectedRevisions.length})</p>
                <div className="space-y-2">
                  {selectedRevisions.map((revision) => (
                    <div key={revision.id} className="rounded-lg bg-white border border-cyan-100 p-3 text-sm">
                      <div className="font-medium text-slate-800">{Number(revision.price || 0).toLocaleString('vi-VN')}đ</div>
                      <div className="text-slate-600 mt-1">{revision.description || 'Không có mô tả'}</div>
                      <div className="text-xs text-slate-500 mt-1">{formatDateTime(revision.createdAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {quotedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">Bạn chưa chào giá bài nào</h2>
            <p className="text-slate-500 mb-6">Hãy vào danh sách bài đăng để gửi chào giá đầu tiên.</p>
            <Link
              href="/home"
              className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách bài đã chào giá ({quotedPosts.length})
              </h2>
              <p className="text-sm text-slate-500 mt-1">Mỗi bài hiển thị chào giá mới nhất của bạn.</p>
            </div>

            {quotedPosts.map(({ quote, post }) => {
              const postTitle = post?.title || `Bài đăng #${quote.postId.slice(0, 8)}`
              const postDescription = post?.description || quote.description

              return (
                <div key={quote.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{postTitle}</h3>
                      <p className="text-sm text-slate-500 mt-1">Mã bài đăng: {quote.postId}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusClassName(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 mt-4 line-clamp-3">{postDescription}</p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                      <div className="text-slate-500">Giá đã chào</div>
                      <div className="text-base font-semibold text-cyan-700 mt-1">
                        {Number(quote.price || 0).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                      <div className="text-slate-500">Cập nhật lần cuối</div>
                      <div className="text-base font-medium text-slate-800 mt-1">{formatDateTime(quote.updatedAt || quote.createdAt)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                      <div className="text-slate-500">Thời gian dự kiến</div>
                      <div className="text-base font-medium text-slate-800 mt-1">
                        {quote.estimatedDuration ? `${quote.estimatedDuration} phút` : 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/posts/${quote.postId}`}
                      className="inline-flex items-center px-4 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition text-sm font-medium"
                    >
                      Xem chi tiết bài đăng
                    </Link>
                    <Link
                      href="/tin-nhan"
                      className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
                    >
                      Vào tin nhắn
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleViewQuoteDetail(quote.id)}
                      disabled={loadingDetailId === quote.id}
                      className="inline-flex items-center px-4 py-2 rounded-xl border border-cyan-300 text-cyan-700 hover:bg-cyan-50 transition text-sm font-medium disabled:opacity-60"
                    >
                      {loadingDetailId === quote.id ? 'Đang tải...' : 'Chi tiết báo giá'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewQuoteRevisions(quote.id)}
                      disabled={loadingDetailId === quote.id}
                      className="inline-flex items-center px-4 py-2 rounded-xl border border-sky-300 text-sky-700 hover:bg-sky-50 transition text-sm font-medium disabled:opacity-60"
                    >
                      {loadingDetailId === quote.id ? 'Đang tải...' : 'Lịch sử sửa giá'}
                    </button>

                    {quote.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuote(quote)}
                        disabled={actionLoadingId === quote.id}
                        className="inline-flex items-center px-4 py-2 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 transition text-sm font-medium disabled:opacity-60"
                      >
                        {actionLoadingId === quote.id ? 'Đang xử lý...' : 'Sửa báo giá'}
                      </button>
                    )}

                    {(quote.status === 'PENDING' || quote.status === 'IN_CHAT') && (
                      <button
                        type="button"
                        onClick={() => handleCancelQuote(quote.id)}
                        disabled={actionLoadingId === quote.id}
                        className="inline-flex items-center px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 transition text-sm font-medium disabled:opacity-60"
                      >
                        {actionLoadingId === quote.id ? 'Đang xử lý...' : 'Hủy báo giá'}
                      </button>
                    )}

                    {(quote.status === 'CANCELLED' || quote.status === 'REJECTED') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(quote.id)}
                        disabled={actionLoadingId === quote.id}
                        className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition text-sm font-medium disabled:opacity-60"
                      >
                        {actionLoadingId === quote.id ? 'Đang xử lý...' : 'Xóa báo giá'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
