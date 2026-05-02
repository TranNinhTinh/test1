import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const response = await fetch(`${API_BASE_URL}/search/provinces${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      }
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Search provinces proxy error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
