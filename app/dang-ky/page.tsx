'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThoTotLogo from '../components/ThoTotLogo'
import { AuthService, RegisterRequest } from '@/lib/api/auth.service'

export default function DangKy() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'WORKER' | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''

  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Kiểm tra loại tài khoản
    if (!accountType) {
      setError('Vui lòng chọn loại tài khoản!')
      return
    }

    // Kiểm tra các trường bắt buộc
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên!')
      return
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email!')
      return
    }
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại!')
      return
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu!')
      return
    }

    // Kiểm tra mật khẩu khớp
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    setLoading(true)

    try {
      // Chuẩn bị dữ liệu đăng ký
      // Format số điện thoại: thêm +84 nếu chưa có
      let phoneNumber = formData.phone.trim()
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+84' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+84' + phoneNumber
      }

      const registerData: RegisterRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: phoneNumber,
        password: formData.password,
        role: accountType === 'CUSTOMER' ? 'customer' : 'provider'
      }

      console.log('📝 Sending register data:', {
        ...registerData,
        password: '***'
      })

      // Gọi API đăng ký
      const response = await AuthService.register(registerData)

      console.log('✅ Đăng ký thành công:', response)

      // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
      alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.')
      router.push('/dang-nhap')
    } catch (err) {
      console.error('❌ Lỗi đăng ký:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!')
      }
    } finally {
      setLoading(false)
    }
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

      {/* Phần phải - Form Đăng ký */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-sm w-full">
          {/* Tiêu đề */}

          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
              {error}
            </div>
          )}

          {/* Chọn loại tài khoản */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setAccountType('CUSTOMER')}
              className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition ${accountType === 'CUSTOMER'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setAccountType('WORKER')}
              className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition ${accountType === 'WORKER'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Thợ
            </button>
          </div>

          {/* Biểu mẫu */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Họ và tên"
              required
            />

            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Email"
              required
            />

            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Số điện thoại"
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

            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Xác nhận mật khẩu"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-base mt-4"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Chân trang */}
          <div className="text-center mt-6 text-xs text-gray-600">
            <p className="mb-2">Đã có tài khoản? <Link href="/dang-nhap" className="text-sm font-semibold hover:opacity-80 transition" style={{ color: '#00B7B5' }}>Đăng nhập</Link></p>
            <p className="text-gray-500">Bạn trao tôi niềm tin tôi trao bạn tất cả.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
