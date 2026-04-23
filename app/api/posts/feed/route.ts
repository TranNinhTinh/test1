import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN ? process.env.NEXT_PUBLIC_API_DOMAIN.replace('/api/v1', '') : 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '10'
    const cursor = searchParams.get('cursor')

    let url = `${API_BASE_URL}/api/v1/posts/feed?limit=${limit}`
    if (cursor) {
      url += `&cursor=${cursor}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy Get Feed Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}
