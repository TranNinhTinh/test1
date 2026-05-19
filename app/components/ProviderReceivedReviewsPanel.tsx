'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { reviewService, type PublicReviewRow } from '@/lib/api/review.service'

type Props = {
  providerId: string
  /** Bỏ padding ngoài khi nhúng trong tab hồ sơ */
  compact?: boolean
  highlightReviewId?: string | null
}

export default function ProviderReceivedReviewsPanel({ providerId, compact, highlightReviewId }: Props) {
  const [rows, setRows] = useState<PublicReviewRow[]>([])
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const reviewRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const [total, setTotal] = useState(0)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const id = providerId.trim()
    if (!id) {
      setLoading(false)
      setError('Thiếu mã thợ.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await reviewService.getProviderReviews(id, { page: 1, limit: 50 })
      setRows(Array.isArray(res.data) ? res.data : [])
      setTotal(typeof res.total === 'number' ? res.total : 0)
      setAverageRating(
        typeof res.averageRating === 'number' && !Number.isNaN(res.averageRating)
          ? res.averageRating
          : null,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được đánh giá')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (highlightReviewId && highlightReviewId.trim()) {
      setActiveReviewId(highlightReviewId.trim())
    }
  }, [highlightReviewId])

  useEffect(() => {
    if (!activeReviewId || rows.length === 0) {
      return
    }

    const reviewElement = reviewRefs.current[activeReviewId]
    if (reviewElement) {
      reviewElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const timeoutId = window.setTimeout(() => {
      setActiveReviewId(null)
    }, 8000)

    return () => window.clearTimeout(timeoutId)
  }, [activeReviewId, rows])

  const outer = compact ? '' : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'

  return (
    <div className={outer}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Đánh giá từ khách</h3>
          {averageRating != null && (
            <p className="text-sm text-slate-600">
              Điểm trung bình:{' '}
              <span className="font-semibold text-amber-600">{averageRating.toFixed(1)}</span> / 5
              {total > 0 ? ` · ${total} đánh giá` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      {loading && rows.length === 0 && (
        <div className="py-10 text-center text-slate-500">Đang tải đánh giá...</div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="py-10 text-center text-slate-600">Bạn chưa có đánh giá nào từ khách.</div>
      )}

      <ul className="space-y-3">
        {rows.map((r) => {
          const name =
            r.reviewer?.displayName ||
            r.reviewer?.fullName ||
            'Khách hàng'
          const stars = Math.min(5, Math.max(0, Math.round(Number(r.rating) || 0)))
          return (
            <li
              key={r.id}
              ref={(el) => {
                if (el) reviewRefs.current[r.id] = el
              }}
              className={`rounded-lg border px-4 py-3 text-left transition-shadow ${
                activeReviewId === r.id
                  ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300 ring-offset-2 ring-offset-white shadow-lg'
                  : 'border-slate-100 bg-slate-50/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-800">{name}</span>
                <span className="text-amber-500" aria-label={`${stars} sao`}>
                  {'★'.repeat(stars)}
                  <span className="text-slate-300">{'★'.repeat(5 - stars)}</span>
                </span>
              </div>
              {r.comment ? (
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{r.comment}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">Không có nhận xét</p>
              )}
              {r.providerReply ? (
                <div className="mt-2 rounded-md border border-teal-100 bg-teal-50/80 px-3 py-2 text-sm text-teal-900">
                  <span className="font-semibold">Phản hồi của bạn: </span>
                  {r.providerReply}
                </div>
              ) : null}
              {r.createdAt && (
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleString('vi-VN')}
                </p>
              )}
            </li>
          )
        })}
      </ul>

    </div>
  )
}
