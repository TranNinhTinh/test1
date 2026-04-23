import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// GET /api/chat/conversations/[id]/messages - Lấy tin nhắn của conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    console.log('🔔 [Get Messages] Calling backend API...', id)

    const response = await fetch(`${API_BASE_URL}/chat/conversations/${id}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()
    
    console.log('🔔 [Get Messages] Response:', data)

    if (!response.ok) {
      console.error('❌ [Get Messages] Error:', data)
      return NextResponse.json(
        { message: data.message || 'Failed to get messages' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations/[id]/messages - Gửi tin nhắn
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      )
    }

    console.log('🔔 [Send Message] Calling backend API...', id)

    const response = await fetch(`${API_BASE_URL}/chat/conversations/${id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ 
        content: content.trim(),
        type: 'text'  // Backend yêu cầu field type: text, image, file, system
      })
    })

    const data = await response.json()

    console.log('🔔 [Send Message] Response:', data)

    if (!response.ok) {
      console.error('❌ [Send Message] Error:', data)
      return NextResponse.json(
        { message: data.message || 'Failed to send message' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
