// src/lib/api/notification.service.ts
import { AuthService } from './auth.service'
import { notificationSocketService } from './notification-socket.service'
import { API_CONFIG } from './config'

// Use local proxy route instead of calling backend directly to avoid CORS issues
const API_BASE = '/api'

function emitNotificationUnreadRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('notification:refresh-unread-count'))
}

// Helper function để xử lý fetch với authentication
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = AuthService.getToken()

  if (!token) {
    console.error('❌ No token found')
    AuthService.handleTokenExpired()
    throw new Error('Vui lòng đăng nhập để tiếp tục')
  }

  const fullUrl = `${API_BASE}${url}`
  console.log('📡 API Request:', fullUrl)

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  // Xử lý lỗi 401 - Token invalid/expired
  if (response.status === 401) {
    console.error('❌ Token invalid - redirecting to login')
    AuthService.handleTokenExpired()
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
  }

  return response
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, any>
  data?: Record<string, any>
  actionUrl?: string
  isRead: boolean
  readAt?: Date
  createdAt: string | Date
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
}

export interface UnreadCountResponse {
  count: number
}

class NotificationService {
  /**
   * Get notifications list (match backend API response)
   */
  async getNotifications(params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly.toString())

    console.log('📬 Calling notifications API:', `/notifications?${queryParams.toString()}`)

    const response = await authenticatedFetch(`/notifications?${queryParams.toString()}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Get notifications error:', error)
      throw new Error(error.error || 'Failed to fetch notifications')
    }

    const result = await response.json()
    console.log('✅ Notifications loaded:', result)
    return result
  }

  /**
   * Đếm số thông báo chưa đọc (match backend API)
   */
  async getUnreadCount(): Promise<number> {
    console.log('📊 Fetching unread count...')
    const response = await authenticatedFetch('/notifications/unread-count', {
      method: 'GET'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch unread count')
    }

    const result: UnreadCountResponse = await response.json()
    console.log('✅ Unread count:', result.count)
    return result.count
  }

  /**
   * Đánh dấu thông báo đã đọc (match backend API)
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    console.log('✅ Marking notification as read:', notificationId)
    const response = await authenticatedFetch(`/notifications/${notificationId}/read`, {
      method: 'POST'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to mark as read')
    }

    const result = await response.json()
    emitNotificationUnreadRefresh()
    return result
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc (match backend API)
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    console.log('✅ Marking all notifications as read...')
    const response = await authenticatedFetch('/notifications/mark-all-read', {
      method: 'POST'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to mark all as read')
    }

    const result = await response.json()
    emitNotificationUnreadRefresh()
    return result
  }

  /**
   * Xóa một thông báo (match backend API)
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    console.log('🗑️ Deleting notification:', notificationId)
    const response = await authenticatedFetch(`/notifications/${notificationId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete notification')
    }

    emitNotificationUnreadRefresh()
    return { success: true }
  }

  /**
   * Xóa tất cả thông báo đã đọc (match backend API)
   */
  async deleteReadNotifications(): Promise<{ success: boolean }> {
    console.log('🗑️ Deleting all read notifications...')
    const response = await authenticatedFetch('/notifications/read', {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete all read')
    }

    emitNotificationUnreadRefresh()
    return { success: true }
  }

  /**
   * Backward-compatible alias used by UI page
   */
  async deleteAllRead(): Promise<{ success: boolean }> {
    return this.deleteReadNotifications()
  }

  /**
   * Listen to notification socket events
   */
  onNewNotification(callback: (notification: Notification) => void): () => void {
    return notificationSocketService.on('notification:new', callback)
  }

  onNotificationRead(callback: (data: { notificationId: string }) => void): () => void {
    return notificationSocketService.on('notification:read', callback)
  }
  onAllNotificationsRead(callback: () => void): () => void {
    return notificationSocketService.on('notification:all_read', callback)
  }
}

export const notificationService = new NotificationService()
