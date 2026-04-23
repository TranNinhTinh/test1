import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * DELETE /api/notifications/read
 * Xóa tất cả thông báo đã đọc
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [API Route] DELETE /api/notifications/read called')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('🗑️ [API Route] No auth header')
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    console.log('🗑️ [API Route] Calling backend:', `${API_BASE_URL}/notifications/read`)
    
    const response = await fetch(`${API_BASE_URL}/notifications/read`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    console.log('🗑️ [API Route] Backend response status:', response.status)

    if (!response.ok) {
      const data = await response.json()
      console.error('🗑️ [API Route] Backend error:', data)
      return NextResponse.json(
        { error: data.error || 'Failed to delete read notifications' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('🗑️ [API Route] Backend success:', result)
    
    return NextResponse.json(
      { message: 'All read notifications deleted' },
      { status: 200 }
    )

  } catch (error) {
    console.error('🗑️ [API Route] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
