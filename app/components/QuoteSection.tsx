'use client'

import { useState, useEffect } from 'react'
import { quoteService, type Quote } from '@/lib/api/quote.service'
import { chatService } from '@/lib/api/chat.service'
import { ProfileService } from '@/lib/api/profile.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { useRouter } from 'next/navigation'

interface QuoteSectionProps {
  postId: string
  isPostOwner: boolean
}

export default function QuoteSection({ postId, isPostOwner }: QuoteSectionProps) {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)

  const normalizeImageUrl = (rawUrl?: string | null) => {
    if (!rawUrl) return ''
    const cleanUrl = rawUrl.trim()
    if (!cleanUrl) return ''

    if (/^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('data:')) {
      return cleanUrl
    }

    const apiDomain = (process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '')
    if (!apiDomain) return cleanUrl

    if (cleanUrl.startsWith('/')) {
      return `${apiDomain}${cleanUrl}`
    }

    return `${apiDomain}/${cleanUrl}`
  }

  const normalizeQuoteStatus = (status?: string): Quote['status'] => {
    const normalized = status?.toUpperCase()

    if (
      normalized === 'PENDING' ||
      normalized === 'ACCEPTED' ||
      normalized === 'REJECTED' ||
      normalized === 'CANCELLED' ||
      normalized === 'IN_CHAT'
    ) {
      return normalized
    }

    return 'PENDING'
  }

  const pendingQuotes = quotes.filter((quote) => normalizeQuoteStatus(quote.status) === 'PENDING')

  useEffect(() => {
    loadQuotes()
  }, [postId, isPostOwner])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const data = await quoteService.getQuotesByPostId(postId)
      console.log('📊 Quotes loaded:', data)

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
              providerAvatar = normalizeImageUrl(profileData.avatarUrl || profileData.avatar || providerAvatar) || providerAvatar

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
            status: normalizeQuoteStatus(quote.status),
            providerName,
            providerAvatar: providerAvatar || undefined
          } as any
        })
      )

      console.log('✅ Enhanced quotes:', enhancedQuotes)
      setQuotes(enhancedQuotes as Quote[])
    } catch (err) {
      console.error('Error loading quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      console.log('🎯 Accepting quote and opening chat:', quoteId)

      // Gọi API backend - tự động:
      // 1. Chấp nhận quote
      // 2. Tạo/mở conversation cho cả 2
      // 3. Thay đổi status thành IN_CHAT
      const result = await quoteService.acceptQuoteForChat(quoteId)
      console.log('✅ Quote accepted, conversation created:', result)

      // Kết nối socket nếu chưa kết nối
      if (!chatSocketService.isConnected()) {
        console.log('🔌 Connecting chat socket...')
        chatSocketService.connect()
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Join conversation room để nhận real-time messages
      if (result.conversationId) {
        console.log('📥 Joining conversation room:', result.conversationId)
        await chatSocketService.joinConversation(result.conversationId)
      }

      alert('Đã chấp nhận báo giá! Chat đã được mở.')
      setQuotes(prev => prev.filter(q => q.id !== quoteId))

      // Delay để chắc chắn socket đã join conversation
      await new Promise(resolve => setTimeout(resolve, 800))

      // Redirect đến trang chat
      router.push('/tin-nhan')
    } catch (error: any) {
      console.error('❌ Error accepting quote:', error)
      alert(error.message || 'Không thể chấp nhận báo giá')
    }
  }

  const handleRejectQuote = async (quoteId: string) => {
    try {
      console.log('Rejecting quote:', quoteId)
      await quoteService.rejectQuote(quoteId, 'Khách hàng từ chối')
      console.log('Quote rejected')
      setQuotes(prev => prev.filter(q => q.id !== quoteId))
      alert('Đã từ chối báo giá!')
    } catch (error: any) {
      console.error('Error rejecting quote:', error)
      alert(error.message || 'Không thể từ chối báo giá')
    }
  }

  const handleRequestOrder = async (quoteId: string) => {
    try {
      console.log('Requesting order for quote:', quoteId)
      const quote = quotes.find(q => q.id === quoteId)
      if (!quote?.providerId) {
        throw new Error('Provider ID not found')
      }
      const conversation = await chatService.createDirectConversation({
        providerId: quote.providerId
      })
      console.log('Conversation created:', conversation)
      router.push(`/tin-nhan`)
    } catch (error: any) {
      console.error('Error requesting order:', error)
      alert(error.message || 'Không thể tạo đơn hàng')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'IN_CHAT':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ'
      case 'ACCEPTED':
        return 'Đã chấp nhận'
      case 'REJECTED':
        return 'Đã từ chối'
      case 'IN_CHAT':
        return 'Đang trao đổi'
      default:
        return status
    }
  }

  // Non-owner view: view quotes and submit quote
  if (!isPostOwner) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4 space-y-6">
        {/* Section 1: Quotes list */}
        <div>
          <h3 className="font-bold text-lg mb-3">💰 Các báo giá ({pendingQuotes.length})</h3>

          {loading ? (
            <p className="text-center text-gray-500 py-4">Đang tải...</p>
          ) : pendingQuotes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Chưa có báo giá nào</p>
          ) : (
            <div className="space-y-3">
              {pendingQuotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => {
                    if (quote.providerId) {
                      router.push(`/profile/${quote.providerId}`)
                    }
                  }}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      {quote.providerAvatar ? (
                        <img
                          src={quote.providerAvatar}
                          alt={quote.providerName || 'Thợ'}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {quote.providerName?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {quote.providerName || 'Thợ'}
                        </p>
                        <p className="text-sm text-gray-500">Nhấn để xem profile</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{quote.price?.toLocaleString('vi-VN')} ₫</p>
                      <p className="text-xs text-gray-400 mt-1">Giá đề xuất</p>
                    </div>
                  </div>

                  {quote.description && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400">
                      <p className="text-sm text-gray-700">{quote.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm mb-3">
                    {quote.estimatedDuration ? (
                      <span className="text-gray-600">
                        <span className="mr-2">⏱️</span>Dự kiến: {quote.estimatedDuration} phút
                      </span>
                    ) : (
                      <span className="text-gray-400">Không có thời gian dự kiến</span>
                    )}
                    <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                      ID: {quote.id.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAcceptQuote(quote.id)
                      }}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      ✓ Chấp nhận
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRejectQuote(quote.id)
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Owner view: view quotes
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Các báo giá ({pendingQuotes.length})
      </h3>

      {loading ? (
        <p className="text-center text-gray-500 py-4">Đang tải...</p>
      ) : pendingQuotes.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Chưa có báo giá nào</p>
      ) : (
        <div className="space-y-3">
          {pendingQuotes.map((quote) => (
            <div
              key={quote.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg hover:border-blue-400 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (quote.providerId) {
                      router.push(`/profile/${quote.providerId}`)
                    }
                  }}
                >
                  {quote.providerAvatar ? (
                    <img
                      src={quote.providerAvatar}
                      alt={quote.providerName || 'Thợ'}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
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
                  <p className="text-lg font-bold text-orange-600">
                    {quote.price.toLocaleString('vi-VN')}đ
                  </p>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(quote.status)}`}>
                    {getStatusText(quote.status)}
                  </span>
                </div>
              </div>

              <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400">
                <p className="text-sm text-gray-700">{quote.description}</p>
              </div>

              <div className="flex items-center justify-between text-sm mb-3">
                {quote.estimatedDuration ? (
                  <span className="text-gray-600">
                    <span className="mr-2">⏱️</span>Dự kiến: {
                      quote.estimatedDuration >= 60
                        ? `${Math.floor(quote.estimatedDuration / 60)}h ${quote.estimatedDuration % 60 > 0 ? `${quote.estimatedDuration % 60}m` : ''}`
                        : `${quote.estimatedDuration}m`
                    }
                  </span>
                ) : (
                  <span className="text-gray-400">Không có thời gian dự kiến</span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => handleAcceptQuote(quote.id)}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Chấp nhận
                </button>
                <button
                  onClick={() => handleRejectQuote(quote.id)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Từ chối
                </button>
              </div>

              {quote.status === 'IN_CHAT' && (
                <button
                  onClick={() => handleRequestOrder(quote.id)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium mt-3"
                >
                  Đặt đơn ngay
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
