import { API_CONFIG, TOKEN_KEYS } from './config'

// Types cho Profile API
export interface Profile {
  id: string
  email: string
  phone?: string | null
  fullName?: string | null
  displayName?: string | null
  avatar?: string | null
  bio?: string | null
  accountType: 'CUSTOMER' | 'WORKER'
  contactInfo?: ContactInfo
  rating?: number
  totalReviews?: number
  completedJobs?: number
  isVerified?: boolean
  skills?: string[]
  location?: Location
  createdAt: string
  updatedAt?: string
  joinedAt?: string
}

export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
  city?: string
  district?: string
  ward?: string
}

export interface Location {
  city?: string
  district?: string
  ward?: string
}

export interface UpdateProfileRequest {
  fullName?: string
  displayName?: string
  bio?: string
  phone?: string
}

export interface UpdateContactRequest {
  phone?: string
  email?: string
  address?: string
  city?: string
  district?: string
  ward?: string
}

export interface UpdateDisplayNameRequest {
  displayName: string
}

export interface UpdateAvatarRequest {
  avatarUrl?: string
  avatar?: File
}

export interface DeleteAccountRequest {
  password?: string
  reason?: string
}

export interface SearchProfileParams {
  q?: string
  accountType?: 'CUSTOMER' | 'WORKER'
  city?: string
  district?: string
  skills?: string
  minRating?: number
  isVerified?: boolean
  page?: number
  limit?: number
  sortBy?: 'rating' | 'reviews' | 'joinedAt' | 'name'
  order?: 'asc' | 'desc'
}

export interface SearchProfileResponse {
  data: Profile[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Profile Service
export class ProfileService {
  private static getHeaders(includeAuth: boolean = true) {
    const headers: HeadersInit = {
      ...API_CONFIG.HEADERS,
    }

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  /**
   * GET /api/v1/profile/me
   * Lấy thông tin profile của user hiện tại
   */
  static async getMyProfile(): Promise<Profile> {
    try {
      console.log('🔵 Get My Profile Request')

      // Gọi qua Next.js API route để tránh CORS
      const response = await fetch(
        '/api/profile/me',
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      )

      console.log('🔵 Get My Profile Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Get My Profile Error:', errorText)
        throw new Error('Không thể lấy thông tin profile')
      }

      const result = await response.json()
      console.log('✅ Get My Profile Success:', result)

      const profileData = result.data || result

      // Load contact info từ localStorage nếu có (fallback)
      if (typeof window !== 'undefined') {
        const savedContactInfo = localStorage.getItem('contact_info')
        if (savedContactInfo) {
          try {
            profileData.contactInfo = JSON.parse(savedContactInfo)
          } catch (e) {
            console.error('Error parsing contact info:', e)
          }
        }

        // Load avatar từ localStorage nếu backend chưa có (fallback)
        if (!profileData.avatar && profileData.id) {
          const avatarKey = `user_avatar_${profileData.id}`
          const savedAvatar = localStorage.getItem(avatarKey)
          if (savedAvatar) {
            profileData.avatar = savedAvatar
            console.log('📸 Avatar loaded from localStorage cache')
          }
        } else if (profileData.avatar && profileData.id) {
          // Cache avatar từ backend vào localStorage
          const avatarKey = `user_avatar_${profileData.id}`
          localStorage.setItem(avatarKey, profileData.avatar)
          console.log('💾 Avatar cached from backend to localStorage')
        }
      }

      return profileData
    } catch (error) {
      console.error('❌ Get My Profile Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi lấy thông tin profile')
    }
  }

  /**
   * PATCH /api/v1/profile/me
   * Cập nhật thông tin profile
   */
  static async updateProfile(data: UpdateProfileRequest): Promise<Profile> {
    try {
      console.log('🔵 Update Profile Request:', data)

      // Gọi qua Next.js API route để tránh CORS
      const response = await fetch(
        '/api/profile/me',
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        }
      )

      console.log('🔵 Update Profile Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Update Profile Error:', errorText)
        throw new Error('Không thể cập nhật profile')
      }

      const result = await response.json()
      console.log('✅ Update Profile Success:', result)

      return result.data || result
    } catch (error) {
      console.error('❌ Update Profile Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi cập nhật profile')
    }
  }

