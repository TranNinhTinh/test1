import { TOKEN_KEYS } from './config'

export interface CreateReviewPayload {
  orderId: string
  rating: number
  comment?: string
}

export interface ReviewResponse {
  id: string
  orderId: string
  rating: number
  comment?: string
}

export interface PublicReviewRow {
  id: string
  orderId?: string
  rating: number
  comment?: string | null
  providerReply?: string | null
  createdAt?: string
  reviewer?: {
    displayName?: string | null
    fullName?: string | null
  }
}

export interface ProviderReviewsListResponse {
  data: PublicReviewRow[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  averageRating?: number
}

class ReviewService {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN) : null
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string> | undefined) || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`/api${path}`, {
      ...options,
      headers,
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const msg =
        (typeof payload?.message === 'string' && payload.message) ||
        (Array.isArray(payload?.message) && payload.message.join(', ')) ||
        (typeof payload?.error === 'string' && payload.error) ||
        `Request failed with status ${response.status}`
      throw new Error(msg)
    }

    /**
     * Nest thường trả DTO phẳng; một số endpoint bọc `{ data: entity }`.
     * Với **danh sách** dạng `{ data: Review[], total, page, limit, hasMore }` thì `payload.data`
     * chỉ là mảng — không được bóc mất lớp ngoài.
     */
    if (
      payload != null &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      Array.isArray((payload as { data?: unknown }).data) &&
      ('total' in payload || 'page' in payload || 'hasMore' in payload)
    ) {
      return payload as T
    }

    return (payload?.data ?? payload) as T
  }

  /** Đánh giá công khai mà thợ nhận được */
  async getProviderReviews(
    providerId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ProviderReviewsListResponse> {
    const q = new URLSearchParams()
    if (params?.page != null) q.set('page', String(params.page))
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return this.request<ProviderReviewsListResponse>(
      `/reviews/provider/${encodeURIComponent(providerId)}${qs ? `?${qs}` : ''}`,
    )
  }

  /** Khách đánh giá thợ sau khi đơn đã COMPLETED */
  async createReview(body: CreateReviewPayload): Promise<ReviewResponse> {
    return this.request<ReviewResponse>('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        orderId: body.orderId,
        rating: body.rating,
        ...(body.comment != null && body.comment.trim() !== ''
          ? { comment: body.comment.trim() }
          : {}),
      }),
    })
  }
}

export const reviewService = new ReviewService()
