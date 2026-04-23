import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * POST /api/quotes/{id}/reject
 * [Customer] Từ chối quote
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    console.log('📝 [Reject Quote] QuoteId:', id)
    console.log('📝 [Reject Quote] Reason:', body.reason || 'No reason provided')
    console.log('📝 [Reject Quote] Calling backend API...')

    const response = await fetch(`${API_BASE_URL}/quotes/${id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    console.log('📝 [Reject Quote] Backend response:', data)
    console.log('📝 [Reject Quote] Status:', response.status)

    if (!response.ok) {
      console.error('❌ [Reject Quote] Error:', data)
      return NextResponse.json(
        { error: data.error || 'Failed to reject quote' },
        { status: response.status }
      )
    }

    console.log('✅ [Reject Quote] Success! Provider will receive notification')
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error rejecting quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
