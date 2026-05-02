import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiBaseV1()

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/saved-posts/${params.postId}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Save post proxy error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/saved-posts/${params.postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Unsave post proxy error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/saved-posts/${params.postId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Saved status proxy error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
