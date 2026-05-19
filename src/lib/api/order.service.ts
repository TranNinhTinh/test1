// src/lib/api/order.service.ts
import { TOKEN_KEYS } from './config'

export interface Order {
  id: string
  orderNumber: string
  quoteId?: string
  postId: string
  customerId: string
  providerId: string
  customerName?: string
  providerName?: string
  price: number
  description: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'PROVIDER_COMPLETED' | 'COMPLETED' | 'CANCELLED'
  providerCompletedAt?: string
  customerCompletedAt?: string
  createdAt: string
  updatedAt: string
}

export interface OrderStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
  totalRevenue?: number
}

export interface ConfirmOrderRequest {
  estimatedCompletionDate?: string
  notes?: string
}

class OrderService {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN) : null
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string> | undefined) || {})
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`/api${path}`, {
      ...options,
      headers
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.message || `Request failed with status ${response.status}`)
    }

    return (payload?.data ?? payload) as T
  }

  /**
   * [Customer] Chấp nhận giá ngay (quote PENDING) → POST /orders/accept-quote-direct/:quoteId
   */
  async acceptQuoteDirect(quoteId: string): Promise<Order> {
    return this.request<Order>(`/orders/accept-quote-direct/${quoteId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  /**
   * [Provider] Xác nhận làm → Tạo order từ quote
   */
  async confirmFromQuote(quoteId: string): Promise<Order> {
    return this.request<Order>(`/orders/confirm-from-quote/${quoteId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  /**
   * [Provider] Thợ xác nhận hoàn thành
   */
  async providerComplete(orderId: string, notes?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/provider-complete`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    })
  }

  /**
   * [Customer] Khách hàng xác nhận hoàn thành (finalize) — đơn chuyển COMPLETED.
   * Đánh giá gửi riêng qua `reviewService.createReview` sau khi chốt đơn.
   */
  async customerComplete(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/customer-complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  /**
   * Lấy danh sách đơn hàng của tôi
   */
  async getOrders(params?: {
    status?: string
    role?: 'customer' | 'provider'
    limit?: number
    cursor?: string
  }): Promise<{
    data: Order[]
    nextCursor?: string
    hasMore: boolean
    total: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.cursor) queryParams.append('cursor', params.cursor)

    const query = queryParams.toString()
    const raw = await this.request<any>(`/orders${query ? `?${query}` : ''}`)

    // Nest `getMyOrders` returns `Order[]`; some routes may return `{ data, meta, ... }`.
    if (Array.isArray(raw)) {
      return {
        data: raw,
        hasMore: false,
        total: raw.length,
      }
    }

    const list = raw?.data
    if (Array.isArray(list)) {
      return {
        data: list,
        nextCursor: raw?.nextCursor,
        hasMore: Boolean(raw?.hasMore),
        total: Number(raw?.total) || Number(raw?.meta?.total) || list.length,
      }
    }

    return {
      data: [],
      hasMore: false,
      total: 0,
    }
  }

  /**
   * Thống kê đơn hàng
   */
  async getStats(): Promise<OrderStats> {
    return this.request<OrderStats>('/orders/stats')
  }

  /**
   * Xem chi tiết đơn hàng
   */
  async getOrderById(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`)
  }

  /**
   * Xem đơn hàng theo mã số
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    return this.request<Order>(`/orders/number/${orderNumber}`)
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }
}

export const orderService = new OrderService()
