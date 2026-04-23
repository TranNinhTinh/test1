import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// GET /api/chat/search - Tìm kiếm tin nhắn
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    // Keep backward compatibility with old clients using `query`.
    const keyword = searchParams.get('keyword') || searchParams.get('query')
    const limit = searchParams.get('limit') || '20'

    if (!keyword) {
      return NextResponse.json(
        { message: 'Keyword parameter is required' },
        { status: 400 }
      )
    }

    console.log('🔔 [Search Messages] Calling backend API...', keyword)

    const response = await fetch(`${API_BASE_URL}/chat/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()

    console.log('🔔 [Search Messages] Response:', data)

    if (!response.ok) {
      console.error('❌ [Search Messages] Error:', data)
      return NextResponse.json(
        { message: data.message || 'Failed to search messages' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error searching messages:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
