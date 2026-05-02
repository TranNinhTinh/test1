'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import Header from '@/app/components/Header'
import AppField from '@/app/components/ui/AppField'
import AppTextarea from '@/app/components/ui/AppTextarea'
import AppButton from '@/app/components/ui/AppButton'
import { PostService } from '@/lib/api/post.service'
import { AuthService } from '@/lib/api/auth.service'
import type { CreatePostDto } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media-url'

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imageUrlDraft, setImageUrlDraft] = useState('')

  const [formData, setFormData] = useState<CreatePostDto>({
    title: '',
    description: '',
    location: '',
    desiredTime: '',
    budget: undefined,
    imageUrls: [],
  })

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
        budget: post.budget || undefined,
        imageUrls: post.imageUrls || [],
      })
    } catch (err: any) {
      console.error('❌ Lỗi load bài đăng:', err)
      alert('Không thể load bài đăng để chỉnh sửa!')
      router.push('/bai-dang-cua-toi')
    } finally {
      setLoadingPost(false)
    }
  }

  const addImageUrl = () => {
    const u = imageUrlDraft.trim()
    if (!u) return
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), u],
    }))
    setImageUrlDraft('')
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
      const rawBudget = formData.budget
      const budgetNum =
        rawBudget === undefined || rawBudget === null
          ? undefined
          : typeof rawBudget === 'number'
            ? rawBudget
            : Number(rawBudget)
      const budget =
        budgetNum !== undefined && Number.isFinite(budgetNum) && budgetNum > 0 ? budgetNum : undefined

      const postData: CreatePostDto = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ...(formData.location && { location: formData.location.trim() }),
        ...(formData.desiredTime && { desiredTime: new Date(formData.desiredTime).toISOString() }),
        ...(budget !== undefined && { budget }),
        ...(!isEditMode &&
          selectedFiles.length === 0 &&
          formData.imageUrls &&
          formData.imageUrls.length > 0 && { imageUrls: formData.imageUrls }),
        ...(isEditMode && formData.imageUrls && formData.imageUrls.length > 0 && { imageUrls: formData.imageUrls }),
      }

      let result

      if (isEditMode && editId) {
        result = await PostService.updatePost(editId, postData)
        alert('Cập nhật bài đăng thành công!')
      } else {
        result =
          selectedFiles.length > 0
            ? await PostService.createPostWithFiles(postData, selectedFiles)
            : await PostService.createPost(postData)
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
  const moneyIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  const imgIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest py-app-lg">
        <Header />
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

              <MobileFieldSection title="Hình ảnh (không bắt buộc)" icon={imgIcon}>
                {!isEditMode && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('post-files')?.click()}
                      className="flex w-full flex-col items-center justify-center rounded-app-lg border-2 border-dashed border-brand/45 bg-brand-tint/25 px-app-md py-app-md text-sm font-medium text-brand transition-colors hover:bg-brand-tint/40"
                    >
                      <span>+ Chọn ảnh từ máy tính</span>
                      <span className="mt-1 text-xs font-normal text-foreground-muted">PNG, JPG, GIF, WebP — tối đa 10 ảnh</span>
                    </button>
                    <input
                      id="post-files"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setSelectedFiles(files)
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <AppField
                      name="imageUrl"
                      value={imageUrlDraft}
                      onChange={(e) => setImageUrlDraft(e.target.value)}
                      placeholder="Nhập URL hình ảnh..."
                      aria-label="URL hình ảnh"
                    />
                  </div>
                  <AppButton type="button" variant="filled" className="w-full shrink-0 sm:w-auto sm:min-h-[52px]" onClick={addImageUrl}>
                    Thêm URL
                  </AppButton>
                </div>

                {!isEditMode && selectedFiles.length > 0 && (
                  <div className="rounded-app-lg border border-brand/25 bg-brand-tint/30 p-app-sm">
                    <p className="mb-2 text-sm font-medium text-brand-dark">Đã chọn {selectedFiles.length} file</p>
                    <ul className="space-y-1 text-sm text-foreground">
                      {selectedFiles.map((file, index) => (
                        <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                            className="shrink-0 text-sm font-medium text-app-error hover:underline"
                          >
                            Xóa
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.imageUrls && formData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {formData.imageUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="group relative">
                        <img
                          src={resolveMediaUrl(url)}
                          alt=""
                          className="h-32 w-full rounded-app-md border border-outline-variant/60 object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23d1d5db" viewBox="0 0 24 24"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/%3E%3C/svg%3E'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = formData.imageUrls || []
                            setFormData({
                              ...formData,
                              imageUrls: current.filter((_, i) => i !== index),
                            })
                          }}
                          className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 shadow-md transition group-hover:opacity-100"
                          aria-label="Xóa ảnh"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </MobileFieldSection>

              <MobileFieldSection title="Địa điểm dịch vụ" icon={locIcon}>
                <AppField
                  label={undefined}
                  name="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Nhập địa điểm..."
                  autoComplete="street-address"
                />
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

              <MobileFieldSection title="Ngân sách (VNĐ)" icon={moneyIcon}>
                <AppField
                  label={undefined}
                  name="budget"
                  type="number"
                  min={0}
                  value={formData.budget ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Nhập ngân sách..."
                />
              </MobileFieldSection>

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
