import { useEffect, useState } from 'react'
import { notificationService, Notification } from '@/lib/api/notification.service'

/**
 * Hook to listen to notification socket events and update state
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load initial notifications
        loadNotifications()

        // Listen to real-time notification events
        const unsubscribeNew = notificationService.onNewNotification((notification: Notification) => {
            console.log('🔔 New notification received:', notification)
            setNotifications((prev) => [notification, ...prev])
            setUnreadCount((count) => count + 1)
        })

        const unsubscribeRead = notificationService.onNotificationRead((data: { notificationId: string }) => {
            console.log('✅ Notification read:', data.notificationId)
            loadNotifications() // Refresh to update state
        })

        const unsubscribeAllRead = notificationService.onAllNotificationsRead(() => {
            console.log('✅ All notifications marked as read')
            loadNotifications() // Refresh to update state
        })

        // Cleanup
        return () => {
            unsubscribeNew()
            unsubscribeRead()
            unsubscribeAllRead()
        }
    }, [])

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const response = await notificationService.getNotifications({ page: 1, limit: 50 })
            setNotifications(response.notifications)
            setUnreadCount(response.unreadCount)
        } catch (error) {
            console.error('❌ Failed to load notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId)
            // Update will come from socket event listener
        } catch (error) {
            console.error('❌ Failed to mark as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead()
            // Update will come from socket event listener
        } catch (error) {
            console.error('❌ Failed to mark all as read:', error)
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try {
            await notificationService.deleteNotification(notificationId)
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        } catch (error) {
            console.error('❌ Failed to delete notification:', error)
        }
    }

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: loadNotifications,
    }
}
