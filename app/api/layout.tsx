/**
 * BFF routes under `/api/*` use `headers()`, `cookies()`, or `searchParams` and must
 * not be statically analyzed during `next build`.
 */
export const dynamic = 'force-dynamic'

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children
}
