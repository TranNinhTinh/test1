import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * GET /api/orders/stats
 * Thống kê đơn hàng
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [API Route] GET /api/orders/stats called')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('📊 [API Route] No auth header')
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    console.log('📊 [API Route] Calling backend:', `${API_BASE_URL}/orders/stats`)

    const response = await fetch(`${API_BASE_URL}/orders/stats`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    console.log('📊 [API Route] Backend response status:', response.status)

    const data = await response.json()
    console.log('📊 [API Route] Backend response data:', data)

    if (!response.ok) {
      console.error('📊 [API Route] Backend error:', data)
      return NextResponse.json(
        { error: data.error || 'Failed to fetch order stats' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error fetching order stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
