// src/lib/api/api-mode.ts
// Quản lý chế độ API: Real hoặc Mock

export const API_MODE = {
  REAL: 'real',
  MOCK: 'mock'
}

// Kiểm tra backend có online không
let cachedApiMode: string | null = null

export async function detectApiMode(): Promise<string> {
  // Nếu đã cache, return cache
  if (cachedApiMode) {
    return cachedApiMode
  }

  try {
    // Test backend bằng cách gọi endpoint đơn giản
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identifier: 'test@test.com', 
        password: 'test' 
      }),
      signal: AbortSignal.timeout(2000) // Timeout 2 giây
    })

    // Nếu backend respond (dù fail login), backend online
    if (response.status === 401 || response.status === 400 || response.status === 200) {
      console.log('✅ [API] Backend Online - Using REAL API')
      cachedApiMode = API_MODE.REAL
      return API_MODE.REAL
    }
  } catch (error: any) {
    console.warn('⚠️ [API] Backend Offline or Timeout:', error.message)
  }

  // Nếu backend fail, dùng mock
  console.log('🎭 [API] Backend Offline - Using MOCK API')
  cachedApiMode = API_MODE.MOCK
  return API_MODE.MOCK
}

export async function getApiMode(): Promise<string> {
  if (cachedApiMode) return cachedApiMode
  return await detectApiMode()
}

export function resetApiMode() {
  cachedApiMode = null
}

// Helper để fallback vào mock khi API error
export function shouldUseMock(error: any): boolean {
  // Nếu network error hoặc timeout
  if (error?.message?.includes('Failed to fetch')) return true
  if (error?.message?.includes('timeout')) return true
  if (error?.message?.includes('Network')) return true
  
  // Nếu backend 5xx error
  if (error?.status >= 500) return true
  
  return false
}
