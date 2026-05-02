/** Backend REST base (có /api/v1). Dùng khi chưa set NEXT_PUBLIC_API_DOMAIN / NEXT_PUBLIC_API_URL. */
export const DEFAULT_PUBLIC_API_V1 =
  'https://postmaxillary-variably-justa.ngrok-free.dev/api/v1' as const

export function getPublicApiBaseV1(): string {
  return (
    process.env.NEXT_PUBLIC_API_DOMAIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_PUBLIC_API_V1
  )
}

/** Origin (không có /api/v1), cho kiểu `${origin}/api/v1/...` */
export function getPublicApiOrigin(): string {
  return getPublicApiBaseV1().replace(/\/api\/v1\/?$/, '')
}
