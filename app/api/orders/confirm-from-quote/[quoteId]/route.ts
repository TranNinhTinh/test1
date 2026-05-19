import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

/**
 * POST /api/orders/confirm-from-quote/{quoteId}
 * [Provider] Xác nhận làm → Tạo order
 */
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    console.log('📦 [API Route] POST /api/orders/confirm-from-quote called')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('📦 [API Route] No auth header')
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const { quoteId } = params
    let body: Record<string, unknown> = {}
    try {
      const text = await request.text()
      if (text.trim()) body = JSON.parse(text) as Record<string, unknown>
    } catch {
      body = {}
    }

    const response = await fetch(`${API_BASE_URL}/orders/confirm-from-quote/${quoteId}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    })

    console.log('📦 [API Route] Backend response status:', response.status)
    
    const data = await response.json()
    console.log('📦 [API Route] Backend response data:', data)

    if (!response.ok) {
      console.error('📦 [API Route] Backend error:', data)
      return NextResponse.json(
        { error: data.error || 'Failed to confirm order' },
        { status: response.status }
      )
    }

    console.log('✅ [API Route] Order created successfully')
    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('📦 [API Route] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
