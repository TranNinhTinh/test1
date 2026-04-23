import { NextRequest, NextResponse } from 'next/server'

// Use proper domain from environment, remove /api/v1 if present
const getDomainUrl = () => {
  let baseDomain = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL
  if (!baseDomain) {
    console.warn('❌ API_DOMAIN not configured, defaulting to localhost')
    baseDomain = 'http://localhost:3000/api/v1'
  }
  // Remove /api/v1 suffix if present to add it back consistently
  baseDomain = baseDomain.replace('/api/v1', '')
  return baseDomain.endsWith('/api/v1') ? baseDomain : baseDomain + '/api/v1'
}

const API_BASE_URL = getDomainUrl()

/**
 * GET /api/v1/profile/me
 * Lấy thông tin profile của user hiện tại
 * 
 * Headers:
 * - Authorization: Bearer {access_token}
 * 
 * Response 200:
 * {
 *   "id": "string",
 *   "email": "string",
 *   "phone": "string",
 *   "fullName": "string",
 *   "displayName": "string",
 *   "avatar": "string",
 *   "bio": "string",
 *   "accountType": "CUSTOMER" | "WORKER",
 *   "contactInfo": {
 *     "phone": "string",
 *     "email": "string",
 *     "address": "string"
 *   },
 *   "createdAt": "string",
 *   "updatedAt": "string"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Token không tồn tại' },
        { status: 401 }
      )
    }

    // Thử profile/me trước, nếu không được thì thử users/profile/me
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
    })

    if (!response.ok) {
      let errorMessage = 'Đơng lỗi'
      try {
        const data = await response.json()
        errorMessage = data.message || data.error || 'Đơng lỗi'
      } catch (e) {
        console.error('❌ Failed to parse error response:', e)
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // Map role từ backend sang accountType cho frontend
    const data = await response.json()
    let userData = data.data || data
    if (userData.role) {
      // Convert: customer → CUSTOMER, provider → WORKER
      userData.accountType = userData.role === 'customer' ? 'CUSTOMER' : 'WORKER'
      console.log(`✅ Mapped role '${userData.role}' to accountType '${userData.accountType}'`)
    }

    // Map avatar field - backend might use different field names
    if (!userData.avatar && userData.avatarUrl) {
      userData.avatar = userData.avatarUrl
      console.log('✅ Mapped avatarUrl to avatar')
    }

    console.log('🔵 Final userData before returning:', {
      id: userData.id,
      fullName: userData.fullName,
      displayName: userData.displayName,
      avatar: userData.avatar,
      avatarUrl: userData.avatarUrl,
      role: userData.role,
      accountType: userData.accountType
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Get Profile Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/profile/me
 * Cập nhật thông tin profile của user
 * 
 * Headers:
 * - Authorization: Bearer {access_token}
 * 
 * Body:
 * {
 *   "fullName": "string",      // optional
 *   "displayName": "string",   // optional
 *   "bio": "string",           // optional
 *   "phone": "string"          // optional
 * }
 * 
 * Response 200:
 * {
 *   "id": "string",
 *   "fullName": "string",
 *   "displayName": "string",
 *   "bio": "string",
 *   "updatedAt": "string"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Token không tồn tại' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'PATCH',
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
        { error: data.message || 'Không thể cập nhật profile' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Update Profile Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật profile' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/profile/me
 * Xóa tài khoản người dùng
 * 
 * Headers:
 * - Authorization: Bearer {access_token}
 * 
 * Body (optional):
 * {
 *   "password": "string",      // Xác nhận mật khẩu để xóa tài khoản
 *   "reason": "string"         // Lý do xóa tài khoản (optional)
 * }
 * 
 * Response 200:
 * {
 *   "message": "Tài khoản đã được xóa thành công"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Token không tồn tại' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))

    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'DELETE',
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
        { error: data.message || 'Không thể xóa tài khoản' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Delete Account Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa tài khoản' },
      { status: 500 }
    )
  }
}
