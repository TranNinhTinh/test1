import { API_CONFIG, TOKEN_KEYS } from './config'

// ============ Types & Interfaces ============

export interface DisplayNameChangeInfo {
    canChange: boolean
    lastChanged?: Date
    changeCount: number
    daysUntilNextChange: number
}

export interface ProfileResponse {
    id: string
    email?: string | null
    phone?: string | null
    role?: 'customer' | 'provider' | null
    fullName?: string
    displayName?: string
    avatarUrl?: string
    bio?: string
    address?: string
    birthday?: Date
    gender?: string
    isVerified?: boolean
    isActive?: boolean | null
    displayNameChangeInfo: DisplayNameChangeInfo
    createdAt?: Date | null
    updatedAt: Date
}

export interface PublicProfileResponse {
    id: string
    role?: 'customer' | 'provider'
    displayName?: string
    avatarUrl?: string
    bio?: string
    isVerified?: boolean
    memberSince?: Date
}

export interface ProfileListResponse {
    profiles: PublicProfileResponse[]
    total: number
    count: number
}

export interface DisplayNameChangeResponse {
    success: boolean
    message: string
    newDisplayName: string
    changedAt: Date
    daysUntilNextChange: number
}

export interface DeleteAccountResponse {
    success: boolean
    message: string
}

// ============ Request DTOs ============

export interface UpdateProfileDto {
    fullName?: string
    avatarUrl?: string
    bio?: string
    address?: string
    birthday?: Date
    gender?: string
}

export interface UpdateContactDto {
    email?: string
    phone?: string
}

export interface ChangeDisplayNameDto {
    displayName: string
}

export interface UpdateAvatarDto {
    avatarUrl: string
}

export interface SearchProfilesQuery {
    searchTerm?: string
    limit?: number
    offset?: number
}

// ============ Profile Service ============

export class ProfileService {
    private static readonly BASE_URL = '/api/profile'

    static getAuthToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
    }

    private static getHeaders(isFormData: boolean = false) {
        const token = this.getAuthToken()
        const headers: HeadersInit = {}

        if (!isFormData) {
            headers['Content-Type'] = 'application/json'
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return headers
    }

    // ============ My Profile Endpoints ============

    /**
     * Get my complete profile information
     */
    static async getMyProfile(): Promise<ProfileResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/me`, {
                method: 'GET',
                headers: this.getHeaders(),
            })

            if (!response.ok) {
                if (response.status === 401) throw new Error('Unauthorized')
                if (response.status === 404) throw new Error('User not found')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error getting my profile:', error)
            throw error
        }
    }

    /**
     * Update my profile (excluding display name and contact info)
     */
    static async updateProfile(dto: UpdateProfileDto): Promise<ProfileResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/me`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(dto),
            })

            if (!response.ok) {
                if (response.status === 400) throw new Error('Invalid input')
                if (response.status === 401) throw new Error('Unauthorized')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error updating profile:', error)
            throw error
        }
    }

    /**
     * Update email and/or phone number
     */
    static async updateContact(dto: UpdateContactDto): Promise<ProfileResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/contact`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(dto),
            })

            if (!response.ok) {
                if (response.status === 400) throw new Error('Invalid email or phone format')
                if (response.status === 401) throw new Error('Unauthorized')
                if (response.status === 409) throw new Error('Email or phone already in use')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error updating contact:', error)
            throw error
        }
    }

    /**
     * Change display name (restricted to once every 30 days)
     */
    static async changeDisplayName(dto: ChangeDisplayNameDto): Promise<DisplayNameChangeResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/display-name`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(dto),
            })

            if (!response.ok) {
                const errorData = await response.json()
                if (response.status === 400) throw new Error(errorData.message || 'Invalid display name')
                if (response.status === 401) throw new Error('Unauthorized')
                if (response.status === 403) {
                    const error = new Error(errorData.message || 'Cannot change display name yet') as any
                    error.daysUntilCanChange = errorData.daysUntilCanChange
                    throw error
                }
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error changing display name:', error)
            throw error
        }
    }

    /**
     * Update avatar URL
     */
    static async updateAvatar(dto: UpdateAvatarDto): Promise<ProfileResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/avatar`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(dto),
            })

            if (!response.ok) {
                if (response.status === 400) throw new Error('Invalid avatar URL format')
                if (response.status === 401) throw new Error('Unauthorized')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error updating avatar:', error)
            throw error
        }
    }

    /**
     * Upload avatar from local file
     */
    static async uploadAvatarFile(file: File): Promise<ProfileResponse> {
        try {
            const token = this.getAuthToken()
            if (!token) {
                throw new Error('Vui lòng đăng nhập trước khi tải lên ảnh')
            }

            const maxAvatarSize = 2 * 1024 * 1024
            if (file.size > maxAvatarSize) {
                throw new Error('Kích thước file tối đa 2MB')
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)')
            }

            const formData = new FormData()
            formData.append('file', file)

            const headers: HeadersInit = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
            // NOTE: Do NOT set Content-Type for FormData - browser will set it automatically with boundary

            console.log('🔵 Uploading avatar file:', { fileName: file.name, fileSize: file.size, fileType: file.type })

            const response = await fetch(`${this.BASE_URL}/avatar`, {
                method: 'PATCH',
                headers,
                body: formData,
            })

            console.log('🔵 Avatar upload response status:', response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('❌ Avatar upload error response:', errorData)
                
                const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`
                const errorDetails = errorData.details || errorData.statusCode || ''
                const fullError = errorDetails ? `${errorMsg} (${errorDetails})` : errorMsg
                
                if (response.status === 400) throw new Error(fullError)
                if (response.status === 401) throw new Error('Unauthorized - vui lòng đăng nhập lại')
                if (response.status === 500) throw new Error(`Lỗi máy chủ: ${fullError}`)
                throw new Error(fullError)
            }

            const result = await response.json()
            console.log('✅ Avatar uploaded successfully:', result)
            return result
        } catch (error) {
            console.error('❌ Error uploading avatar file:', error)
            if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
                throw new Error('Không thể kết nối máy chủ upload avatar. Vui lòng kiểm tra backend/API domain và thử lại.')
            }
            throw error
        }
    }

    /**
     * Delete account (soft delete, can be recovered within 30 days)
     */
    static async deleteAccount(): Promise<DeleteAccountResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/me`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            })

            if (!response.ok) {
                if (response.status === 401) throw new Error('Unauthorized')
                if (response.status === 500) throw new Error('Failed to delete account')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error deleting account:', error)
            throw error
        }
    }

    // ============ Public Profile Endpoints ============

    /**
     * Get public profile of a user
     */
    static async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
        try {
            const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                if (response.status === 400) throw new Error('Invalid UUID format')
                if (response.status === 404) throw new Error('User not found or account inactive')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error getting public profile:', error)
            throw error
        }
    }

    /**
     * Search for users by display name
     */
    static async searchProfiles(query: SearchProfilesQuery = {}): Promise<ProfileListResponse> {
        try {
            const { searchTerm = '', limit = 20, offset = 0 } = query

            const params = new URLSearchParams()
            if (searchTerm) params.append('searchTerm', searchTerm)
            params.append('limit', limit.toString())
            params.append('offset', offset.toString())

            const response = await fetch(`${this.BASE_URL}/search?${params}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                if (response.status === 400) throw new Error('Invalid query parameters')
                throw new Error(`HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('❌ Error searching profiles:', error)
            throw error
        }
    }
}
