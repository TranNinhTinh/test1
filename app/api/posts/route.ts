import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN ? process.env.NEXT_PUBLIC_API_DOMAIN.replace('/api/v1', '') : 'http://localhost:3000'

// Create new post
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const contentType = request.headers.get('content-type') || ''

    console.log('🔑 Auth Header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING')

    if (!authHeader) {
      console.error('❌ No authorization header provided!')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    let response: Response

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      console.log('🔵 Proxy Create Post Request: multipart/form-data')

      response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': authHeader,
        },
        body: formData,
      })
    } else {
      const body = await request.json()
      console.log('🔵 Proxy Create Post Request:', JSON.stringify(body, null, 2))

      response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Authorization': authHeader,
        },
        body: JSON.stringify(body),
      })
    }

    const data = await response.json()
    console.log('🔵 Proxy Create Post Response:', response.status, JSON.stringify(data, null, 2))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy Create Post Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}
