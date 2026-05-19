import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

/**
 * POST /api/orders/accept-quote-direct/{quoteId}
 * [Customer] Chấp nhận giá ngay (quote PENDING) → tạo đơn PENDING chờ thợ xác nhận
 */
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const { quoteId } = params
    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/orders/accept-quote-direct/${quoteId}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({}),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to accept quote' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[accept-quote-direct]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
