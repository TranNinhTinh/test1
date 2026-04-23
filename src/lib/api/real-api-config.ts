// src/lib/api/real-api-config.ts
// Configuration để ưu tiên REAL API từ backend

/**
 * API Mode Configuration
 * 
 * Ưu tiên: REAL API > Mock Fallback
 * 
 * Khi nào dùng REAL API:
 * ✅ Backend online (status 2xx, 4xx)
 * ✅ Có lỗi validation (email, password, etc)
 * 
 * Khi nào dùng MOCK:
 * ⚠️ Network error (no internet)
 * ⚠️ Timeout (backend down)
 * ⚠️ 5xx errors (server error)
 */

export const REAL_API_CONFIG = {
  // Backend URL (từ .env.local)
  BASE_URL: process.env.NEXT_PUBLIC_API_DOMAIN || 'https://postmaxillary-variably-justa.ngrok-free.dev/api/v1',
  
  // Timeout (milliseconds)
  TIMEOUT: 5000,
  
  // Headers cho ngrok bypass
  EXTRA_HEADERS: {
    'ngrok-skip-browser-warning': 'true'
  },
  
  // Logging
  DEBUG: true,
  LOG_REQUESTS: true,
  LOG_RESPONSES: true,
  
  // Retry config
  MAX_RETRIES: 1,
  RETRY_DELAY: 500,
  
  // Fallback
  USE_MOCK_ON_ERROR: true,  // ✅ Enable fallback nếu Real API fail
  PREFER_REAL_API: true      // ✅ Ưu tiên Real API, chỉ fallback khi thực sự fail
}

/**
 * Các status code nên retry:
 * 408 - Request Timeout
 * 429 - Too Many Requests  
 * 500, 502, 503, 504 - Server errors
 * 
 * Các status code KHÔNG nên retry (return error):
 * 400 - Bad Request (validation error)
 * 401 - Unauthorized
 * 403 - Forbidden
 * 404 - Not Found
 */
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * Errors nên retry (network related):
 * - NetworkError
 * - TimeoutError
 * - ERR_NETWORK
 */
export const RETRYABLE_ERRORS = [
  'NetworkError',
  'TimeoutError',
  'ERR_NETWORK',
  'Failed to fetch',
  'Network',
  'timeout'
]

/**
 * Check xem error có nên retry không
 */
export function shouldRetry(error: any, retryCount: number): boolean {
  if (retryCount >= REAL_API_CONFIG.MAX_RETRIES) return false
  
  // Check network errors
  const errorMessage = error?.message?.toLowerCase() || ''
  const isNetworkError = RETRYABLE_ERRORS.some(err => 
    errorMessage.includes(err.toLowerCase())
  )
  
  if (isNetworkError) {
    console.log(`🔄 [Real API] Retry #${retryCount + 1} - Network error detected`)
    return true
  }
  
  // Check retryable status codes
  const statusCode = error?.status || error?.response?.status
  if (statusCode && RETRYABLE_STATUS_CODES.includes(statusCode)) {
    console.log(`🔄 [Real API] Retry #${retryCount + 1} - Retryable status code: ${statusCode}`)
    return true
  }
  
  return false
}

/**
 * Check xem error có nên fallback sang mock không
 */
export function shouldFallbackToMock(error: any): boolean {
  if (!REAL_API_CONFIG.USE_MOCK_ON_ERROR) return false
  
  const errorMessage = error?.message?.toLowerCase() || ''
  
  // Network errors -> Fallback
  const isNetworkError = RETRYABLE_ERRORS.some(err => 
    errorMessage.includes(err.toLowerCase())
  )
  
  if (isNetworkError) {
    console.log(`🎭 [Real API] Fallback to MOCK - Network error: ${error?.message}`)
    return true
  }
  
  // 5xx server errors -> Fallback
  const statusCode = error?.status || error?.response?.status
  if (statusCode && statusCode >= 500) {
    console.log(`🎭 [Real API] Fallback to MOCK - Server error: ${statusCode}`)
    return true
  }
  
  return false
}

/**
 * Check valid error (validation, auth errors) - KHÔNG fallback
 */
export function isValidationError(error: any): boolean {
  const statusCode = error?.status || error?.response?.status
  
  // 4xx errors = validation/auth errors (not network issues)
  // DON'T fallback - return the error
  return (statusCode && statusCode >= 400 && statusCode < 500) || false
}

/**
 * Log request
 */
export function logRequest(method: string, url: string, data?: any) {
  if (!REAL_API_CONFIG.LOG_REQUESTS) return
  
  console.log(`📤 [Real API] ${method.toUpperCase()} ${url}`)
  if (data) {
    console.log(`   Data:`, JSON.stringify(data).substring(0, 100) + '...')
  }
}

/**
 * Log response
 */
export function logResponse(method: string, url: string, status: number, data?: any) {
  if (!REAL_API_CONFIG.LOG_RESPONSES) return
  
  const statusEmoji = status < 300 ? '✅' : status < 400 ? '⚠️' : '❌'
  console.log(`📥 [Real API] ${statusEmoji} ${status} ${method.toUpperCase()} ${url}`)
  if (data && REAL_API_CONFIG.DEBUG) {
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100) + '...')
  }
}

/**
 * Log error
 */
export function logError(method: string, url: string, error: any) {
  console.error(`❌ [Real API] ${method.toUpperCase()} ${url}`)
  console.error(`   Error:`, error?.message || error)
}
