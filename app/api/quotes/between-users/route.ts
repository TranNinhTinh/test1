import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const providerId = searchParams.get('providerId')

    if (!customerId || !providerId) {
      return NextResponse.json(
        { error: 'customerId and providerId are required' },
        { status: 400 },
      )
    }

    const response = await fetch(
      `${API_BASE_URL}/quotes/between-users?customerId=${encodeURIComponent(customerId)}&providerId=${encodeURIComponent(providerId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch quotes between users' },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching quotes between users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
