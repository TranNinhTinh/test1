import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * POST /api/orders/confirm-from-quote/{quoteId}
 * [Provider] Xác nhận làm → Tạo order
 */
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
    console.log('📦 [API Route] QuoteId:', quoteId)
    
    const body = await request.json()
    console.log('📦 [API Route] Request body:', body)

    console.log('📦 [API Route] Calling backend:', `${API_BASE_URL}/orders/confirm-from-quote/${quoteId}`)
    
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
