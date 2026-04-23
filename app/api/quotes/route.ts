import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * POST /api/quotes
 * [Provider] Tạo quote mới cho post
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Creating quote - Body:', body)
    console.log('API_BASE_URL:', API_BASE_URL)

    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    })

    console.log('Backend response status:', response.status)
    const data = await response.json()
    console.log('Backend response data:', data)

    if (!response.ok) {
      console.error('Backend error:', data)
      return NextResponse.json(
        { error: data.error || data.message || 'Failed to create quote' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/quotes/my-quotes
 * [Provider] Lấy danh sách quote của tôi
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
    const status = searchParams.get('status') || ''
    const limit = searchParams.get('limit') || '20'

    const queryString = new URLSearchParams({
      limit,
      ...(status && { status })
    }).toString()

    const response = await fetch(`${API_BASE_URL}/quotes/my-quotes?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch quotes' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
