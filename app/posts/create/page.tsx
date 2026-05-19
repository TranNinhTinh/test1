'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import AppField from '@/app/components/ui/AppField'
import AppTextarea from '@/app/components/ui/AppTextarea'
import AppButton from '@/app/components/ui/AppButton'
import { PostService } from '@/lib/api/post.service'
import { AuthService } from '@/lib/api/auth.service'
import type { CreatePostDto } from '@/lib/api'

const VIETNAM_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ', 'Đà Nẵng',
  'Huế', 'Cao Bằng', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Lạng Sơn',
  'Quảng Ninh', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Tuyên Quang',
  'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên',
  'Ninh Bình', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Đắk Lắk',
  'Khánh Hòa', 'Lâm Đồng', 'Tây Ninh', 'Đồng Tháp', 'An Giang',
  'Vĩnh Long', 'Cà Mau',
] as const

function MobileFieldSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-foreground">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-brand [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <span className="text-sm font-semibold tracking-tight">{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function CreatePostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = !!editId

  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [formData, setFormData] = useState<CreatePostDto>({
    title: '',
    description: '',
    location: '',
    desiredTime: '',
    budget: undefined,
    imageUrls: [],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      alert('Vui lòng đăng nhập để tạo bài đăng!')
      router.push('/dang-nhap')
      return
    }
    setCheckingAuth(false)

    if (isEditMode && editId) {
      loadPostData(editId)
    }
  }, [editId, isEditMode])

  const loadPostData = async (postId: string) => {
    try {
      setLoadingPost(true)
      const post = await PostService.getPostById(postId)

      setFormData({
        title: post.title || '',
        description: post.description || '',
        location: post.location || '',
        desiredTime: post.desiredTime ? new Date(post.desiredTime).toISOString().slice(0, 16) : '',
        budget: undefined,
        imageUrls: [],
      })
    } catch (err: any) {
      console.error('❌ Lỗi load bài đăng:', err)
      alert('Không thể load bài đăng để chỉnh sửa!')
      router.push('/bai-dang-cua-toi')
    } finally {
      setLoadingPost(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề!')
      return
    }
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả!')
      return
    }

    setLoading(true)

    try {
      const postData: CreatePostDto = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ...(formData.location && { location: formData.location.trim() }),
        ...(formData.desiredTime && { desiredTime: new Date(formData.desiredTime).toISOString() }),
      }

      let result

      if (isEditMode && editId) {
        result = await PostService.updatePost(editId, postData)
        alert('Cập nhật bài đăng thành công!')
      } else {
        result = await PostService.createPostWithFiles(postData, selectedFiles)
        alert('Tạo bài đăng thành công!')
      }

      router.push(`/posts/${result.id || editId}`)
    } catch (err: any) {
      console.error('❌ Lỗi:', err)

      if (err.message.includes('đăng nhập') || err.message.includes('phiên')) {
        setError(err.message)
        setTimeout(() => {
          router.push('/dang-nhap')
        }, 2000)
      } else {
        setError(err.message || (isEditMode ? 'Cập nhật bài đăng thất bại!' : 'Tạo bài đăng thất bại!'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth || loadingPost) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-lowest">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-foreground-muted">
            {checkingAuth ? 'Đang kiểm tra đăng nhập...' : 'Đang tải bài đăng...'}
          </p>
        </div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const combined = [...selectedFiles, ...files].slice(0, 10)
    setSelectedFiles(combined)
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)))
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  const locIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
  const calIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest py-app-lg">
        <div className="app-container max-w-3xl">
          <div className="mb-app-md">
            <Link
              href={isEditMode ? '/bai-dang-cua-toi' : '/home'}
              className="mb-app-sm flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </Link>
          </div>

          <div className="overflow-hidden rounded-app-xl border border-outline-variant/60 bg-surface shadow-float">
            <div
              className={
                isEditMode
                  ? 'border-b border-outline-variant/50 bg-surface-highest/40 px-app-md py-app-md'
                  : 'bg-gradient-to-r from-[#0D9488] to-[#06B6D4] px-app-md py-app-md text-white'
              }
            >
              <h1 className={`text-xl font-bold sm:text-2xl ${isEditMode ? 'text-foreground' : ''}`}>
                {isEditMode ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng mới'}
              </h1>
              <p className={`mt-1 text-sm ${isEditMode ? 'text-foreground-muted' : 'text-white/90'}`}>
                {isEditMode ? 'Cập nhật thông tin bài đăng của bạn' : 'Mô tả công việc bạn cần để tìm thợ phù hợp'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-app-md p-app-md">
              {error && (
                <div
                  className="rounded-app-lg border border-red-200 bg-red-50 px-app-sm py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <AppField
                label="Tiêu đề *"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề bài đăng..."
                required
                autoComplete="off"
              />

              <AppTextarea
                label="Mô tả chi tiết *"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về dịch vụ bạn cần..."
                rows={5}
                required
              />

              <MobileFieldSection title="Địa điểm dịch vụ" icon={locIcon}>
                <select
                  name="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm py-3 text-sm text-foreground transition-[border-color] hover:border-outline-variant focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/18"
                >
                  <option value="">-- Chọn tỉnh / thành phố --</option>
                  {VIETNAM_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </MobileFieldSection>

              <MobileFieldSection title="Thời gian mong muốn" icon={calIcon}>
                <div className="rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm shadow-inner-soft transition-[border-color,box-shadow] duration-app-fast ease-app-emphasized focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/18">
                  <input
                    type="datetime-local"
                    name="desiredTime"
                    value={formData.desiredTime}
                    onChange={(e) => setFormData({ ...formData, desiredTime: e.target.value })}
                    className="w-full border-0 bg-transparent py-3 text-foreground outline-none focus:ring-0"
                  />
                </div>
              </MobileFieldSection>

              {!isEditMode && (
                <MobileFieldSection
                  title="Hình ảnh (tối đa 10)"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 10}
                    className="flex w-full items-center justify-center gap-2 rounded-app-lg border-2 border-dashed border-outline-variant/60 bg-surface px-app-sm py-4 text-sm text-foreground-muted transition hover:border-brand/50 hover:bg-brand-tint/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {selectedFiles.length === 0 ? 'Chọn ảnh' : `Thêm ảnh (${selectedFiles.length}/10)`}
                  </button>

                  {imagePreviews.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {imagePreviews.map((src, i) => (
                        <div key={src} className="group relative aspect-square overflow-hidden rounded-app-lg border border-outline-variant/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                            aria-label="Xóa ảnh"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </MobileFieldSection>
              )}

              <div className="flex flex-col gap-3 border-t border-outline-variant/50 pt-app-md sm:flex-row">
                <AppButton type="button" variant="outlined" className="flex-1" onClick={() => router.back()}>
                  Hủy
                </AppButton>
                <AppButton
                  type="submit"
                  variant="filled"
                  className="flex-1"
                  disabled={loading || !formData.title.trim() || !formData.description.trim()}
                >
                  {loading ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : isEditMode ? 'Cập nhật bài đăng' : 'Tạo bài đăng'}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
