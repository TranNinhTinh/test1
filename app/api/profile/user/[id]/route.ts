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
 * GET /api/v1/profile/user/{id}
 * Lấy thông tin profile công khai của user khác
 * 
 * Headers:
 * - Authorization: Bearer {access_token} (optional - có thể xem mà không cần đăng nhập)
 * 
 * Params:
 * - id: string (User ID)
 * 
 * Response 200:
 * {
 *   "id": "string",
 *   "displayName": "string",
 *   "avatar": "string",
 *   "bio": "string",
 *   "accountType": "CUSTOMER" | "WORKER",
 *   "rating": number,           // Đánh giá trung bình (nếu là WORKER)
 *   "totalReviews": number,     // Tổng số đánh giá
 *   "completedJobs": number,    // Số công việc đã hoàn thành (nếu là WORKER)
 *   "joinedAt": "string",       // Ngày tham gia
 *   "isVerified": boolean,      // Tài khoản đã xác thực
 *   "skills": string[],         // Kỹ năng (nếu là WORKER)
 *   "location": {
 *     "city": "string",
 *     "district": "string"
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'User ID không hợp lệ' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization')
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    }

    // Add authorization if available
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${API_BASE_URL}/profile/user/${id}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      let errorMessage = 'Không thể lấy thông tin user'
      try {
        const data = await response.json()
        errorMessage = data.message || data.error || errorMessage
      } catch (e) {
        console.error('Failed to parse error response:', e)
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Get User Profile Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin user' },
      { status: 500 }
    )
  }
}
