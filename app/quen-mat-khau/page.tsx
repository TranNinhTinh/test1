'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThoTotLogo from '../components/ThoTotLogo'
import { AuthService } from '@/lib/api/auth.service'

export default function QuenMatKhau() {
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  })

  const requestResetLink = async () => {
    const identifier = (contactType === 'email' ? formData.email : formData.phone).trim()
    if (!identifier) {
      setError('Vui lòng nhập email hoặc số điện thoại')
      return
    }

    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setError('Email không hợp lệ')
      return
    }

    if (contactType === 'phone' && !/^0\d{9,10}$/.test(identifier)) {
      setError('Số điện thoại không hợp lệ')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccessMessage('')

      const result = await AuthService.forgotPassword({
        identifier,
        email: contactType === 'email' ? identifier : undefined,
        phone: contactType === 'phone' ? identifier : undefined,
      })
      setSuccessMessage(result.message || 'Nếu tài khoản tồn tại, chúng tôi đã gửi link đặt lại mật khẩu về email của bạn')
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi yêu cầu quên mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    await requestResetLink()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Phần đầu trang */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ThoTotLogo className="w-56 md:w-64" />
          </div>
          <p className="text-gray-600 text-sm">Kết nối khách hàng và thợ chuyên nghiệp</p>
        </div>

        {/* Tiêu đề */}
        <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Quên mật khẩu</h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Nhập thông tin tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu qua email
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setContactType('email')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition duration-200 ${
              contactType === 'email'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setContactType('phone')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition duration-200 ${
              contactType === 'phone'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Số điện thoại
          </button>
        </div>

        <form onSubmit={handleSendRequest} className="space-y-4">
          {contactType === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Nhập số điện thoại của bạn"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 mt-6"
          >
            {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>

        {/* Chân trang */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Nhớ mật khẩu?{' '}
          <Link href="/dang-nhap" className="text-blue-500 hover:text-blue-600 font-medium">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
