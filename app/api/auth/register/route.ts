import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN
  ? process.env.NEXT_PUBLIC_API_DOMAIN.replace('/api/v1', '')
  : 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, any>

    console.log('🔵 Proxy Register Request - Original:', JSON.stringify(body, null, 2))

    // Lấy số điện thoại
    let originalPhone: string | undefined = body.phone || body.phoneNumber

    console.log('📱 Original phone from body:', originalPhone)

    // Chuẩn bị payload cơ bản (không có phone)
    const basePayload = {
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      role: body.role,
    }

    // Tạo danh sách các format để thử
    let phoneFormats: string[] = []

    if (originalPhone) {
      // Loại bỏ tất cả ký tự không phải số
      const digitsOnly = originalPhone.replace(/\D/g, '')
      console.log('🔢 Digits only:', digitsOnly)

      if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
        // Số Việt Nam bắt đầu bằng 0: 0987654321
        const without0 = digitsOnly.substring(1) // 987654321
        phoneFormats = [
          `+84${without0}`,     // +84987654321 - E.164 standard (ƯU TIÊN)
          `84${without0}`,      // 84987654321
          digitsOnly,           // 0987654321
          without0,             // 987654321
        ]
      } else if (digitsOnly.length === 11 && digitsOnly.startsWith('84')) {
        // Số đã có 84: 84987654321
        phoneFormats = [
          `+${digitsOnly}`,     // +84987654321
          digitsOnly,           // 84987654321
          `0${digitsOnly.substring(2)}`, // 0987654321
        ]
      } else if (digitsOnly.length === 12 && digitsOnly.startsWith('84')) {
        // Số có +84: +84987654321
        phoneFormats = [
          `+${digitsOnly}`,     // +84987654321
          digitsOnly,           // 84987654321
        ]
      } else if (digitsOnly.length === 9) {
        // Số đã bỏ 0: 987654321
        phoneFormats = [
          `+84${digitsOnly}`,   // +84987654321
          `84${digitsOnly}`,    // 84987654321
          `0${digitsOnly}`,     // 0987654321
          digitsOnly,           // 987654321
        ]
      } else {
        // Format khác, giữ nguyên
        phoneFormats = [originalPhone]
      }
    }

    console.log('🎯 Phone formats to try:', phoneFormats)

    let lastError: { data: any; status: number } | null = null
    let attemptNumber = 0

    // Thử đăng ký với từng format
    for (const phoneFormat of phoneFormats) {
      attemptNumber++
      const payload = { ...basePayload, phone: phoneFormat }

      try {
        console.log(`\n🔄 Attempt ${attemptNumber}/${phoneFormats.length}`)
        console.log('📤 Payload:', JSON.stringify({ ...payload, password: '***' }, null, 2))

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        console.log('📥 Response status:', response.status)
        console.log('📥 Response data:', JSON.stringify(data, null, 2))

        // Nếu thành công (status 200-299), return ngay
        if (response.ok) {
          console.log(`✅ SUCCESS! Phone format accepted: ${phoneFormat}`)
          return NextResponse.json(data, { status: response.status })
        }

        // Lưu lại lỗi cuối cùng
        lastError = { data, status: response.status }
        console.log(`❌ FAILED with phone: ${phoneFormat}`)
        console.log(`❌ Error message: ${data.message || JSON.stringify(data)}`)

        // Nếu lỗi không phải do phone format, không cần thử tiếp
        if (data.message && !data.message.toLowerCase().includes('phone')) {
          console.log('⚠️ Error not related to phone format, stopping attempts')
          break
        }

      } catch (err) {
        console.error(`❌ Exception with phone ${phoneFormat}:`, err)
        lastError = { data: { success: false, message: String(err) }, status: 500 }
      }
    }

    // Nếu không có phone formats để thử hoặc tất cả đều thất bại
    if (phoneFormats.length === 0) {
      console.log('⚠️ No phone provided, trying without phone')
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(basePayload),
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      } catch (err) {
        lastError = { data: { success: false, message: String(err) }, status: 500 }
      }
    }

    // Trả về lỗi cuối cùng
    console.log('\n❌ ALL ATTEMPTS FAILED')
    console.log('📋 Final error:', lastError)

    return NextResponse.json(
      lastError?.data || { success: false, message: 'Registration failed with all phone formats' },
      { status: lastError?.status || 400 }
    )
  } catch (error) {
    console.error('❌ Proxy Register Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}
