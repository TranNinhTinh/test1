import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * PUT /api/v1/profile/contact
 * Cập nhật thông tin liên hệ của user
 * 
 * Headers:
 * - Authorization: Bearer {access_token}
 * 
 * Body:
 * {
 *   "phone": "string",         // Số điện thoại
 *   "email": "string",         // Email liên hệ
 *   "address": "string",       // Địa chỉ
 *   "city": "string",          // Thành phố
 *   "district": "string",      // Quận/Huyện
 *   "ward": "string"           // Phường/Xã
 * }
 * 
 * Response 200:
 * {
 *   "id": "string",
 *   "contactInfo": {
 *     "phone": "string",
 *     "email": "string",
 *     "address": "string",
 *     "city": "string",
 *     "district": "string",
 *     "ward": "string"
 *   },
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

    // Validate phone number format
    if (body.phone && !/^[0-9]{10,11}$/.test(body.phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      )
    }

    // Validate email format
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/profile/contact`, {
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
        { error: data.message || 'Không thể cập nhật thông tin liên hệ' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Update Contact Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật thông tin liên hệ' },
      { status: 500 }
    )
  }
}
