import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

export const dynamic = 'force-dynamic'

const API_BASE_URL = getPublicApiBaseV1()

/** DELETE /api/certifications/:id */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const { id } = params
    const response = await fetch(`${API_BASE_URL}/certifications/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Không thể xóa chứng chỉ' },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[DELETE /api/certifications/:id]', error?.message)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
