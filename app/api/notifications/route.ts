import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của user
 */
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
    const limit = searchParams.get('limit') || '20'
    const cursor = searchParams.get('cursor') || ''

    const queryString = new URLSearchParams({
      limit,
      ...(cursor && { cursor })
    }).toString()

    console.log('📬 Fetching notifications from:', `${API_BASE_URL}/notifications?${queryString}`)
    
    const response = await fetch(`${API_BASE_URL}/notifications?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()
    
    console.log('📬 Backend response status:', response.status)
    console.log('📬 Backend response data:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('❌ Backend error:', data)
      return NextResponse.json(
        { error: data.error || 'Failed to fetch notifications' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
