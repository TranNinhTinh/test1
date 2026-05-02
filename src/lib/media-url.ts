import { getPublicApiOrigin } from '@/lib/server/public-api-base'

/**
 * Chuẩn hóa URL ảnh/avatar từ API:
 * - Path tương đối (/uploads/...) → nối với origin backend (NEXT_PUBLIC_* hoặc mặc định ngrok).
 * - URL tuyệt đối trỏ localhost/127.0.0.1 → đổi host sang origin public khi API không chạy loopback.
 */
export function resolveMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return ''
  const clean = rawUrl.trim()
  if (!clean) return ''
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return clean

  const origin = getPublicApiOrigin().replace(/\/$/, '')

  if (/^https?:\/\//i.test(clean)) {
    try {
      const u = new URL(clean)
      const isLoopback = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      const publicHost = new URL(origin).hostname
      const publicIsLoopback = publicHost === 'localhost' || publicHost === '127.0.0.1'
      if (isLoopback && !publicIsLoopback) {
        return `${new URL(origin).origin}${u.pathname}${u.search}${u.hash}`
      }
    } catch {
      /* giữ nguyên */
    }
    return clean
  }

  if (clean.startsWith('/')) return `${origin}${clean}`
  return `${origin}/${clean}`
}

export function resolveMediaUrls(urls?: string[] | null): string[] {
  if (!urls?.length) return []
  return urls.map((u) => resolveMediaUrl(u)).filter(Boolean)
}
