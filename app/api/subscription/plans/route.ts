import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE = getPublicApiBaseV1()
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString()
    const url = `${API_BASE}/subscription/plans${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    console.error('[subscription/plans] proxy error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
