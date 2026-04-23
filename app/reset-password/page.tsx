'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ThoTotLogo from '../components/ThoTotLogo'
import { AuthService } from '@/lib/api/auth.service'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      setLoading(true)
      setError('')

      await AuthService.resetForgotPassword({
        token,
        newPassword,
        confirmPassword,
      })

      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
      router.push('/dang-nhap')
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ThoTotLogo className="w-56 md:w-64" />
          </div>
          <p className="text-gray-600 text-sm">Đặt lại mật khẩu tài khoản của bạn</p>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Tạo mật khẩu mới</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Nhập mật khẩu mới"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 mt-2"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Quay lại{' '}
          <Link href="/dang-nhap" className="text-blue-500 hover:text-blue-600 font-medium">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
