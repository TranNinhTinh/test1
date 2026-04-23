import { TOKEN_KEYS } from './config'
import type { 
  PostResponseDto, 
  FeedResponseDto,
  CreatePostDto,
  UpdatePostDto,
  DeletePostResponseDto
} from './index'

// Service để xử lý Posts
export class PostService {

  private static extractApiErrorMessage(data: any, fallback: string): string {
    if (!data) return fallback

    if (typeof data.userMessage === 'string' && data.userMessage.trim()) {
      return data.userMessage
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }

    if (Array.isArray(data.message) && data.message.length > 0) {
      return String(data.message[0])
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error
    }

    return fallback
  }

  // Lấy access token từ localStorage
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN) 
      : null

    if (!token) {
      console.warn('⚠️ No access token found!')
    } else {
      console.log('🔑 Token found:', token.substring(0, 20) + '...')
    }

    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  // Lấy danh sách bài đăng công khai (feed)
  static async getFeed(params?: { limit?: number; cursor?: string }): Promise<FeedResponseDto> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.cursor) queryParams.append('cursor', params.cursor)

      const url = `/api/posts/feed${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể tải danh sách bài đăng')
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('❌ Get Feed Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi tải bài đăng')
    }
  }

  // Lấy chi tiết bài đăng theo ID
  static async getPostById(id: string): Promise<PostResponseDto> {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể tải bài đăng')
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('❌ Get Post Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi tải bài đăng')
    }
  }

  // Tạo bài đăng mới
  static async createPost(postData: CreatePostDto): Promise<PostResponseDto> {
    try {
      console.log('🔵 Create Post Request:', postData)

      const headers = this.getAuthHeaders()
      console.log('🔑 Request Headers:', headers)

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(postData),
      })

      console.log('📡 Response Status:', response.status, response.statusText)

      let data
      try {
        data = await response.json()
        console.log('📡 Response Data:', data)
      } catch (e) {
        console.error('❌ Failed to parse response JSON:', e)
        throw new Error('Server trả về dữ liệu không hợp lệ')
      }

      if (!response.ok) {
        // Xử lý các loại lỗi khác nhau
        if (response.status === 401) {
          throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!')
        } else if (response.status === 403) {
          const message = this.extractApiErrorMessage(data, 'Bạn không có quyền thực hiện hành động này!')
          throw new Error(message)
        } else if (response.status === 400) {
          const errorMessage = this.extractApiErrorMessage(data, 'Dữ liệu không hợp lệ')
          throw new Error(errorMessage)
        }
        
        const errorMessage = this.extractApiErrorMessage(data, 'Không thể tạo bài đăng')
        console.error('❌ Create Post Failed:', errorMessage)
        throw new Error(errorMessage)
      }

      console.log('✅ Create Post Success:', data)
      return data
    } catch (error: any) {
      console.error('❌ Create Post Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi tạo bài đăng')
    }
  }

  // Tạo bài đăng mới kèm ảnh từ file
  static async createPostWithFiles(postData: CreatePostDto, files: File[]): Promise<PostResponseDto> {
    try {
      if (!files || files.length === 0) {
        return await this.createPost(postData)
      }

      const token = typeof window !== 'undefined'
        ? localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
        : null

      if (!token) {
        throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!')
      }

      const formData = new FormData()
      formData.append('title', postData.title)
      formData.append('description', postData.description)

      if (postData.location) formData.append('location', postData.location)
      if (postData.desiredTime) formData.append('desiredTime', postData.desiredTime)
      if (postData.budget !== undefined && postData.budget !== null) {
        formData.append('budget', String(postData.budget))
      }

      files.forEach(file => formData.append('files', file))

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!')
        }

        throw new Error(this.extractApiErrorMessage(data, 'Không thể tạo bài đăng với ảnh'))
      }

      return data
    } catch (error: any) {
      console.error('❌ Create Post With Files Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi tải ảnh lên bài đăng')
    }
  }

  // Cập nhật bài đăng
  static async updatePost(id: string, postData: UpdatePostDto): Promise<PostResponseDto> {
    try {
      console.log('🔵 Update Post Request:', id, postData)

      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(this.extractApiErrorMessage(errorData, 'Không thể cập nhật bài đăng'))
      }

      const data = await response.json()
      console.log('✅ Update Post Success:', data)
      return data
    } catch (error: any) {
      console.error('❌ Update Post Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi cập nhật bài đăng')
    }
  }

  // Xóa bài đăng
  static async deletePost(id: string): Promise<DeletePostResponseDto> {
    try {
      console.log('🔵 Delete Post Request:', id)

      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể xóa bài đăng')
      }

      const data = await response.json()
      console.log('✅ Delete Post Success:', data)
      return data
    } catch (error: any) {
      console.error('❌ Delete Post Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi xóa bài đăng')
    }
  }

  // Đóng bài đăng
  static async closePost(id: string): Promise<PostResponseDto> {
    try {
      console.log('🔵 Close Post Request:', id)

      const response = await fetch(`/api/posts/${id}/close`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể đóng bài đăng')
      }

      const data = await response.json()
      console.log('✅ Close Post Success:', data)
      return data
    } catch (error: any) {
      console.error('❌ Close Post Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi đóng bài đăng')
    }
  }

  // Lấy danh sách bài đăng của tôi
  static async getMyPosts(params?: { limit?: number; cursor?: string }): Promise<FeedResponseDto> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.cursor) queryParams.append('cursor', params.cursor)

      const url = `/api/posts/my/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Không thể tải bài đăng của bạn')
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('❌ Get My Posts Error:', error)
      throw new Error(error?.message || 'Có lỗi xảy ra khi tải bài đăng của bạn')
    }
  }
}
