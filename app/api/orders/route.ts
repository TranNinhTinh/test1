import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

/** Nest `OrderStatus` dùng giá trị snake lowercase; client hay gửi PENDING, IN_PROGRESS, … */
const BACKEND_ORDER_STATUSES = new Set(['pending', 'in_progress', 'completed', 'cancelled', 'disputed'])

function normalizeOrderStatusQuery(raw: string): string {
  if (!raw?.trim()) return ''
  const t = raw.trim()
  const lower = t.toLowerCase()
  if (BACKEND_ORDER_STATUSES.has(lower)) return lower
  const upper = t.toUpperCase().replace(/-/g, '_')
  const map: Record<string, string> = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
  }
  return map[upper] || ''
}

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng của tôi
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status') || ''
    const statusNorm = normalizeOrderStatusQuery(rawStatus)
    if (rawStatus.trim() && !statusNorm) {
      return NextResponse.json(
        {
          error:
            `Invalid status "${rawStatus}". Expected one of: pending, in_progress, completed, cancelled, disputed (or PENDING, IN_PROGRESS, …).`,
        },
        { status: 400 }
      )
    }

    const queryString = new URLSearchParams({
      ...(statusNorm ? { status: statusNorm } : {}),
    }).toString()

    const url = queryString ? `${API_BASE_URL}/orders?${queryString}` : `${API_BASE_URL}/orders`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { error: (data as any).message || (data as any).error || 'Failed to fetch orders' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
