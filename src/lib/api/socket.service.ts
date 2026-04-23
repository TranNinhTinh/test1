// src/lib/api/socket.service.ts
import { io, Socket } from 'socket.io-client'
import { AuthService } from './auth.service'

// Use current origin to match the dev server port (auto-detects 3003, 3004, etc)
// This avoids CORS/WebSocket issues with ngrok backend
const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

class SocketService {
  private socket: Socket | null = null
  private listeners = new Map<string, Set<Function>>()

  /**
   * Kết nối đến WebSocket server
   */
  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected')
      return
    }

    const token = AuthService.getToken()
    if (!token) {
      console.warn('⚠️ No token found, cannot connect to socket')
      return
    }

    console.log('🔌 Attempting to connect to socket...')
    console.log('   URL:', `${SOCKET_URL}/notifications`)
    console.log('   Token:', token.substring(0, 20) + '...')

    this.socket = io(`${SOCKET_URL}/notifications`, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected! ID:', this.socket?.id)
    })

    this.socket.on('connected', (data: { userId: string }) => {
      console.log('✅ Socket authenticated for user:', data.userId)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
    })

    // Notification events
    this.socket.on('notification:new', (notification) => {
      console.log('🔔 New notification received via socket:', notification)
      this.emit('notification:new', notification)
    })

    this.socket.on('notification:read', (data) => {
      console.log('✓ Notification marked as read via socket:', data.notificationId)
      this.emit('notification:read', data)
    })

    this.socket.on('notification:all_read', () => {
      console.log('✓ All notifications marked as read via socket')
      this.emit('notification:all_read', {})
    })
  }

  /**
   * Ngắt kết nối socket
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket')
      this.socket.disconnect()
      this.socket = null
    }
  }

  /**
   * Đăng ký listener cho event
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
      }
    }
  }

  /**
   * Emit event đến các listeners
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  /**
   * Kiểm tra socket có connected không
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Reconnect socket
   */
  reconnect() {
    this.disconnect()
    this.connect()
  }
}

export const socketService = new SocketService()
