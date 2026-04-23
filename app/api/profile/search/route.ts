import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/**
 * GET /api/v1/profile/search
 * Tìm kiếm profiles theo các tiêu chí
 * 
 * Headers:
 * - Authorization: Bearer {access_token} (optional)
 * 
 * Query Parameters:
 * - q: string               // Từ khóa tìm kiếm (tên, kỹ năng, mô tả)
 * - accountType: string     // Loại tài khoản: CUSTOMER | WORKER
 * - city: string            // Thành phố
 * - district: string        // Quận/Huyện
 * - skills: string[]        // Kỹ năng (comma-separated)
 * - minRating: number       // Đánh giá tối thiểu (1-5)
 * - isVerified: boolean     // Chỉ tài khoản đã xác thực
 * - page: number            // Trang hiện tại (default: 1)
 * - limit: number           // Số lượng kết quả/trang (default: 20, max: 100)
 * - sortBy: string          // Sắp xếp theo: rating | reviews | joinedAt | name
 * - order: string           // Thứ tự: asc | desc (default: desc)
 * 
 * Response 200:
 * {
 *   "data": [
 *     {
 *       "id": "string",
 *       "displayName": "string",
 *       "avatar": "string",
 *       "bio": "string",
 *       "accountType": "CUSTOMER" | "WORKER",
 *       "rating": number,
 *       "totalReviews": number,
 *       "completedJobs": number,
 *       "isVerified": boolean,
 *       "skills": string[],
 *       "location": {
 *         "city": "string",
 *         "district": "string"
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "page": number,
 *     "limit": number,
 *     "total": number,
 *     "totalPages": number,
 *     "hasNext": boolean,
 *     "hasPrev": boolean
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract and validate query parameters
    const params: Record<string, string> = {}
    
    const q = searchParams.get('q')
    if (q) params.q = q
    
    const accountType = searchParams.get('accountType')
    if (accountType && ['CUSTOMER', 'WORKER'].includes(accountType)) {
      params.accountType = accountType
    }
    
    const city = searchParams.get('city')
    if (city) params.city = city
    
    const district = searchParams.get('district')
    if (district) params.district = district
    
    const skills = searchParams.get('skills')
    if (skills) params.skills = skills
    
    const minRating = searchParams.get('minRating')
    if (minRating) {
      const rating = parseFloat(minRating)
      if (rating >= 1 && rating <= 5) {
        params.minRating = minRating
      }
    }
    
    const isVerified = searchParams.get('isVerified')
    if (isVerified) params.isVerified = isVerified
    
    const page = searchParams.get('page') || '1'
    const pageNum = parseInt(page)
    params.page = pageNum > 0 ? page : '1'
    
    const limit = searchParams.get('limit') || '20'
    const limitNum = parseInt(limit)
    params.limit = limitNum > 0 && limitNum <= 100 ? limit : '20'
    
    const sortBy = searchParams.get('sortBy')
    if (sortBy && ['rating', 'reviews', 'joinedAt', 'name'].includes(sortBy)) {
      params.sortBy = sortBy
    }
    
    const order = searchParams.get('order')
    if (order && ['asc', 'desc'].includes(order)) {
      params.order = order
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString()
    
    const authHeader = request.headers.get('authorization')
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    }

    // Add authorization if available
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(
      `${API_BASE_URL}/profile/search?${queryString}`,
      {
        method: 'GET',
        headers,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Không thể tìm kiếm profiles' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Search Profiles Error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tìm kiếm profiles' },
      { status: 500 }
    )
  }
}
