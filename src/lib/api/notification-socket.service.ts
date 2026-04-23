// src/lib/api/notification-socket.service.ts
import { io, Socket } from 'socket.io-client'
import { AuthService } from './auth.service'

// Get socket URL - use current origin in development
const socketUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

export interface Notification {
    id: string
    userId: string
    type: string
    title: string
    message: string
    metadata?: Record<string, any>
    actionUrl?: string
    isRead: boolean
    readAt?: Date
    createdAt: Date
}

class NotificationSocketService {
    private socket: Socket | null = null
    private listeners: Map<string, Set<Function>> = new Map()

    /**
     * Kết nối tới notifications WebSocket namespace (match backend)
     */
    connect(): void {
        if (this.socket?.connected) {
            console.log('🔔 Notification socket already connected')
            return
        }

        const token = AuthService.getToken()
        if (!token) {
            console.error('❌ No token found for notification socket connection')
            return
        }

        console.log('🔔 Connecting to notifications socket...')

        this.socket = io(`${socketUrl}/notifications`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity, // Infinite reconnection attempts
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            forceNew: false, // Reuse connection
            multiplex: true, // Allow multiple sockets to same namespace
        })

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Notification socket connected:', this.socket?.id)
            this.emit('connected_socket', { socketId: this.socket?.id })
        })

        this.socket.on('connected', (data: { userId: string }) => {
            console.log('🔔 Notification socket authenticated:', data)
            this.emit('authenticated', data)
        })

        this.socket.on('disconnect', (reason: string) => {
            console.log('🔔 Notification socket disconnected:', reason)
            this.emit('disconnected', { reason })
        })

        this.socket.on('connect_error', (error: Error) => {
            console.error('❌ Notification socket connection error:', error)
            this.emit('connect_error', { error: error.message })
        })

        // Backend events
        this.socket.on('notification:new', (notification: Notification) => {
            console.log('🔔 New notification received:', notification)
            this.emit('notification:new', notification)
        })

        this.socket.on('notification:read', (data: { notificationId: string }) => {
            console.log('✅ Notification read:', data)
            this.emit('notification:read', data)
        })

        this.socket.on('notification:all_read', () => {
            console.log('✅ All notifications read')
            this.emit('notification:all_read', {})
        })
    }

    /**
     * Disconnect socket
     */
    disconnect(): void {
        if (this.socket) {
            console.log('🔔 Disconnecting notification socket...')
            this.socket.disconnect()
            this.socket = null
            this.listeners.clear()
        }
    }

    /**
     * Listen for events
     */
    on(event: string, callback: Function): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(callback)

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(event)
            if (callbacks) {
                callbacks.delete(callback)
            }
        }
    }

    /**
     * Emit event to listeners
     */
    private emit(event: string, data: any): void {
        const callbacks = this.listeners.get(event)
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error)
                }
            })
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false
    }

    /**
     * Reconnect
     */
    reconnect(): void {
        if (this.socket) {
            console.log('🔄 Reconnecting notification socket...')
            this.socket.connect()
        } else {
            this.connect()
        }
    }
}

export const notificationSocketService = new NotificationSocketService()
