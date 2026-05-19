// ─── Domain types matching backend DTOs exactly ──────────────────────────────

export interface TradeDto {
  id: string
  name: string
  slug: string
  category?: string
  icon?: string
  yearsExperience?: number
}

export interface SearchPostItem {
  id: string
  title: string
  location?: string
  province?: string
  status: string
  budget?: number
  desiredTime?: string
  customer: {
    customerId: string
    displayName: string | null
    avatarUrl: string | null
  }
  createdAt: string
  highlight?: string
}

export interface SearchProviderItem {
  id: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  address?: string
  province?: string
  mainOccupation?: string
  trades: TradeDto[]
  isVerified: boolean
  averageRating?: number
  reviewCount?: number
  hasCertification?: boolean
  memberSince: string
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface SearchPostsResponse {
  data: SearchPostItem[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  took: number
}

export interface SearchProvidersResponse {
  data: SearchProviderItem[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  took: number
}

export interface GlobalSearchResponse {
  query: string
  posts?: SearchPostItem[]
  providers?: SearchProviderItem[]
  totalPosts: number
  totalProviders: number
  took: number
}

/** Matches backend ByProvinceResponseDto */
export interface ByProvinceResponse {
  province: string
  posts: SearchPostItem[]
  totalPosts: number
  providers: SearchProviderItem[]
  totalProviders: number
  took: number
}

/** Matches backend ProvinceSuggestResponseDto — returns plain string array */
export interface ProvincesResponse {
  provinces: string[]
}

/** Matches backend TradeSuggestResponseDto */
export interface TradesResponse {
  trades: Array<Omit<TradeDto, 'yearsExperience'>>
  categories: string[]
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SearchService {
  static async searchProviders(params: {
    displayName?: string
    province?: string
    tradeSlugs?: string[]
    mainOccupation?: string
    sortBy?: 'displayName' | 'createdAt'
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<SearchProvidersResponse> {
    const queryParams = new URLSearchParams()

    if (params.displayName) queryParams.append('displayName', params.displayName)
    if (params.province) queryParams.append('province', params.province)
    if (params.mainOccupation) queryParams.append('mainOccupation', params.mainOccupation)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.order) queryParams.append('order', params.order)
    if (typeof params.limit === 'number') queryParams.append('limit', String(params.limit))
    if (typeof params.offset === 'number') queryParams.append('offset', String(params.offset))
    if (params.tradeSlugs?.length) {
      params.tradeSlugs.forEach((slug) => queryParams.append('tradeSlugs', slug))
    }

    const response = await fetch(`/api/search/providers?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tìm kiếm thợ')
    }
    return data
  }

  static async searchPosts(params: {
    title?: string
    province?: string
    tradeSlugs?: string[]
    budgetMin?: number
    budgetMax?: number
    sortBy?: 'createdAt' | 'budget' | 'desiredTime'
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<SearchPostsResponse> {
    const queryParams = new URLSearchParams()

    if (params.title) queryParams.append('title', params.title)
    if (params.province) queryParams.append('province', params.province)
    if (typeof params.budgetMin === 'number') queryParams.append('budgetMin', String(params.budgetMin))
    if (typeof params.budgetMax === 'number') queryParams.append('budgetMax', String(params.budgetMax))
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.order) queryParams.append('order', params.order)
    if (typeof params.limit === 'number') queryParams.append('limit', String(params.limit))
    if (typeof params.offset === 'number') queryParams.append('offset', String(params.offset))
    if (params.tradeSlugs?.length) {
      params.tradeSlugs.forEach((slug) => queryParams.append('tradeSlugs', slug))
    }

    const response = await fetch(`/api/search/posts?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tìm kiếm bài đăng')
    }
    return data
  }

  static async globalSearch(params: {
    q: string
    type?: 'all' | 'post' | 'provider'
    province?: string
    limit?: number
  }): Promise<GlobalSearchResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('q', params.q)
    if (params.type) queryParams.append('type', params.type)
    if (params.province) queryParams.append('province', params.province)
    if (typeof params.limit === 'number') queryParams.append('limit', String(params.limit))

    const response = await fetch(`/api/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tìm kiếm')
    }
    return data
  }

  static async searchByProvince(params: {
    province: string
    postLimit?: number
    providerLimit?: number
  }): Promise<ByProvinceResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('province', params.province)
    if (typeof params.postLimit === 'number') queryParams.append('postLimit', String(params.postLimit))
    if (typeof params.providerLimit === 'number') queryParams.append('providerLimit', String(params.providerLimit))

    const response = await fetch(`/api/search/by-province?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tìm kiếm theo tỉnh/thành phố')
    }
    return data
  }

  /** Returns { provinces: string[] } */
  static async getProvinces(q?: string): Promise<ProvincesResponse> {
    const queryParams = new URLSearchParams()
    if (q) queryParams.append('q', q)

    const response = await fetch(`/api/search/provinces${q ? `?${queryParams.toString()}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tải danh sách tỉnh/thành phố')
    }
    return data
  }

  /** Returns { trades: TradeDto[], categories: string[] } */
  static async getTrades(params?: { q?: string; category?: string }): Promise<TradesResponse> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.category) queryParams.append('category', params.category)

    const qs = queryParams.toString()
    const response = await fetch(`/api/search/trades${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tải danh sách ngành nghề')
    }
    return data
  }
}
