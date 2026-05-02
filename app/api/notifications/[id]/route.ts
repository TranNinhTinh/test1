import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

/**
 * DELETE /api/notifications/{id}
 * Xóa một thông báo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const { id } = params

    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        { error: data.error || 'Failed to delete notification' },
        { status: response.status }
      )
    }

    return NextResponse.json(
      { message: 'Notification deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
