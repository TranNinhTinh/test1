import { TOKEN_KEYS } from './config'
import apiClient from './client'
import type { 
  LoginDto, 
  RegisterDto, 
  LoginResponseDto, 
  RegisterResponseDto 
} from './index'

// Types cho API request/response
export interface LoginRequest extends LoginDto {}

export interface RegisterRequest extends RegisterDto {
  role?: 'customer' | 'provider'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email?: string
    phone?: string
    fullName?: string
  }
}

export interface ForgotPasswordRequest {
  identifier?: string
  email?: string
  phone?: string
}

export interface ResetForgotPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

// Auth Service sử dụng SDK
export class AuthService {
  private static isHandlingTokenExpired = false

  static async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const normalizedIdentifier =
      data.identifier?.trim() || data.email?.trim() || data.phone?.trim() || ''

    if (!normalizedIdentifier) {
      throw new Error('Vui lòng nhập email hoặc số điện thoại')
    }

    const payload: ForgotPasswordRequest = {
      identifier: normalizedIdentifier,
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
      payload.email = normalizedIdentifier
    }

    if (/^0\d{9,10}$/.test(normalizedIdentifier)) {
      payload.phone = normalizedIdentifier
    }

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    let responseData: any = {}

    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch {
      throw new Error('Phản hồi không hợp lệ từ máy chủ')
    }

    if (!response.ok || responseData?.success === false) {
      throw new Error(responseData?.message || 'Không thể gửi yêu cầu quên mật khẩu')
    }

