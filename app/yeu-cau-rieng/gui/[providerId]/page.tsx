'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService, type PublicProfileResponse } from '@/lib/api/profile-new.service'
import { customRequestService } from '@/lib/api/custom-request.service'
import { resolveMediaUrl } from '@/lib/media-url'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'

const VIETNAM_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ', 'Đà Nẵng',
  'Huế', 'Cao Bằng', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Lạng Sơn',
  'Quảng Ninh', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Tuyên Quang',
  'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên',
  'Ninh Bình', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Đắk Lắk',
  'Khánh Hòa', 'Lâm Đồng', 'Tây Ninh', 'Đồng Tháp', 'An Giang',
  'Vĩnh Long', 'Cà Mau',
] as const

export default function SendCustomRequestPage() {
  const router = useRouter()
  const params = useParams()
  const providerId = params.providerId as string

  const [provider, setProvider] = useState<PublicProfileResponse | null>(null)
  const [loadingProvider, setLoadingProvider] = useState(true)
  const [providerError, setProviderError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [desiredTime, setDesiredTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!AuthService.getToken()) {
      router.replace('/dang-nhap')
      return
    }
    loadProvider()
  }, [providerId])

  const loadProvider = async () => {
    try {
      setLoadingProvider(true)
      setProviderError('')
      const data = await ProfileService.getPublicProfile(providerId)
      if (data.role !== 'provider') {
        setProviderError('Người dùng này không phải là thợ/nhà cung cấp dịch vụ.')
        return
      }
      setProvider(data)
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : 'Không thể tải thông tin thợ')
    } finally {
      setLoadingProvider(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề yêu cầu.')
      return
    }
    if (!description.trim()) {
      setFormError('Vui lòng nhập mô tả chi tiết công việc.')
      return
    }

    try {
      setSubmitting(true)
      await customRequestService.create({
        providerId,
        title: title.trim(),
        description: description.trim(),
        location: location || undefined,
        desiredTime: desiredTime || undefined,
      })
      router.push('/yeu-cau-rieng?sent=1')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProvider) {
    return (
      <AppShell>
        <div className="min-h-screen bg-surface-lowest flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin thợ...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (providerError || !provider) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{providerError || 'Không tìm thấy thợ'}</p>
          <button
            onClick={() => router.back()}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
          >
            Quay lại
          </button>
        </div>
      </AppShell>
    )
  }

  const providerName = provider.displayName || 'Thợ'
  const avatarUrl = resolveMediaUrl(provider.avatarUrl)

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest py-app-lg">

        <div className="app-container max-w-2xl">
          <div className="mb-app-md">
            <button
              onClick={() => router.back()}
              className="mb-app-sm flex items-center gap-2 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
          </div>

          <div className="overflow-hidden rounded-app-xl border border-outline-variant/60 bg-surface shadow-float">
            {/* Header — matches "Tạo bài đăng mới" gradient */}
            <div className="bg-gradient-to-r from-[#0D9488] to-[#06B6D4] px-app-md py-app-md text-white">
              <h1 className="text-xl font-bold sm:text-2xl">Gửi yêu cầu riêng</h1>
              <p className="mt-1 text-sm text-white/90">Mô tả công việc cần làm để gửi trực tiếp tới thợ</p>
            </div>

            {/* Provider info card */}
            <div className="mx-app-md mt-app-md rounded-xl border border-teal-100 bg-teal-50/50 p-4 flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={providerName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-teal-200 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 text-xl font-bold">
                    {providerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{providerName}</p>
                  {provider.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <FontAwesomeIcon icon={faCircleCheck} />Đã xác thực
                    </span>
                  )}
                </div>
                <p className="text-sm text-teal-600 font-medium">Nhà cung cấp dịch vụ</p>
                {provider.bio && (
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{provider.bio}</p>
                )}
              </div>
              <button
                onClick={() => router.push(`/profile/${providerId}`)}
                className="flex-shrink-0 text-xs text-teal-600 hover:underline"
              >
                Xem hồ sơ
              </button>
            </div>

            {/* Info banner */}
            <div className="mx-app-md mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Lưu ý:</strong> Yêu cầu riêng sẽ chỉ được gửi tới{' '}
              <strong>{providerName}</strong>. Thợ sẽ xem xét và phản hồi kèm báo giá trong thời gian sớm nhất.
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-app-md p-app-md">
              {formError && (
                <div className="rounded-app-lg border border-red-200 bg-red-50 px-app-sm py-3 text-sm text-red-800" role="alert">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Tiêu đề yêu cầu <span className="text-red-500">*</span>
                </label>
                <div className="rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm shadow-inner-soft transition-[border-color,box-shadow] duration-app-fast ease-app-emphasized focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/18">
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                    placeholder="Ví dụ: Cần sửa điện nước tại nhà, thay vòi nước bếp..."
                    className="w-full border-0 bg-transparent py-3 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-0"
                  />
                </div>
                <p className="mt-1 text-right text-xs text-foreground-muted">{title.length}/255</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Mô tả chi tiết công việc <span className="text-red-500">*</span>
                </label>
                <div className="rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm shadow-inner-soft transition-[border-color,box-shadow] duration-app-fast ease-app-emphasized focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/18">
                  <textarea
                    id="description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    placeholder="Mô tả cụ thể công việc cần làm, tình trạng hiện tại, yêu cầu đặc biệt (nếu có)..."
                    className="w-full border-0 bg-transparent py-3 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-0 resize-none"
                  />
                </div>
                <p className="mt-0.5 text-right text-xs text-foreground-muted">{description.length}/2000</p>
              </div>

              {/* Location — province dropdown */}
              <div>
                <label htmlFor="location" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Địa điểm thực hiện
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm py-3 text-sm text-foreground transition-[border-color] hover:border-outline-variant focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/18"
                >
                  <option value="">-- Chọn tỉnh / thành phố --</option>
                  {VIETNAM_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Desired time */}
              <div>
                <label htmlFor="desiredTime" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Thời gian mong muốn
                </label>
                <div className="rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm shadow-inner-soft transition-[border-color,box-shadow] duration-app-fast ease-app-emphasized focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/18">
                  <input
                    id="desiredTime"
                    type="datetime-local"
                    value={desiredTime}
                    onChange={(e) => setDesiredTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full border-0 bg-transparent py-3 text-foreground outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/50 pt-app-md sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-app-lg border border-outline-variant/80 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-highest/40 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-app-lg bg-gradient-to-r from-[#0D9488] to-[#06B6D4] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </span>
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
