// src/lib/socket-init.ts
// Global socket initialization - runs once when module is imported
// This ensures sockets connect at the earliest possible time

import { chatSocketService } from './api/chat-socket.service'
import { notificationSocketService } from './api/notification-socket.service'
import { AuthService } from './api/auth.service'

let initialized = false

export function initializeSockets() {
    // Prevent multiple initializations
    if (initialized) {
        console.log('⏭️ Sockets already initialized, skipping')
        return
    }

    initialized = true

    // Check if user has token
    const token = AuthService.getToken()
    if (!token) {
        console.log('⏭️ No token found, sockets will be initialized after login')
        return
    }

    console.log('🔌 Initializing sockets globally...')

    // Connect chat socket
    if (!chatSocketService.isConnected()) {
        console.log('🔌 Connecting to chat socket...')
        try {
            chatSocketService.connect()
            console.log('✅ Chat socket connect() called')
        } catch (error) {
            console.error('❌ Error calling chatSocketService.connect():', error)
        }
    } else {
        console.log('✅ Chat socket already connected')
    }

    // Connect notification socket
    if (!notificationSocketService.isConnected()) {
        console.log('🔔 Connecting to notification socket...')
        try {
            notificationSocketService.connect()
            console.log('✅ Notification socket connect() called')
        } catch (error) {
            console.error('❌ Error calling notificationSocketService.connect():', error)
        }
    } else {
        console.log('✅ Notification socket already connected')
    }
}

// Auto-initialize on module load (for browser environment)
if (typeof window !== 'undefined') {
    console.log('🔌 [socket-init] Module loaded, scheduling initialization...')
    // Use next tick to ensure DOM is ready
    if (document.readyState === 'loading') {
        console.log('🔌 [socket-init] DOM still loading, adding DOMContentLoaded listener')
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔌 [socket-init] DOMContentLoaded fired, initializing sockets')
            initializeSockets()
        })
    } else {
        // DOM is already ready
        console.log('🔌 [socket-init] DOM ready, scheduling initialization')
        setTimeout(() => {
            console.log('🔌 [socket-init] Timeout fired, calling initializeSockets()')
            initializeSockets()
        }, 100)
    }
}
