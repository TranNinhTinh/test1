import { TOKEN_KEYS } from './config'

/** Matches backend CustomRequestStatus enum exactly (lowercase) */
export type CustomRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface CustomRequestUser {
  id: string
  fullName?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

export interface CustomRequest {
  id: string
  customerId: string
  providerId: string
  title: string
  description: string
  imageUrls?: string[]
  location?: string
  desiredTime?: string
  budget?: number
  status: CustomRequestStatus
  rejectionReason?: string
  acceptedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
  customer?: CustomRequestUser
  provider?: CustomRequestUser
}

export interface CustomRequestListResponse {
  data: CustomRequest[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface CreateCustomRequestDto {
  providerId: string
  title: string
  description: string
  imageUrls?: string[]
  location?: string
  desiredTime?: string
  budget?: number
}

export interface AcceptCustomRequestDto {
  acceptedPrice: number
  quoteDescription: string
  estimatedDuration?: number
  terms?: string
}

export interface QuoteForCustomRequest {
  id: string
  customRequestId?: string
  providerId: string
  price: number
  description: string
  terms?: string
  estimatedDuration?: number
  imageUrls?: string[]
  status: string
  createdAt: string
  updatedAt: string
}

class CustomRequestService {
  private token(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN) : null
  }

  /** For single-resource endpoints: unwraps a possible `{ data: T }` envelope. */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.token()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`/api${path}`, { ...options, headers })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(
        payload?.message ?? payload?.error ?? `Request failed with status ${response.status}`,
      )
    }
    // Unwrap NestJS envelope {data: T} if present; fall back to raw payload
    return (payload?.data ?? payload) as T
  }

  /**
   * For list endpoints whose top-level payload IS the list dto
   * `{ data: T[], total, page, limit, hasMore }`.
   * Using request() would unwrap `.data` and return only the array,
   * losing total/hasMore.
   */
  private async requestList(path: string): Promise<CustomRequestListResponse> {
    const token = this.token()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    }

    const response = await fetch(`/api${path}`, { headers })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.message ?? payload?.error ?? `Request failed with status ${response.status}`)
    }

    // Normalise: backend returns { data:[...], total, page, limit, hasMore } directly.
    // Guard against accidental double-wrap.
    const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload
    return {
      data: Array.isArray(body?.data) ? body.data : Array.isArray(payload) ? payload : [],
      total: body?.total ?? payload?.total ?? 0,
      page: body?.page ?? payload?.page ?? 1,
      limit: body?.limit ?? payload?.limit ?? 10,
      hasMore: body?.hasMore ?? payload?.hasMore ?? false,
    }
  }

  async create(dto: CreateCustomRequestDto): Promise<CustomRequest> {
    return this.request<CustomRequest>('/custom-requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  }

  async getMySentRequests(params?: {
    status?: CustomRequestStatus
    page?: number
    limit?: number
  }): Promise<CustomRequestListResponse> {
    const q = new URLSearchParams()
    if (params?.status) q.append('status', params.status)        // lowercase ✓
    if (params?.page) q.append('page', String(params.page))
    if (params?.limit) q.append('limit', String(params.limit))
    const qs = q.toString()
    return this.requestList(`/custom-requests/my/sent${qs ? `?${qs}` : ''}`)
  }

  async getMyReceivedRequests(params?: {
    status?: CustomRequestStatus
    page?: number
    limit?: number
  }): Promise<CustomRequestListResponse> {
    const q = new URLSearchParams()
    if (params?.status) q.append('status', params.status)        // lowercase ✓
    if (params?.page) q.append('page', String(params.page))
    if (params?.limit) q.append('limit', String(params.limit))
    const qs = q.toString()
    return this.requestList(`/custom-requests/my/received${qs ? `?${qs}` : ''}`)
  }

  async getById(id: string): Promise<CustomRequest> {
    return this.request<CustomRequest>(`/custom-requests/${id}`)
  }

  async accept(id: string, dto: AcceptCustomRequestDto): Promise<CustomRequest> {
    return this.request<CustomRequest>(`/custom-requests/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  }

  async reject(id: string, reason?: string): Promise<CustomRequest> {
    return this.request<CustomRequest>(`/custom-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async getQuote(id: string): Promise<QuoteForCustomRequest> {
    return this.request<QuoteForCustomRequest>(`/custom-requests/${id}/quote`)
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/custom-requests/${id}`, {
      method: 'DELETE',
    })
  }
}

export const customRequestService = new CustomRequestService()
