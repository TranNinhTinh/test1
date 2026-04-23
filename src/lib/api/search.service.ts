export interface SearchProviderItem {
  id: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  address?: string
  province?: string
  isVerified?: boolean
}

export interface SearchProvidersResponse {
  data: SearchProviderItem[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  took: number
}

export interface SearchPostsResponse {
  data: any[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  took: number
}

export interface GlobalSearchResponse {
  query: string
  posts?: any[]
  providers?: SearchProviderItem[]
  totalPosts: number
  totalProviders: number
  took: number
}

export class SearchService {
  static async searchProviders(params: {
    displayName?: string
    province?: string
    tradeSlugs?: string[]
    sortBy?: 'displayName' | 'createdAt'
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<SearchProvidersResponse> {
    const queryParams = new URLSearchParams()

    if (params.displayName) queryParams.append('displayName', params.displayName)
    if (params.province) queryParams.append('province', params.province)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.order) queryParams.append('order', params.order)
    if (typeof params.limit === 'number') queryParams.append('limit', String(params.limit))
    if (typeof params.offset === 'number') queryParams.append('offset', String(params.offset))
    if (params.tradeSlugs?.length) {
      params.tradeSlugs.forEach((slug) => queryParams.append('tradeSlugs', slug))
    }

    const response = await fetch(`/api/search/providers?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Không thể tìm kiếm')
    }

    return data
  }
}