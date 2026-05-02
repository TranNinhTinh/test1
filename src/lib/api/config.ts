// Cấu hình API
import { DEFAULT_PUBLIC_API_V1 } from '@/lib/server/public-api-base'

const DOMAIN_OPTIONS = {
  LOCALHOST: 'http://localhost:3000/api/v1',
  NGROK: DEFAULT_PUBLIC_API_V1,
}

// Chọn domain: env ưu tiên; mặc định ngrok (cùng DEFAULT_PUBLIC_API_V1 trong public-api-base)
const SELECTED_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN || DOMAIN_OPTIONS.NGROK

export const API_CONFIG = {
  // Base URL của API backend
  BASE_URL: SELECTED_DOMAIN,
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    // Chat endpoints
    CHAT_CONVERSATIONS: '/chat/conversations',
    CHAT_CONVERSATION_BY_ID: '/chat/conversations/:id',
    CHAT_DELETE_CONVERSATION: '/chat/conversations/:id',
    CHAT_CREATE_DIRECT: '/chat/conversations/direct',
    CHAT_SEND_MESSAGE: '/chat/conversations/:id/messages',
    CHAT_GET_MESSAGES: '/chat/conversations/:id/messages',
    CHAT_MARK_AS_READ: '/chat/conversations/:id/read',
    CHAT_UNREAD_COUNT: '/chat/unread-count',
    CHAT_CLOSE_CONVERSATION: '/chat/conversations/:id/close',
    CHAT_SEARCH: '/chat/search',
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning
  }
}

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
}
