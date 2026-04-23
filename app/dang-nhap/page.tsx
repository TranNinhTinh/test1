'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThoTotLogo from '../components/ThoTotLogo'
import { AuthService, LoginRequest } from '@/lib/api/auth.service'

export default function DangNhap() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email')
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tự động điền thông tin đăng nhập đã lưu (không tự động submit)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const credentials = AuthService.getRememberedCredentials()
      if (credentials) {
        // Chỉ điền vào form, không tự động đăng nhập
        setFormData({
          identifier: credentials.identifier,
          password: credentials.password,
          rememberMe: true
        })
        console.log('✅ Đã tự động điền thông tin đăng nhập đã lưu')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Gửi identifier trực tiếp lên backend (có thể là email hoặc phone)
      const identifier = formData.identifier.trim()

      console.log(`🔵 Đăng nhập với ${loginType}:`, identifier)

      const loginData: LoginRequest = {
        identifier: identifier,
        password: formData.password
      }

      // Gọi API đăng nhập - Backend sẽ tự xử lý email hoặc phone
      const response = await AuthService.login(loginData, formData.rememberMe)

      console.log('✅ Đăng nhập thành công:', response)

      // Lưu user data vào localStorage để sử dụng sau này
      if (response.user) {
        localStorage.setItem('user_data', JSON.stringify(response.user))
      }

      // Reset cờ thông báo hết phiên để lần hết hạn tiếp theo vẫn hiển thị alert
      sessionStorage.removeItem('auth_expired_notice_shown')

      // Chuyển hướng đến trang home
      router.push('/home')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Email hoặc số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra lại!')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // Xử lý đăng nhập bằng Google
    console.log('Google login clicked')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Phần trái - Logo và Slogan */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-start pt-32 p-8">
        <div className="text-center max-w-2xl">
          <div className="mb-2">
            <ThoTotLogo className="w-80" />
          </div>
          <p className="text-gray-800 text-xl font-bold leading-tight">
            Thợ Tốt nơi cung cấp dịch vụ số 1 Việt Nam
          </p>
        </div>
      </div>

      {/* Phần phải - Form Đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-sm w-full">
          {/* Tiêu đề */}

          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
              {error}
            </div>
          )}

          {/* Biểu mẫu */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Email hoặc số điện thoại"
              required
            />

            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Mật khẩu"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3 px-6 rounded transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-base mt-4"
              style={{ backgroundColor: '#00B7B5' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#009999'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00B7B5'}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Quên mật khẩu */}
          <div className="text-center mt-4">
            <Link href="/quen-mat-khau" className="text-sm font-semibold hover:opacity-80 transition" style={{ color: '#00B7B5' }}>
              Quên mật khẩu?
            </Link>
          </div>

          {/* Đường phân cách */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">hoặc</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Nút tạo tài khoản mới */}
          <Link href="/dang-ky" className="block text-center">
            <button
              type="button"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded transition duration-200 text-base"
            >
              Tạo tài khoản mới
            </button>
          </Link>

          {/* Chân trang */}
          <div className="text-center mt-6 text-xs text-gray-600">
            Bạn trao tôi niềm tin tôi trao bạn tất cả.
          </div>
        </div>
      </div>
    </div>
  )
}
