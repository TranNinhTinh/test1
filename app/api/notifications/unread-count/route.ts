import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/notifications/unread-count
 * Đếm số thông báo chưa đọc
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get unread count' },
        { status: response.status, headers: NO_STORE_HEADERS }
      )
    }

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS })

  } catch (error) {
    console.error('Error getting unread count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
