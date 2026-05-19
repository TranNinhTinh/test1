'use client'

import Link from 'next/link'
import { SearchPostItem } from '@/lib/api/search.service'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot } from '@fortawesome/free-solid-svg-icons'

interface PostSearchResultProps {
  post: SearchPostItem
  onClick?: () => void
}

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đang mở' },
  CLOSED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã đóng' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý' },
  COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Hoàn thành' },
}

function formatBudget(budget?: number) {
  if (!budget) return 'Liên hệ'
  if (budget >= 1_000_000) return `${Math.floor(budget / 1_000_000)}M đ`
  if (budget >= 1_000) return `${Math.floor(budget / 1_000)}K đ`
  return `${budget} đ`
}

/**
 * Safely renders the backend highlight string which may contain <em>…</em> tags.
 * Only <em> wrapping is processed — all inner text is rendered as plain text nodes.
 */
function HighlightedTitle({ highlight, title }: { highlight?: string; title: string }) {
  if (!highlight) return <span>{title}</span>

  const parts = highlight.split(/(<em>.*?<\/em>)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<em>') && part.endsWith('</em>')) {
          return (
            <em key={i} className="not-italic font-semibold text-brand">
              {part.slice(4, -5)}
            </em>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export default function PostSearchResult({ post, onClick }: PostSearchResultProps) {
  const badge = STATUS_MAP[post.status] ?? STATUS_MAP.PENDING
  const authorName = post.customer?.displayName || 'Ẩn danh'

  return (
    <Link
      href={`/posts/${post.id}`}
      onClick={onClick}
      className="block rounded-app-lg border border-outline-variant/60 bg-surface p-app-md transition-all hover:border-brand/30 hover:shadow-app-card-hover"
    >
      <div className="flex items-start justify-between gap-app-sm">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            <HighlightedTitle highlight={post.highlight} title={post.title} />
          </h3>

          {post.province && (
            <p className="mt-0.5 text-sm text-foreground-muted">
              <FontAwesomeIcon icon={faLocationDot} className="mr-1" />{post.province}
            </p>
          )}

          {/* Customer who posted */}
          <p className="mt-0.5 text-xs text-foreground-muted">
            Đăng bởi: <span className="font-medium">{authorName}</span>
          </p>

          {post.desiredTime && (
            <p className="mt-0.5 text-xs text-foreground-muted">
              Thời gian: {new Date(post.desiredTime).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-app-xs">
          <span className={`rounded-app-sm px-app-xs py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          <span className="text-sm font-bold text-brand">{formatBudget(post.budget)}</span>
          {post.createdAt && (
            <span className="text-xs text-foreground-muted">
              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
