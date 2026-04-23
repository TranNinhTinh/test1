// src/lib/api/fetch-real-api.ts
// Fetcher để gọi Real API từ backend (với retry & fallback)

import { 
  REAL_API_CONFIG, 
  shouldRetry, 
  shouldFallbackToMock, 
  isValidationError,
  logRequest,
  logResponse,
  logError
} from './real-api-config'
import { mockServices } from './mock.service'

let currentApiMode: 'REAL' | 'MOCK' = 'REAL'  // Tracking current mode
let isFallbackMode = false

export function getCurrentApiMode(): 'REAL' | 'MOCK' {
  return currentApiMode
}

export function isMockMode(): boolean {
  return isFallbackMode
}

/**
 * Fetch data từ Real API backend
 * - Auto retry nếu network error
 * - Auto fallback sang mock nếu backend fail
 * - Return real data nếu thành công
 */
export async function fetchRealApi<T>(
  endpoint: string,
  options?: RequestInit & { mockFallback?: () => Promise<T> }
): Promise<T> {
  const url = `${REAL_API_CONFIG.BASE_URL}${endpoint}`
  const method = options?.method || 'GET'
  
  logRequest(method, url, options?.body)
  
  // Nếu đã fallback sang mock, continue dùng mock
  if (isFallbackMode && options?.mockFallback) {
    console.log(`🎭 [Real API] Skipping, continue using MOCK mode`)
    return options.mockFallback()
  }
  
  // Retry logic
  let lastError: any = null
  let retryCount = 0
  
  while (retryCount <= REAL_API_CONFIG.MAX_RETRIES) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...REAL_API_CONFIG.EXTRA_HEADERS,
        ...(options?.headers || {})
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        REAL_API_CONFIG.TIMEOUT
      )
      
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      logResponse(method, url, response.status, data)
      
      // Success: return data
      if (response.ok || response.status < 400) {
        currentApiMode = 'REAL'
        isFallbackMode = false
        console.log(`✅ [Real API] Success using REAL API`)
        return data
      }
      
      // Validation/Auth error (4xx) -> Don't retry, throw error
      if (isValidationError({ status: response.status })) {
        console.log(`⚠️ [Real API] Validation error (${response.status}): ${data?.message}`)
        logError(method, url, data)
        throw new Error(data?.message || `HTTP ${response.status}`)
      }
      
      // Server error (5xx) -> Retry atau fallback
      lastError = { status: response.status, ...data }
      
    } catch (error: any) {
      lastError = error
      
      // Check if should retry
      if (shouldRetry(error, retryCount)) {
        retryCount++
        await new Promise(r => setTimeout(r, REAL_API_CONFIG.RETRY_DELAY))
        continue
      }
      
      break
    }
  }
  
  logError(method, url, lastError)
  
  // Decision: Fallback to mock hoặc throw error
  if (shouldFallbackToMock(lastError) && options?.mockFallback) {
    console.log(`🎭 [Real API] Fallback to MOCK`)
    currentApiMode = 'MOCK'
    isFallbackMode = true
    return options.mockFallback()
  }
  
  // Throw error if validation error hoặc fallback không enable
  throw lastError || new Error('API Request failed')
}

/**
 * GET request
 */
export async function getRealApi<T>(
  endpoint: string,
  options?: { mockFallback?: () => Promise<T> }
): Promise<T> {
  return fetchRealApi<T>(endpoint, { 
    method: 'GET',
    ...options 
  })
}

/**
 * POST request
 */
export async function postRealApi<T>(
  endpoint: string,
  body?: any,
  options?: { mockFallback?: () => Promise<T> }
): Promise<T> {
  return fetchRealApi<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options
  })
}

/**
 * PATCH request
 */
export async function patchRealApi<T>(
  endpoint: string,
  body?: any,
  options?: { mockFallback?: () => Promise<T> }
): Promise<T> {
  return fetchRealApi<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
    ...options
  })
}

/**
 * DELETE request
 */
export async function deleteRealApi<T>(
  endpoint: string,
  options?: { mockFallback?: () => Promise<T> }
): Promise<T> {
  return fetchRealApi<T>(endpoint, {
    method: 'DELETE',
    ...options
  })
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * Add auth header
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  if (!token) return {}
  
  return {
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Logout - clear token
 */
export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    console.log('🚪 [Auth] Logged out')
  }
}
