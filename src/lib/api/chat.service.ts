// Chat Service API
import { API_CONFIG } from './config'

export interface Conversation {
  id: string
  customerId: string
  providerId: string
  quoteId?: string
  type: string
  isActive: boolean
  isClosed?: boolean // ⚠️ NEW: Indicates if conversation was explicitly closed
  lastMessageAt?: string
  lastMessagePreview?: string
  customerUnreadCount: number
  providerUnreadCount: number
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: string
  content?: string
  fileUrls?: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface CreateDirectConversationRequest {
  providerId: string
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

export interface SendMessageRequest {
  type: MessageType
  content?: string
  fileUrls?: string[]
  fileNames?: string[]
}

export interface SearchMessagesParams {
  query: string
  limit?: number
}

// Token management
const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

const emitChatUnreadRefresh = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('chat:refresh-unread-count'))
}

// Generic API call function - calls Next.js API routes instead of backend directly
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  // Call Next.js API routes (e.g., /api/chat/conversations) instead of backend directly
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const result = await response.json()

  // Backend API returns { data: ... } or { success: true, data: ... }
  // Extract the actual data from the response
  if (result && typeof result === 'object') {
    if ('data' in result) {
      return result.data as T
    }
    if ('success' in result && 'data' in result) {
      return result.data as T
    }
  }

  return result as T
}

// Chat Service
export const chatService = {
  // GET /chat/conversations - Lấy danh sách conversations
  async getConversations(): Promise<Conversation[]> {
    return apiCall<Conversation[]>('/chat/conversations', {
      method: 'GET',
    })
  },

  // GET /chat/conversations/{id} - Xem chi tiết conversation
  async getConversationById(id: string): Promise<Conversation> {
    return apiCall<Conversation>(`/chat/conversations/${id}`, {
      method: 'GET',
    })
  },

  // DELETE /chat/conversations/{id} - Xóa conversation
  async deleteConversation(id: string): Promise<void> {
    return apiCall<void>(`/chat/conversations/${id}`, {
      method: 'DELETE',
    })
  },

  // POST /chat/conversations/direct - Tạo conversation riêng với thợ
  async createDirectConversation(data: CreateDirectConversationRequest): Promise<Conversation> {
    return apiCall<Conversation>('/chat/conversations/direct', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // POST /chat/conversations/{id}/messages - Gửi tin nhắn
  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
    return apiCall<Message>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // GET /chat/conversations/{id}/messages - Lấy tin nhắn của conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    return apiCall<Message[]>(`/chat/conversations/${conversationId}/messages`, {
      method: 'GET',
    })
  },

  // POST /chat/conversations/{id}/read - Đánh dấu tin nhắn đã đọc
  async markAsRead(conversationId: string): Promise<void> {
    const result = await apiCall<void>(`/chat/conversations/${conversationId}/read`, {
      method: 'POST',
    })
    emitChatUnreadRefresh()
    return result
  },

  // GET /chat/unread-count - Đếm tổng tin nhắn chưa đọc
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const data = await apiCall<any>('/chat/unread-count', {
      method: 'GET',
    })

    // Backend có thể trả về nhiều format: { unreadCount }, { count }, number, hoặc nested data
    if (typeof data === 'number') {
      return { unreadCount: data }
    }

    const unreadCount =
      Number(data?.unreadCount) ||
      Number(data?.count) ||
      Number(data?.unread) ||
      Number(data?.totalUnread) ||
      Number(data?.unreadMessages) ||
      Number(data?.data?.unreadCount) ||
      Number(data?.data?.count) ||
      0

    return { unreadCount }
  },

  // POST /chat/conversations/{id}/close - Đóng conversation
  async closeConversation(conversationId: string): Promise<void> {
    return apiCall<void>(`/chat/conversations/${conversationId}/close`, {
      method: 'POST',
    })
  },

  // GET /chat/search - Tìm kiếm tin nhắn
  async searchMessages(params: SearchMessagesParams): Promise<Message[]> {
    const queryParams = new URLSearchParams({
      keyword: params.query,
      ...(params.limit && { limit: params.limit.toString() }),
    })

    return apiCall<Message[]>(`/chat/search?${queryParams}`, {
      method: 'GET',
    })
  },
}
