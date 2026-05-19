import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const { id } = params

    const response = await fetch(`${API_BASE_URL}/quotes/${id}/accept-for-chat`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Không thể chấp nhận báo giá' },
        { status: response.status },
      )
    }

    const conversationId =
      data.conversationId ||
      data.data?.conversationId ||
      data.conversation?.id ||
      data.data?.conversation?.id

    return NextResponse.json({ ...data, conversationId }, { status: 200 })
  } catch (error) {
    console.error('Error accepting quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
