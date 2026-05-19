import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

/**
 * GET /api/reviews/provider/:providerId
 * Danh sách đánh giá công khai của một thợ (cần đăng nhập — theo backend).
 */
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } },
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const { providerId } = params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'
    const qs = new URLSearchParams({ page, limit }).toString()

    const response = await fetch(
      `${API_BASE_URL}/reviews/provider/${encodeURIComponent(providerId)}?${qs}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      },
    )

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Failed to load reviews' },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error loading provider reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
