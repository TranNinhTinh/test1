import { NextRequest, NextResponse } from 'next/server'
import { fetchBackend, isBackendFetchAbort } from '@/lib/server/fetch-backend'
import { getPublicApiOrigin } from '@/lib/server/public-api-base'

const API_BASE_URL = getPublicApiOrigin()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetchBackend(`${API_BASE_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Reset password proxy error:', error)
    const message = isBackendFetchAbort(error)
      ? 'Hết thời gian chờ backend. Kiểm tra NEXT_PUBLIC_API_DOMAIN và máy chủ API.'
      : 'Internal server error'
    return NextResponse.json({ success: false, message }, { status: isBackendFetchAbort(error) ? 504 : 500 })
  }
}
