import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiOrigin } from '@/lib/server/public-api-base'
import { normalizeBudgetInput } from '@/lib/server/normalize-budget'

const API_BASE_URL = getPublicApiOrigin()

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
      const incoming = await request.formData()
      const outgoing = new FormData()
      let budgetAppended = false

      for (const [key, value] of incoming.entries()) {
        if (key === 'budget') {
          if (budgetAppended) continue
          if (typeof value === 'string') {
            const b = normalizeBudgetInput(value)
            if (b !== undefined) {
              outgoing.append('budget', String(b))
              budgetAppended = true
            }
          }
          continue
        }
        outgoing.append(key, value)
      }

      console.log('🔵 Proxy Create Post Request: multipart/form-data (budget normalized)')

      response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': authHeader,
        },
        body: outgoing,
      })
    } else {
      const body = (await request.json()) as Record<string, unknown>
      if ('budget' in body) {
        const b = normalizeBudgetInput(body.budget)
        if (b === undefined) delete body.budget
        else body.budget = b
      }
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
