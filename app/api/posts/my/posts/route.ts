import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiOrigin } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiOrigin()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '10'
    const cursor = searchParams.get('cursor')
    const authHeader = request.headers.get('authorization')

    let url = `${API_BASE_URL}/api/v1/posts/my/posts?limit=${limit}`
    if (cursor) {
      url += `&cursor=${cursor}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy Get My Posts Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}
