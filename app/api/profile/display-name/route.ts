import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * PUT /api/v1/profile/display-name
 * Thay đổi tên hiển thị của user
 * 
 * Headers:
 * - Authorization: Bearer {access_token}
 * 
 * Body:
 * {
 *   "displayName": "string"    // Tên hiển thị mới (3-50 ký tự)
 * }
 * 
 * Response 200:
 * {
 *   "id": "string",
 *   "displayName": "string",
 *   "updatedAt": "string"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Token không tồn tại' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate display name
    if (!body.displayName) {
      return NextResponse.json(
        { error: 'Tên hiển thị không được để trống' },
        { status: 400 }
      )
    }

    if (body.displayName.length < 3 || body.displayName.length > 50) {
      return NextResponse.json(
        { error: 'Tên hiển thị phải từ 3-50 ký tự' },
        { status: 400 }
      )
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9\sÀ-ỹ]+$/.test(body.displayName)) {
      return NextResponse.json(
        { error: 'Tên hiển thị chỉ chứa chữ cái, số và khoảng trắng' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/profile/display-name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Không thể thay đổi tên hiển thị' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Update Display Name Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi thay đổi tên hiển thị' },
      { status: 500 }
    )
  }
}
