'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import Header from '@/app/components/Header'
import AppField from '@/app/components/ui/AppField'
import AppTextarea from '@/app/components/ui/AppTextarea'
import AppButton from '@/app/components/ui/AppButton'
import { AuthService } from '@/lib/api/auth.service'
import { PostService } from '@/lib/api/post.service'
import { chatService } from '@/lib/api/chat.service'
import { quoteService } from '@/lib/api/quote.service'
import type { PostResponseDto } from '@/lib/api'

export default function PostQuotePage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<PostResponseDto | null>(null)
  const [loadingPost, setLoadingPost] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id?: string; accountType?: string; role?: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [quoteForm, setQuoteForm] = useState({
    price: '',
    description: '',
    estimatedDuration: '',
    terms: '',
    imageUrls: [] as string[],
    imageUrlInput: '',
  })

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.replace(`/dang-nhap?returnUrl=${encodeURIComponent(`/posts/${postId}/quote`)}`)
      return
    }

    const raw = localStorage.getItem('user_data')
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw))
      } catch {
        setCurrentUser(null)
      }
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await PostService.getPostById(postId)
        if (!cancelled) setPost(data)
      } catch {
        if (!cancelled) setPost(null)
      } finally {
        if (!cancelled) setLoadingPost(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [postId, router])

  const userRole = currentUser?.accountType || currentUser?.role
  const isCustomer = userRole === 'CUSTOMER' || userRole === 'customer'
  const isWorker = userRole === 'WORKER' || userRole === 'provider'

  useEffect(() => {
    if (!currentUser || loadingPost) return
    if (isCustomer) {
      router.replace(`/posts/${postId}`)
    }
  }, [currentUser, isCustomer, loadingPost, postId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!quoteForm.price.trim()) {
      setFormError('Vui lòng nhập giá báo giá')
      return
    }
    if (!post?.id) {
      setFormError('Không thể tải bài đăng')
      return
    }

    setIsSubmitting(true)
    try {
      await quoteService.createQuote({
        postId: post.id,
        price: parseFloat(quoteForm.price),
        description: quoteForm.description,
        estimatedDuration: quoteForm.estimatedDuration ? parseInt(quoteForm.estimatedDuration, 10) : undefined,
        terms: quoteForm.terms.trim() || undefined,
        imageUrls: quoteForm.imageUrls.length > 0 ? quoteForm.imageUrls : undefined,
      })

      try {
        await chatService.createDirectConversation({
          providerId: post.customerId,
        })
      } catch {
        // Giữ hành vi giống trang chi tiết: báo giá vẫn thành công nếu chat lỗi
      }

      router.replace(`/posts/${postId}?quoteSent=1`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi báo giá. Vui lòng thử lại.'
      setFormError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingPost || !currentUser) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center bg-surface-lowest">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (isCustomer) {
    return (
      <AppShell>
        <Header />
        <div className="app-container py-app-lg text-center text-foreground-muted">Đang chuyển hướng…</div>
      </AppShell>
    )
  }

  if (!post) {
    return (
      <AppShell>
        <Header />
        <div className="app-container max-w-lg py-app-lg text-center">
          <p className="text-foreground-muted">Không tìm thấy bài đăng.</p>
          <AppButton type="button" variant="outlined" className="mt-4" onClick={() => router.push('/home')}>
            Về trang chủ
          </AppButton>
        </div>
      </AppShell>
    )
  }

  if (!isWorker) {
    return (
      <AppShell>
        <Header />
        <div className="app-container max-w-lg py-app-lg text-center">
          <p className="text-foreground-muted">Chỉ tài khoản thợ mới có thể gửi báo giá.</p>
          <Link href={`/posts/${postId}`} className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            Quay lại bài đăng
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest pb-app-lg">
        <Header />

        <div className="app-container max-w-2xl py-app-md">
          <Link
            href={`/posts/${postId}`}
            className="mb-app-md inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại bài đăng
          </Link>

          <div className="overflow-hidden rounded-app-xl border border-outline-variant/60 bg-surface shadow-float">
            <div className="flex items-center gap-3 bg-brand px-app-md py-app-md text-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md bg-white/15">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2zM15 7h2M7 7h2"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold sm:text-xl">Chào giá cho bài đăng</h1>
                <p className="truncate text-sm text-white/90">{post.title}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-app-md p-app-md">
              {formError && (
                <div className="rounded-app-lg border border-red-200 bg-red-50 px-app-sm py-3 text-sm text-red-800" role="alert">
                  {formError}
                </div>
              )}

              <AppField
                label="Giá *"
                name="quotePrice"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={quoteForm.price}
                onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                placeholder="Nhập giá (VNĐ)"
                required
              />

              <AppTextarea
                label="Mô tả chi tiết *"
                name="quoteDescription"
                value={quoteForm.description}
                onChange={(e) => setQuoteForm({ ...quoteForm, description: e.target.value })}
                placeholder="Mô tả chi tiết công việc bạn có thể làm..."
                rows={5}
                required
              />

              <AppTextarea
                label="Điều khoản và điều kiện"
                name="quoteTerms"
                value={quoteForm.terms}
                onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
                placeholder="Cam kết, bảo hành, điều kiện thanh toán..."
                rows={3}
              />

              <AppField
                label="Thời gian ước tính (phút)"
                name="quoteDuration"
                type="number"
                min={0}
                value={quoteForm.estimatedDuration}
                onChange={(e) => setQuoteForm({ ...quoteForm, estimatedDuration: e.target.value })}
                placeholder="Ví dụ: 120"
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Hình ảnh</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <AppField
                      name="quoteImageUrl"
                      value={quoteForm.imageUrlInput}
                      onChange={(e) => setQuoteForm({ ...quoteForm, imageUrlInput: e.target.value })}
                      placeholder="Nhập URL hình ảnh"
                      aria-label="URL hình ảnh báo giá"
                    />
                  </div>
                  <AppButton
                    type="button"
                    variant="filled"
                    className="w-full shrink-0 sm:w-auto sm:min-h-[52px]"
                    onClick={() => {
                      const u = quoteForm.imageUrlInput.trim()
                      if (!u) return
                      setQuoteForm({
                        ...quoteForm,
                        imageUrls: [...quoteForm.imageUrls, u],
                        imageUrlInput: '',
                      })
                    }}
                  >
                    Thêm
                  </AppButton>
                </div>
                {quoteForm.imageUrls.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-app-lg border border-brand/20 bg-brand-tint/25 p-app-sm text-sm text-foreground">
                    {quoteForm.imageUrls.map((url, i) => (
                      <li key={`${url}-${i}`} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">{url}</span>
                        <button
                          type="button"
                          className="shrink-0 text-app-error hover:underline"
                          onClick={() =>
                            setQuoteForm({
                              ...quoteForm,
                              imageUrls: quoteForm.imageUrls.filter((_, idx) => idx !== i),
                            })
                          }
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant/50 pt-app-md sm:flex-row">
                <AppButton type="button" variant="outlined" className="flex-1" onClick={() => router.push(`/posts/${postId}`)}>
                  Hủy
                </AppButton>
                <AppButton type="submit" variant="filled" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang gửi...
                    </span>
                  ) : (
                    'Gửi báo giá'
                  )}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
