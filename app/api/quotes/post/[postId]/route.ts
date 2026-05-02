import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

/**
 * GET /api/quotes/post/{postId}
 * [Customer] Lấy tất cả quote của một post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const { postId } = params

    const response = await fetch(`${API_BASE_URL}/quotes/post/${postId}`, {
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
    console.error('Error fetching quotes for post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
