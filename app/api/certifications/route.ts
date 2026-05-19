import { NextRequest, NextResponse } from 'next/server'
import { getPublicApiBaseV1 } from '@/lib/server/public-api-base'

export const dynamic = 'force-dynamic'

const API_BASE_URL = getPublicApiBaseV1()

/** POST /api/certifications — upload a certification PDF (provider only) */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: 'File PDF là bắt buộc' }, { status: 400 })
    }

    const backendForm = new FormData()
    backendForm.append('file', file, (file as File).name ?? 'certificate.pdf')

    const title = formData.get('title')
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ message: 'Tiêu đề chứng chỉ là bắt buộc' }, { status: 400 })
    }
    backendForm.append('title', title.trim())

    const issuingOrg = formData.get('issuingOrganization')
    if (issuingOrg && typeof issuingOrg === 'string') {
      backendForm.append('issuingOrganization', issuingOrg.trim())
    }
    const issueDate = formData.get('issueDate')
    if (issueDate && typeof issueDate === 'string') {
      backendForm.append('issueDate', issueDate)
    }
    const expiryDate = formData.get('expiryDate')
    if (expiryDate && typeof expiryDate === 'string') {
      backendForm.append('expiryDate', expiryDate)
    }

    const response = await fetch(`${API_BASE_URL}/certifications`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'ngrok-skip-browser-warning': 'true',
      },
      body: backendForm,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Không thể tải lên chứng chỉ' },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/certifications]', error?.message)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
