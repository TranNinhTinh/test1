import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

export const dynamic = 'force-dynamic'

const API_BASE_URL = getPublicApiBaseV1()

/** GET /api/certifications/my — list own certifications (provider only) */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/certifications/my`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Không thể tải danh sách chứng chỉ' },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[GET /api/certifications/my]', error?.message)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
