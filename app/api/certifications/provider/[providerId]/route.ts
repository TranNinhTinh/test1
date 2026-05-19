import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

export const dynamic = 'force-dynamic'

const API_BASE_URL = getPublicApiBaseV1()

/** GET /api/certifications/provider/:providerId — public verified certs */
export async function GET(
  _request: NextRequest,
  { params }: { params: { providerId: string } },
) {
  try {
    const { providerId } = params
    const response = await fetch(`${API_BASE_URL}/certifications/provider/${providerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Không thể tải chứng chỉ' },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[GET /api/certifications/provider/:id]', error?.message)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