    return {
      message: responseData?.message || 'Yêu cầu đặt lại mật khẩu đã được gửi',
    }
  }

  static async resetForgotPassword(data: ResetForgotPasswordRequest): Promise<void> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const responseText = await response.text()
    let responseData: any = {}

    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch {
      throw new Error('Phản hồi không hợp lệ từ máy chủ')
    }

    if (!response.ok || responseData?.success === false) {
      throw new Error(responseData?.message || 'Không thể đặt lại mật khẩu')
    }
  }

  // Lưu thông tin đăng nhập để tự động đăng nhập lần sau
  static saveRememberMe(identifier: string, password: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('remember_me', 'true')
      localStorage.setItem('saved_identifier', identifier)
      // Mã hóa đơn giản (trong production nên dùng phương pháp bảo mật hơn)
      localStorage.setItem('saved_password', btoa(password))
    }
  }

  // Xóa thông tin ghi nhớ
  static clearRememberMe() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('remember_me')
      localStorage.removeItem('saved_identifier')
      localStorage.removeItem('saved_password')
    }
  }

  // Lấy thông tin đã lưu
  static getRememberedCredentials(): { identifier: string; password: string } | null {
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem('remember_me')
      if (rememberMe === 'true') {
        const identifier = localStorage.getItem('saved_identifier')
        const encodedPassword = localStorage.getItem('saved_password')
        if (identifier && encodedPassword) {
          try {
            return {
              identifier,
              password: atob(encodedPassword)
            }
          } catch {
            return null
          }
        }
      }
    }
    return null
  }

  // Đăng nhập
  static async login(data: LoginRequest, rememberMe: boolean = false): Promise<AuthResponse> {
    try {
      console.log('🔵 Login Request:', { ...data, password: '***' })

      // Gọi qua proxy route để tránh CORS
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      // Đọc body một lần duy nhất dưới dạng text
      const responseText = await response.text()
      let responseData

      // Cố gắng parse như JSON
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Phản hồi không phải JSON, status:', response.status)
        console.error('📄 Nội dung:', responseText.substring(0, 200))
        throw new Error('Backend trả về lỗi: ' + responseText.substring(0, 100))
      }
      
      console.log('✅ Login Response Status:', response.status)
      console.log('✅ Login Response Data:', responseData)

      if (!response.ok) {
        const errorMessage = responseData.message || 'Email hoặc mật khẩu không đúng'
        console.error('❌ Login failed:', errorMessage)
        throw new Error(errorMessage)
      }

      if (!responseData.data) {
        throw new Error('Không nhận được dữ liệu từ máy chủ')
      }

      const result = responseData.data
      
      // Lưu token vào localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, result.accessToken)
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, result.refreshToken)
        
        // Lưu thông tin ghi nhớ nếu được chọn
        if (rememberMe) {
          this.saveRememberMe(data.identifier, data.password)
        } else {
          this.clearRememberMe()
        }
      }

      console.log('✅ Login Success!')

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user as any
      }
    } catch (error: any) {
      console.error('❌ Login Error:', error)
      
      let userMessage = 'Email hoặc mật khẩu không đúng'
      
      if (error?.message) {
        userMessage = error.message
      }
      
      throw new Error(userMessage)
    }
  }

  // Đăng ký
  static async register(data: RegisterRequest): Promise<{ success: boolean, message: string }> {
    try {
      console.log('🔵 Register Request:', { ...data, password: '***' })

      // Gọi qua proxy route để tránh CORS
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()
      
      console.log('✅ Register API Response Status:', response.status)
      console.log('✅ Register API Response Data:', responseData)

      // Kiểm tra nếu response không OK (status 4xx, 5xx)
      if (!response.ok) {
        console.error('❌ Register failed with status:', response.status)
        const errorMessage = responseData.message || 'Đăng ký thất bại'
        throw new Error(errorMessage)
      }

      // Kiểm tra nếu response có success field và = false
      if (responseData.success === false) {
        console.error('❌ Register failed:', responseData.message)
        throw new Error(responseData.message || 'Đăng ký thất bại')
      }

      console.log('✅ Register Success!')

      // Trả về success để component redirect về trang đăng nhập
      return {
        success: true,
        message: responseData.message || 'Đăng ký thành công'
      }
    } catch (error: any) {
      console.error('❌ Register Error:', error)
      
      let userMessage = 'Đăng ký thất bại'
      
      if (error?.message) {
        userMessage = error.message
      }
      
      throw new Error(userMessage)
    }
  }

  // Làm mới token
  static async refreshToken(): Promise<AuthResponse> {
    try {
      console.log('🔄 Đang làm mới token...')
      const response: any = await apiClient.auth.authControllerRefresh()
      const result = response?.data?.data

      if (!result) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
      }
      
      // Cập nhật token mới
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, result.accessToken)
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, result.refreshToken)
        console.log('✅ Làm mới token thành công!')
      }

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user as any
      }
    } catch (error) {
      console.error('❌ Lỗi khi làm mới token:', error)
      // Nếu refresh token cũng fail, redirect về trang đăng nhập
      this.handleTokenExpired()
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Có lỗi xảy ra khi làm mới token')
    }
  }

  // Đăng xuất
  static async logout(): Promise<void> {
    try {
      await apiClient.auth.authControllerLogout()
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error)
    } finally {
      // Xóa token khỏi localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN)
        // Không xóa Remember Me - để người dùng có thể đăng nhập lại dễ dàng
        // Nếu muốn xóa hoàn toàn, uncomment dòng dưới:
        // this.clearRememberMe()
      }
    }
  }

  // Lấy access token
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
  }

  // Alias cho getAccessToken
  static getToken(): string | null {
    return this.getAccessToken()
  }

  // Kiểm tra đã đăng nhập
  static isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  // Xử lý token hết hạn - tự động redirect về trang đăng nhập
  static handleTokenExpired(): void {
    if (typeof window === 'undefined') return

    // Tránh nhiều request 401 gọi alert/redirect chồng lên nhau
    if (this.isHandlingTokenExpired) return
    this.isHandlingTokenExpired = true

    // Xóa token cũ (bao gồm cả key legacy để tránh vòng lặp auth)
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    // Chỉ hiện 1 alert cho mỗi phiên xử lý
    const sessionNoticeKey = 'auth_expired_notice_shown'
    const hasShownNotice = sessionStorage.getItem(sessionNoticeKey) === '1'

    if (!hasShownNotice) {
      sessionStorage.setItem(sessionNoticeKey, '1')
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
    }

    const loginPath = '/dang-nhap'
    if (window.location.pathname !== loginPath) {
      window.location.replace(loginPath)

      // Fallback trong trường hợp trình duyệt chặn replace ở một số tình huống hiếm
      setTimeout(() => {
        if (window.location.pathname !== loginPath) {
          window.location.assign(loginPath)
        }
      }, 150)
    }
  }
}
