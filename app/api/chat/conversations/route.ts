import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// GET /api/chat/conversations - Lấy danh sách conversations
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.error('❌ [Get Conversations] No auth header')
      return NextResponse.json(
        { message: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    console.log('🔔 [Get Conversations] Calling backend API:', `${API_BASE_URL}/chat/conversations`)
    console.log('🔔 [Get Conversations] Auth header present:', !!authHeader)

    // Call backend API
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    console.log('🔔 [Get Conversations] Response status:', response.status)
    console.log('🔔 [Get Conversations] Response ok:', response.ok)
    console.log('🔔 [Get Conversations] Response headers:', Object.fromEntries(response.headers.entries()))

    // Check content type
    const contentType = response.headers.get('content-type')
    console.log('🔔 [Get Conversations] Content-Type:', contentType)

    // Parse response
    let data
    try {
      const text = await response.text()
      console.log('🔔 [Get Conversations] Raw response text:', text.substring(0, 500))
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('❌ [Get Conversations] JSON parse error:', parseError)
      throw new Error('Failed to parse response as JSON')
    }
    
    console.log('🔔 [Get Conversations] Backend response type:', typeof data)
    console.log('🔔 [Get Conversations] Backend response is array:', Array.isArray(data))
    console.log('🔔 [Get Conversations] Backend response keys:', data ? Object.keys(data) : 'null')
    console.log('🔔 [Get Conversations] Backend response:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('❌ [Get Conversations] Backend error:', data)
      console.error('❌ [Get Conversations] Error details:', {
        status: response.status,
        statusText: response.statusText,
        message: data.message,
        error: data.error,
        details: data.details
      })
      
      return NextResponse.json(
        { 
          message: data.message || data.error || 'Failed to get conversations',
          error: data.error,
          details: data.details 
        },
        { status: response.status }
      )
    }

    // Xử lý các format response khác nhau từ backend
    let finalData = data
    
    // Nếu backend trả về { data: [...] }
    if (data && !Array.isArray(data) && data.data && Array.isArray(data.data)) {
      console.log('🔄 [Get Conversations] Converting { data: [...] } to array')
      finalData = data.data
    }
    // Nếu backend trả về { conversations: [...] }
    else if (data && !Array.isArray(data) && data.conversations && Array.isArray(data.conversations)) {
      console.log('🔄 [Get Conversations] Converting { conversations: [...] } to array')
      finalData = data.conversations
    }
    // Nếu là array hoặc empty array
    else if (Array.isArray(data)) {
      console.log('✅ [Get Conversations] Backend trả về array trực tiếp')
      finalData = data
    }
    // Nếu là object nhưng không có key data/conversations
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.warn('⚠️ [Get Conversations] Backend trả về object không xác định, trả về empty array')
      finalData = []
    }

    console.log('✅ [Get Conversations] Success! Count:', Array.isArray(finalData) ? finalData.length : 0)
    console.log('✅ [Get Conversations] Final data:', finalData)

    return NextResponse.json(finalData, { status: 200 })
  } catch (error: any) {
    console.error('❌ [Get Conversations] Exception:', error)
    console.error('❌ [Get Conversations] Error message:', error.message)
    console.error('❌ [Get Conversations] Error stack:', error.stack)
    
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
