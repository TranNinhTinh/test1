import { getPublicApiOrigin } from '@/lib/server/public-api-base'

/**
 * Origin nơi chạy Socket.IO (cùng host với Nest nếu REST dùng NEXT_PUBLIC_API_DOMAIN).
 * Override bằng NEXT_PUBLIC_SOCKET_URL khi socket tách host.
 */
export function getSocketIoOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }
  return getPublicApiOrigin().replace(/\/$/, '')
}
