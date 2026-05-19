'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService } from '@/lib/api/profile-new.service'
import {
  customRequestService,
  type CustomRequest,
  type CustomRequestStatus,
} from '@/lib/api/custom-request.service'
import { resolveMediaUrl } from '@/lib/media-url'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faMoneyBillWave, faCalendarDays, faClipboardList, faCircleCheck } from '@fortawesome/free-solid-svg-icons'

type ViewMode = 'sent' | 'received'

const STATUS_LABEL: Record<CustomRequestStatus, string> = {
  pending: 'Chờ phản hồi',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
}

const STATUS_COLOR: Record<CustomRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function AvatarPlaceholder({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <span className="text-blue-600 font-semibold text-sm">
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

function RequestCard({
  req,
  viewMode,
  onDelete,
}: {
  req: CustomRequest
  viewMode: ViewMode
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const counterpart = viewMode === 'sent' ? req.provider : req.customer
  const counterpartName =
    counterpart?.displayName || counterpart?.fullName || (viewMode === 'sent' ? 'Thợ' : 'Khách')
  const avatarUrl = resolveMediaUrl(counterpart?.avatarUrl)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Bạn có chắc muốn xóa yêu cầu này?')) return
    try {
      setDeleting(true)
      await customRequestService.delete(req.id)
      onDelete(req.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa yêu cầu')
    } finally {
      setDeleting(false)
    }
  }

  const needsProviderAction = viewMode === 'received' && req.status === 'pending'

  return (
    <div
      onClick={() => router.push(`/yeu-cau-rieng/${req.id}`)}
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        needsProviderAction ? 'border-amber-300' : 'border-gray-200'
      }`}
    >
      {needsProviderAction && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 rounded-t-xl flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-700">Cần phản hồi</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={counterpartName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <AvatarPlaceholder name={counterpartName} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">
                  {viewMode === 'sent' ? 'Gửi tới' : 'Từ khách'}: <strong>{counterpartName}</strong>
                </p>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                  {req.title}
                </h3>
              </div>
              <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[req.status]}`}>
                {STATUS_LABEL[req.status]}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{req.description}</p>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {req.location && <span><FontAwesomeIcon icon={faLocationDot} className="mr-1" />{req.location}</span>}
              {req.budget && <span><FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />{Number(req.budget).toLocaleString('vi-VN')} VNĐ</span>}
              {req.desiredTime && (
                <span>
                  <FontAwesomeIcon icon={faCalendarDays} className="mr-1" />{new Date(req.desiredTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              )}
              <span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>

            {/* Contextual hints */}
            {req.status === 'rejected' && req.rejectionReason && (
              <div className="mt-2 text-xs bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5 text-red-800">
                Lý do từ chối: {req.rejectionReason}
              </div>
            )}
            {req.status === 'accepted' && viewMode === 'sent' && (
              <div className="mt-2 text-xs bg-green-50 border border-green-100 rounded-md px-2.5 py-1.5 text-green-800 font-medium">
                Thợ đã gửi báo giá — bấm để xem và phản hồi.
              </div>
            )}
            {req.status === 'accepted' && viewMode === 'received' && (
              <div className="mt-2 text-xs bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1.5 text-blue-800">
                Bạn đã gửi báo giá — đang chờ khách phản hồi.
              </div>
            )}
            {req.status === 'rejected' && viewMode === 'sent' && !req.rejectionReason && (
              <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1.5 text-gray-600">
                Bạn có thể tìm và gửi yêu cầu tới thợ khác.
              </div>
            )}
          </div>
        </div>

        {viewMode === 'sent' && req.status === 'pending' && (
          <div className="mt-3 pt-3 border-t flex justify-end">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 font-medium"
            >
              {deleting ? 'Đang xóa...' : 'Xóa yêu cầu'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function YeuCauRiengPage() {
  const router = useRouter()
  const [myRole, setMyRole] = useState<'customer' | 'provider' | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('sent')
  const [statusFilter, setStatusFilter] = useState<CustomRequestStatus | ''>('')
  const [requests, setRequests] = useState<CustomRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [sentSuccess, setSentSuccess] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSentSuccess(new URLSearchParams(window.location.search).get('sent') === '1')
    }
  }, [])

  useEffect(() => {
    if (!AuthService.getToken()) {
      router.replace('/dang-nhap')
      return
    }
    loadRole()
  }, [])

  const loadRole = async () => {
    try {
      const profile = await ProfileService.getMyProfile()
      const role = profile.role ?? 'customer'
      setMyRole(role)
      setViewMode(role === 'provider' ? 'received' : 'sent')
    } catch {
      setMyRole('customer')
      setViewMode('sent')
    }
  }

  const fetchRequests = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) setLoading(true)
      else setLoadingMore(true)
      setError('')

      try {
        const params = {
          status: statusFilter || undefined,
          page: pageNum,
          limit: 10,
        }
        const result =
          viewMode === 'sent'
            ? await customRequestService.getMySentRequests(params)
            : await customRequestService.getMyReceivedRequests(params)

        const items: CustomRequest[] = Array.isArray(result.data)
          ? result.data
          : Array.isArray((result as any).items)
            ? (result as any).items
            : []
        setRequests((prev) => (replace ? items : [...prev, ...items]))
        setTotal(result.total ?? items.length)
        setHasMore(result.hasMore ?? false)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [viewMode, statusFilter],
  )

  useEffect(() => {
    if (myRole === null) return
    fetchRequests(1, true)
  }, [fetchRequests, myRole])

  const handleDeleteRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }

  const statusFilters: { value: CustomRequestStatus | ''; label: string }[] = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ phản hồi' },
    { value: 'accepted', label: 'Đã chấp nhận' },
    { value: 'rejected', label: 'Đã từ chối' },
  ]

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col bg-surface-lowest">

        <div className="flex-shrink-0 border-b border-outline-variant/60 bg-surface shadow-app-bar">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h1 className="text-xl font-bold text-foreground">Yêu cầu riêng</h1>
              {myRole === 'customer' && (
                <Link
                  href="/posts/search"
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  + Tìm thợ &amp; gửi yêu cầu
                </Link>
              )}
            </div>

            {sentSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
                <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Yêu cầu của bạn đã được gửi thành công! Thợ sẽ phản hồi sớm.
              </div>
            )}

            {/* Role label (no tab switching — each role sees only their view) */}
            <div className="mb-4 border-b border-gray-200">
              <span className="inline-block px-3 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600 -mb-px">
                {myRole === 'provider' ? 'Đã nhận (thợ)' : 'Đã gửi (khách)'}
              </span>
            </div>

            {/* Status filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setStatusFilter(f.value as CustomRequestStatus | '')
                    setPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === f.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
                <button
                  onClick={() => fetchRequests(1, true)}
                  className="ml-2 underline font-medium"
                >
                  Thử lại
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4 text-gray-300 text-5xl"><FontAwesomeIcon icon={faClipboardList} /></div>
                <h3 className="font-semibold text-gray-800 mb-2">Chưa có yêu cầu nào</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {viewMode === 'sent'
                    ? 'Bạn chưa gửi yêu cầu riêng nào. Hãy tìm thợ và gửi yêu cầu!'
                    : 'Bạn chưa nhận được yêu cầu riêng nào từ khách hàng.'}
                </p>
                {viewMode === 'sent' && (
                  <Link
                    href="/posts/search"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 text-sm"
                  >
                    Tìm thợ ngay
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Hiển thị {requests.length}/{total} yêu cầu
                </p>
                <div className="space-y-3">
                  {requests.map((req) => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      viewMode={viewMode}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => fetchRequests(page + 1, false)}
                      disabled={loadingMore}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {loadingMore ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
