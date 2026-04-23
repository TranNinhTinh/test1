import { useEffect, useRef } from 'react'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { notificationSocketService } from '@/lib/api/notification-socket.service'
import { AuthService } from '@/lib/api/auth.service'

/**
 * Initialize Socket.IO connections on app load
 * Connects to both /chat and /notifications namespaces
 * Uses ref to prevent duplicate initialization
 */
export function useInitSocket() {
    const initializedRef = useRef(false)

    useEffect(() => {
        // Only initialize once (prevent re-initialization on re-render)
        if (initializedRef.current) {
            console.log('⏭️ Sockets already initialized, skipping')
            return
        }

        // Mark as initialized
        initializedRef.current = true

        // Only initialize if user is authenticated
        const token = AuthService.getToken()
        if (!token) {
            console.log('⏭️ No token found, skipping socket initialization')
            return
        }

        console.log('🔌 Starting socket initialization...')

        // Initialize chat socket (singleton pattern prevents re-creation)
        if (!chatSocketService.isConnected()) {
            console.log('🔌 Connecting chat socket...')
            chatSocketService.connect()
        } else {
            console.log('✅ Chat socket already connected')
        }

        // Initialize notification socket (singleton pattern prevents re-creation)
        if (!notificationSocketService.isConnected()) {
            console.log('🔔 Connecting notification socket...')
            notificationSocketService.connect()
        } else {
            console.log('✅ Notification socket already connected')
        }

        // Cleanup on unmount - don't disconnect sockets
        return () => {
            console.log('🔌 useInitSocket cleanup (sockets remain connected for app lifetime)')
        }
    }, []) // Empty dependency - run only once on mount
}