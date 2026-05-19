import { NextResponse } from 'next/server'

/**
 * Backend Nest hiện không có route đổi mật khẩu cho user đã đăng nhập
 * (chỉ có forgot/reset qua email hoặc OTP). Giữ route BFF để UI không gọi URL lạc.
 */
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      message:
        'Đổi mật khẩu trong tài khoản chưa được backend hỗ trợ. Vui lòng dùng Quên mật khẩu (email/OTP) hoặc liên hệ quản trị.',
    },
    { status: 501 },
  )
}
