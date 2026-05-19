import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiOrigin } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiOrigin()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '20'
    const cursor = searchParams.get('cursor')

    let url = `${API_BASE_URL}/api/v1/posts/user/${userId}?limit=${limit}`
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`

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
    console.error('❌ Proxy Get User Posts Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 },
    )
  }
}
