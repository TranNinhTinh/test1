import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN ? process.env.NEXT_PUBLIC_API_DOMAIN.replace('/api/v1', '') : 'http://localhost:3000'

// Get post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy Get Post Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}

// Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')

    console.log('🔵 Proxy Update Post Request:', params.id, body)

    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log('🔵 Proxy Update Post Response:', response.status, data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy Update Post Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}

// Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')

    console.log('🔵 Proxy Delete Post Request:', params.id)

    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    })

    const data = await response.json()
    console.log('🔵 Proxy Delete Post Response:', response.status, data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Proxy Delete Post Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}