  /**
   * DELETE /api/v1/profile/me
   * Xóa tài khoản người dùng
   */
  static async deleteAccount(data?: DeleteAccountRequest): Promise<void> {
    try {
      console.log('🔵 Delete Account Request')

      const response = await fetch(
        '/api/profile/me',
        {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: data ? JSON.stringify(data) : undefined,
        }
      )

      console.log('🔵 Delete Account Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Delete Account Error:', errorText)
        throw new Error('Không thể xóa tài khoản')
      }

      console.log('✅ Delete Account Success')
    } catch (error) {
      console.error('❌ Delete Account Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi xóa tài khoản')
    }
  }

  /**
   * PUT /api/v1/profile/contact
   * Cập nhật thông tin liên hệ
   * Lưu thông tin vào localStorage vì backend chưa hỗ trợ endpoint riêng
   */
  static async updateContact(data: UpdateContactRequest): Promise<Profile> {
    try {
      console.log('🔵 Update Contact Request:', data)

      // Lấy profile hiện tại
      const currentProfile = await this.getMyProfile()

      // Lưu contact info vào localStorage
      if (typeof window !== 'undefined') {
        const contactInfo = {
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          district: data.district,
          ward: data.ward
        }
        localStorage.setItem('contact_info', JSON.stringify(contactInfo))
      }

      // Cập nhật phone nếu có
      if (data.phone && data.phone !== currentProfile.phone) {
        const updateData: UpdateProfileRequest = {
          phone: data.phone
        }
        return await this.updateProfile(updateData)
      }

      // Trả về profile với contact info đã update
      return {
        ...currentProfile,
        contactInfo: {
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          district: data.district,
          ward: data.ward
        }
      }
    } catch (error) {
      console.error('❌ Update Contact Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi cập nhật thông tin liên hệ')
    }
  }

  /**
   * PUT /api/v1/profile/display-name
   * Thay đổi tên hiển thị
   */
  static async updateDisplayName(displayName: string): Promise<Profile> {
    try {
      console.log('🔵 Update Display Name Request:', displayName)

      // Dùng updateProfile
      return await this.updateProfile({ displayName })
    } catch (error) {
      console.error('❌ Update Display Name Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi thay đổi tên hiển thị')
    }
  }

  /**
   * PATCH /api/v1/profile/avatar
   * Cập nhật avatar - Lưu vào localStorage vì backend chưa hỗ trợ base64 upload
   * TODO: Cần upload lên cloud storage (S3, Cloudinary) để lấy URL thật
   */
  static async updateAvatarFile(file: File): Promise<Profile> {
    try {
      console.log('🔵 Update Avatar (File) Request')

      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB')
      }

      // Nén ảnh
      const compressedDataUrl = await this.compressImage(file, 800, 0.7)
      
      console.log('💾 Saving avatar to localStorage (backend needs real URL, not base64)...')

      // Lưu vào localStorage với userId
      const currentProfile = await this.getMyProfile()
      if (typeof window !== 'undefined' && currentProfile.id) {
        const avatarKey = `user_avatar_${currentProfile.id}`
        localStorage.setItem(avatarKey, compressedDataUrl)
        console.log('✅ Avatar saved to localStorage:', avatarKey)
      }

      // Trả về profile với avatar mới
      return {
        ...currentProfile,
        avatar: compressedDataUrl
      }
    } catch (error) {
      console.error('❌ Update Avatar Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi cập nhật avatar')
    }
  }

  /**
   * Nén ảnh để giảm kích thước
   */
  private static compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Resize nếu ảnh quá lớn
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Không thể tạo canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert sang base64 với chất lượng thấp hơn
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('Không thể load ảnh'))
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => reject(new Error('Không thể đọc file'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * PATCH /api/v1/profile/avatar
   * Cập nhật avatar (URL)
   */
  static async updateAvatarUrl(avatarUrl: string): Promise<Profile> {
    try {
      console.log('🔵 Update Avatar (URL) Request:', avatarUrl)

      // Dùng updateProfile với avatar
      return await this.updateProfile({ avatar: avatarUrl } as any)
    } catch (error) {
      console.error('❌ Update Avatar Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi cập nhật avatar')
    }
  }

  /**
   * GET /api/v1/profile/user/{id}
   * Lấy profile công khai của user khác
   */
  static async getUserProfile(userId: string): Promise<Profile> {
    try {
      console.log('🔵 Get User Profile Request:', userId)

      const response = await fetch(`/api/profile/user/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(false), // Không bắt buộc auth
      })

      console.log('🔵 Get User Profile Response Status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Get User Profile Error:', errorData)
        throw new Error(errorData.error || 'Không thể lấy thông tin user')
      }

      const result = await response.json()
      console.log('✅ Get User Profile Success:', result)

      return result.data || result
    } catch (error) {
      console.error('❌ Get User Profile Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi lấy thông tin user')
    }
  }

  /**
   * GET /api/v1/profile/search
   * Tìm kiếm profiles
   */
  static async searchProfiles(params: SearchProfileParams): Promise<SearchProfileResponse> {
    try {
      console.log('🔵 Search Profiles Request:', params)

      const queryString = new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString()

      const response = await fetch(`/api/profile/search?${queryString}`, {
        method: 'GET',
        headers: this.getHeaders(false), // Không bắt buộc auth
      })

      console.log('🔵 Search Profiles Response Status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Search Profiles Error:', errorData)
        throw new Error(errorData.error || 'Không thể tìm kiếm profiles')
      }

      const result = await response.json()
      console.log('✅ Search Profiles Success:', result)

      return result
    } catch (error) {
      console.error('❌ Search Profiles Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi tìm kiếm profiles')
    }
  }
}
