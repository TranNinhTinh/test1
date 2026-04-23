import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/chat/unread-count - Đếm tổng tin nhắn chưa đọc
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    console.log('🔔 [Unread Count] Calling backend API...')

    const response = await fetch(`${API_BASE_URL}/chat/unread-count`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()
    
    console.log('🔔 [Unread Count] Response:', data)

    if (!response.ok) {
      console.error('❌ [Unread Count] Error:', data)
      return NextResponse.json(
        { message: data.message || 'Failed to get unread count' },
        { status: response.status, headers: NO_STORE_HEADERS }
      )
    }

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('Error getting unread count:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
