// src/lib/api/quote.service.ts
import { AuthService } from './auth.service'

// Helper function để xử lý fetch với authentication
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = AuthService.getToken()
  
  if (!token) {
    console.error('❌ No token found')
    AuthService.handleTokenExpired()
    throw new Error('Vui lòng đăng nhập để tiếp tục')
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  // Xử lý lỗi 401 - Token invalid/expired
  if (response.status === 401) {
    console.error('❌ Token invalid - redirecting to login')
    AuthService.handleTokenExpired()
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
  }
  
  return response
}

export type QuoteStatusKey =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'accepted_for_chat'
  | 'revising'
  | 'order_requested'
  | 'confirmed'
  | 'expired'

export interface Quote {
  id: string
  postId: string
  providerId: string
  providerName?: string
  providerAvatar?: string
  price: number
  description: string
  estimatedDuration?: number  // Thời gian dự kiến tính bằng phút
  /** Backend dùng snake_case lowercase (vd: pending, accepted_for_chat) */
  status: string
  createdAt: string
  updatedAt: string
}

export interface QuoteRevision {
  id: string
  quoteId?: string
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

export interface QuoteWithRevisions extends Quote {
  revisions: QuoteRevision[]
}

export interface PostQuoteGroup {
  postId: string
  postTitle: string
  quoteId: string
  quote: QuoteWithRevisions & {
    currentPrice?: number
    chatOpenedAt?: string
    orderRequestedAt?: string
    revisionCount?: number
    customRequestId?: string
  }
}

export interface CreateQuoteRequest {
  postId: string
  price: number
  description: string
  estimatedDuration?: number  // Thời gian dự kiến tính bằng phút
  terms?: string
  imageUrls?: string[]
}

export interface ReviseQuoteRequest {
  price: number
  description: string
}

class QuoteService {
  /**
   * [Provider] Tạo quote mới cho post
   */
  async createQuote(data: CreateQuoteRequest): Promise<Quote> {
    if (!data.postId || typeof data.postId !== 'string') {
      throw new Error('Invalid postId format')
    }

    const price = Number(data.price)
    if (isNaN(price) || price <= 0) {
      throw new Error('Giá phải là số dương')
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Mô tả không được để trống')
    }

    const requestBody: {
      postId: string
      price: number
      description: string
      estimatedDuration?: number
      terms?: string
      imageUrls?: string[]
    } = {
      postId: data.postId.trim(),
      price,
      description: data.description.trim(),
    }

    if (data.estimatedDuration) {
      const duration = Number(data.estimatedDuration)
      if (!isNaN(duration) && duration > 0) requestBody.estimatedDuration = duration
    }
    if (data.terms?.trim()) requestBody.terms = data.terms.trim()
    if (data.imageUrls?.length) requestBody.imageUrls = data.imageUrls.map((u) => u.trim()).filter(Boolean)

    const response = await authenticatedFetch('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Failed to create quote')
    }

    return response.json()
  }

  /**
   * [Provider] Chào giá lại trong chat
   */
  async reviseQuote(quoteId: string, data: ReviseQuoteRequest): Promise<QuoteRevision> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}/revise`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to revise quote')
    }
    return response.json()
  }

  /**
   * [Provider] Sửa quote (chỉ khi PENDING)
   */
  async updateQuote(quoteId: string, data: Partial<CreateQuoteRequest>): Promise<Quote> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update quote')
    }
    return response.json()
  }

  /**
   * [Provider] Xóa quote
   */
  async deleteQuote(quoteId: string): Promise<{ message: string }> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete quote')
    }
    return response.json()
  }

  /**
   * Xem chi tiết quote
   */
  async getQuoteById(quoteId: string): Promise<Quote> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}`, {
      method: 'GET'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get quote')
    }
    return response.json()
  }

  /**
   * [Provider] Hủy quote
   */
  async cancelQuote(quoteId: string, reason?: string): Promise<Quote> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel quote')
    }
    return response.json()
  }

  /**
   * [Provider] Lấy danh sách quote của tôi
   */
  async getMyQuotes(params?: {
    status?: string
    limit?: number
  }): Promise<Quote[]> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await authenticatedFetch(`/api/quotes?${queryParams.toString()}`, {
      method: 'GET'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get my quotes')
    }
    return response.json()
  }

  /**
   * [Customer] Chấp nhận quote để mở chat
   */
  async acceptQuoteForChat(quoteId: string): Promise<{ conversationId?: string; message?: string }> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}/accept-for-chat`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || error.message || 'Không thể chấp nhận báo giá')
    }

    return response.json()
  }

  /**
   * [Customer] Nhấn đặt đơn với revision cụ thể
   */
  async requestOrder(quoteId: string, revisionId?: string): Promise<{ orderId: string }> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}/request-order`, {
      method: 'POST',
      body: JSON.stringify(revisionId ? { revisionId } : {})
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to request order')
    }
    return response.json()
  }

  /**
   * [Customer] Từ chối quote
   */
  async rejectQuote(quoteId: string, reason?: string): Promise<Quote> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || error.message || 'Không thể từ chối báo giá')
    }

    return response.json()
  }

  /**
   * [Customer] Lấy tất cả quote của một post
   */
  async getQuotesByPostId(postId: string): Promise<Quote[]> {
    const response = await authenticatedFetch(`/api/quotes/post/${postId}`, {
      method: 'GET'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get quotes by post')
    }
    return response.json()
  }

  /**
   * Xem quote với toàn bộ lịch sử revisions
   */
  async getQuoteWithRevisions(quoteId: string): Promise<QuoteWithRevisions> {
    const response = await authenticatedFetch(`/api/quotes/${quoteId}/with-revisions`, {
      method: 'GET'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get quote with revisions')
    }
    return response.json()
  }

  /**
   * Lấy tất cả báo giá giữa customer và provider, sắp xếp theo bài đăng từ cũ đến mới.
   * Dùng trong ChatQuotePanel để hiển thị toàn bộ lịch sử thương lượng.
   */
  async getQuotesBetweenUsers(customerId: string, providerId: string): Promise<PostQuoteGroup[]> {
    const response = await authenticatedFetch(
      `/api/quotes/between-users?customerId=${encodeURIComponent(customerId)}&providerId=${encodeURIComponent(providerId)}`,
      { method: 'GET' },
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get quotes between users')
    }
    return response.json()
  }
}

// Export both instance and class
export const quoteService = new QuoteService()
export { QuoteService as QuoteService }
export default quoteService
