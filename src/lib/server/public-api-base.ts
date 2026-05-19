/** Backend REST base (có /api/v1). Dùng khi chưa set NEXT_PUBLIC_API_DOMAIN / NEXT_PUBLIC_API_URL. */
export const DEFAULT_PUBLIC_API_V1 =
  'https://postmaxillary-variably-justa.ngrok-free.dev/api/v1' as const

let warnedMissingPublicApi = false

export function getPublicApiBaseV1(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL
  if (!fromEnv) {
    if (!warnedMissingPublicApi) {
      warnedMissingPublicApi = true
      console.warn(
        '[public-api-base] NEXT_PUBLIC_API_DOMAIN / NEXT_PUBLIC_API_URL chưa set — dùng DEFAULT_PUBLIC_API_V1. ' +
          'Thêm vào frontend/.env.local (vd: http://localhost:3000/api/v1) để trỏ đúng backend.',
      )
    }
    return DEFAULT_PUBLIC_API_V1
  }
  return fromEnv
}

/** Origin (không có /api/v1), cho kiểu `${origin}/api/v1/...` */
export function getPublicApiOrigin(): string {
  return getPublicApiBaseV1().replace(/\/api\/v1\/?$/, '')
}
