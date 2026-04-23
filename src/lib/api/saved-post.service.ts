import { AuthService } from './auth.service'

export interface SavedPostRecord {
  id: string
  postId: string
  savedAt: string
  post?: {
    id: string
    title: string
    location?: string
    budget?: number
    status?: string
    createdAt?: string
    customerId?: string
  }
}

export interface SavedPostsResponse {
  data: SavedPostRecord[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

function getAuthHeaders() {
  const token = AuthService.getToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục')
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

class SavedPostService {
  async getSavedPosts(params?: { limit?: number; offset?: number }): Promise<SavedPostsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.offset) queryParams.append('offset', String(params.offset))

    const response = await fetch(`/api/saved-posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Không thể tải danh sách bài đã lưu')
    }

    return data as SavedPostsResponse
  }

  async savePost(postId: string): Promise<void> {
    let response = await fetch(`/api/saved-posts/${postId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    let data = await response.json().catch(() => ({}))

    // Some deployed backends expose POST /saved-posts (with body) instead of POST /saved-posts/:postId.
    if (!response.ok && (data?.message || '').includes('Cannot POST /api/v1/saved-posts/')) {
      response = await fetch('/api/saved-posts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ postId }),
      })
      data = await response.json().catch(() => ({}))
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Không thể lưu bài đăng')
    }
  }

  async unsavePost(postId: string): Promise<void> {
    const response = await fetch(`/api/saved-posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Không thể bỏ lưu bài đăng')
    }
  }

  async getSavedStatus(postId: string): Promise<boolean> {
    const response = await fetch(`/api/saved-posts/${postId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Không thể kiểm tra trạng thái lưu')
    }

    return !!data.saved
  }
}

export const savedPostService = new SavedPostService()
