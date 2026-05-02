import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_PUBLIC_API_V1 } from '@/lib/server/public-api-base'

// Keep the backend base URL consistent across profile proxy routes.
const getDomainUrl = () => {
  let baseDomain = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL
  if (!baseDomain) {
    console.warn('❌ API_DOMAIN not configured, defaulting to DEFAULT_PUBLIC_API_V1')
    baseDomain = DEFAULT_PUBLIC_API_V1
  }

  baseDomain = baseDomain.replace(/\/api\/v1\/?$/, '')
  return `${baseDomain}/api/v1`
}

const API_BASE_URL = getDomainUrl()

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}))
  }

  const text = await response.text().catch(() => '')
  return text ? { message: text } : {}
}

/**
 * PATCH /api/v1/profile/avatar
 * Cập nhật avatar của user
 * 
 * Headers:
 * - Authorization: Bearer {access_token}
 * - Content-Type: multipart/form-data
 * 
 * Body (FormData):
 * - avatar: File (image file - jpg, jpeg, png, gif)
 * 
 * Hoặc Body (JSON):
 * {
 *   "avatarUrl": "string"    // URL của avatar
 * }
 * 
 * Response 200:
 * {
 *   "id": "string",
 *   "avatar": "string",       // URL của avatar mới
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

    const contentType = request.headers.get('content-type') || ''

    let response: Response

    // Handle multipart/form-data (file upload)
    // Note: contentType might be null/undefined so we default to empty string
    if (contentType.includes('multipart/form-data') || (contentType === '' && request.method === 'PATCH')) {
      const formData = await request.formData()
      const avatarFile = formData.get('avatar') || formData.get('file')

      if (!avatarFile || !(avatarFile instanceof File)) {
        return NextResponse.json(
          { error: 'File avatar không hợp lệ' },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json(
          { error: 'Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)' },
          { status: 400 }
        )
      }

      // Backend interceptor currently limits avatar upload to 2MB.
      const maxSize = 2 * 1024 * 1024
      if (avatarFile.size > maxSize) {
        return NextResponse.json(
          { error: 'Kích thước file tối đa 2MB' },
          { status: 400 }
        )
      }

      // Backend expects multipart field name: `file`
      const backendFormData = new FormData()
      backendFormData.append('file', avatarFile)

      console.log('📤 Proxy: Forwarding avatar upload to backend', {
        url: `${API_BASE_URL}/profile/avatar`,
        fileName: avatarFile.name,
        fileSize: avatarFile.size,
        fileType: avatarFile.type,
      })

      response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader,
          'ngrok-skip-browser-warning': 'true',
        },
        body: backendFormData,
      })

      console.log('📥 Proxy: Backend response status:', response.status)
    } 
    // Handle JSON (avatar URL)
    else {
      const body = await request.json()

      if (!body.avatarUrl) {
        return NextResponse.json(
          { error: 'URL avatar không được để trống' },
          { status: 400 }
        )
      }

      // Validate URL format
      try {
        new URL(body.avatarUrl)
      } catch {
        return NextResponse.json(
          { error: 'URL avatar không hợp lệ' },
          { status: 400 }
        )
      }

      response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
      })
    }

    const data = await parseResponseBody(response)

    if (!response.ok) {
      console.error('❌ Proxy: Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: data,
      })
      
      // Return detailed error message from backend
      const errorMessage = data.error || data.message || 'Không thể cập nhật avatar'
      const errorDetails = data.details || data.statusCode || ''
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          status: response.status 
        },
        { status: response.status }
      )
    }

    console.log('✅ Proxy: Avatar upload successful')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('❌ Update Avatar Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json(
      { error: `Có lỗi xảy ra khi cập nhật avatar: ${errorMessage}` },
      { status: 500 }
    )
  }
}
