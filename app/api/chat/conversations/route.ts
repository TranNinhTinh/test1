import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

// GET /api/chat/conversations - Lấy danh sách conversations
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.error('[Get Conversations] No auth header')
      return NextResponse.json(
        { message: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    let data
    try {
      const text = await response.text()
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('[Get Conversations] JSON parse error:', parseError)
      throw new Error('Failed to parse response as JSON')
    }

    if (!response.ok) {
      console.error('[Get Conversations] Backend error:', response.status, data)
      
      return NextResponse.json(
        { 
          message: data.message || data.error || 'Failed to get conversations',
          error: data.error,
          details: data.details 
        },
        { status: response.status }
      )
    }

    // Xử lý các format response khác nhau từ backend
    let finalData = data
    
    // Nếu backend trả về { data: [...] }
    if (data && !Array.isArray(data) && data.data && Array.isArray(data.data)) {
      finalData = data.data
    }
    // Nếu backend trả về { conversations: [...] }
    else if (data && !Array.isArray(data) && data.conversations && Array.isArray(data.conversations)) {
      finalData = data.conversations
    }
    // Nếu là array hoặc empty array
    else if (Array.isArray(data)) {
      finalData = data
    }
    // Nếu là object nhưng không có key data/conversations
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.warn('[Get Conversations] Unknown object shape, returning empty array')
      finalData = []
    }

    return NextResponse.json(finalData, { status: 200 })
  } catch (error: any) {
    console.error('[Get Conversations] Exception:', error?.message || error)
    
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
