'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser,
    faComments,
    faStar,
    faBoxOpen,
    faBookmark,
    faRightFromBracket,
    faFileLines,
    faClipboardList, faCircleCheck, faCircleXmark, faMoneyBillWave, faPen,
    faBan, faBox, faClock, faGift, faHammer, faComment, faCreditCard,
    faRotateLeft, faKey, faBell, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { AuthService } from '@/lib/api/auth.service'
import { notificationService, type Notification as AppNotification } from '@/lib/api/notification.service'
import { chatService } from '@/lib/api/chat.service'
import { notificationSocketService } from '@/lib/api/notification-socket.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { SearchService } from '@/lib/api/search.service'
import ThoTotLogo from '@/app/components/ThoTotLogo'
import { resolveMediaUrl as normalizeImageUrl } from '@/lib/media-url'

interface HeaderProps {
    currentUser?: any
}

interface HeaderSearchResult {
    id: string
    type: 'post' | 'provider'
    title: string
    subtitle?: string
    avatarUrl?: string
}

const CONVERSATION_LAST_VIEWED_AT_STORAGE_KEY = 'chat_conversation_last_viewed_at'
const CONVERSATION_VIEWED_RAW_UNREAD_STORAGE_KEY = 'chat_conversation_viewed_raw_unread_map'

export default function Header({ currentUser: initialUser }: HeaderProps) {
    const [currentUser, setCurrentUser] = useState<any>(initialUser)
    const [avatarError, setAvatarError] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showNotificationMenu, setShowNotificationMenu] = useState(false)
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
    const [unreadMessageCount, setUnreadMessageCount] = useState(0)
    const [notificationItems, setNotificationItems] = useState<AppNotification[]>([])
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all')
    const [notificationLoading, setNotificationLoading] = useState(false)
    const [notificationError, setNotificationError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [searchResults, setSearchResults] = useState<HeaderSearchResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState('')
    const router = useRouter()
    const pathname = usePathname()

    const setUnreadNotificationCountSynced = (value: number) => {
        const next = Math.max(0, Number(value) || 0)
        setUnreadNotificationCount(next)

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('notification_unread_count', String(next))
        }
    }

    const setUnreadMessageCountSynced = (value: number) => {
        const next = Math.max(0, Number(value) || 0)
        setUnreadMessageCount(next)

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('chat_unread_count', String(next))
        }
    }

    const isMessageNotification = (notification: any) => {
        const type = String(notification?.type || '').toLowerCase()
        const title = String(notification?.title || '').toLowerCase()
        const message = String(notification?.message || '').toLowerCase()
        const actionUrl = String(notification?.actionUrl || '').toLowerCase()

        return (
            type.includes('message') ||
            type.includes('chat') ||
            title.includes('tin nhắn') ||
            title.includes('message') ||
            message.includes('tin nhắn') ||
            message.includes('message') ||
            actionUrl.includes('/tin-nhan')
        )
    }

    const isDirectRequestNotification = (notification: any) => {
        const type = String(notification?.type || '').toLowerCase()
        return type.includes('direct_request')
    }

    const isQuoteNotification = (notification: any) => {
        if (isDirectRequestNotification(notification)) return false
        const type = String(notification?.type || '').toLowerCase()
        const title = String(notification?.title || '').toLowerCase()
        const message = String(notification?.message || '').toLowerCase()
        return (
            type.includes('quote') ||
            type.includes('bao_gia') ||
            title.includes('báo giá') ||
            message.includes('báo giá')
        )
    }

    const isReviewNotification = (notification: any) => {
        const type = String(notification?.type || '').toLowerCase()
        const title = String(notification?.title || '').toLowerCase()
        const message = String(notification?.message || '').toLowerCase()
        const actionUrl = String(notification?.actionUrl || '').toLowerCase()

        return (
            type.includes('review') ||
            title.includes('review') ||
            title.includes('đánh giá') ||
            message.includes('review') ||
            message.includes('đánh giá') ||
            actionUrl.includes('/reviews/') ||
            actionUrl.includes('/danh-gia-ve-toi')
        )
    }

    const extractPostIdFromActionUrl = (actionUrl: string) => {
        const match = actionUrl.match(/^\/posts\/([^/]+)(?:\/quotes)?(?:\/)?(?:\?.*)?$/)
        return match?.[1] || null
    }

    const extractReviewIdFromNotification = (notification: any) => {
        const metadata = notification?.metadata || notification?.data || {}
        const reviewId = String(
            metadata.reviewId ||
            metadata.review_id ||
            metadata.id ||
            metadata.entityId ||
            metadata.review?.id ||
            ''
        ).trim()
        if (reviewId) {
            return reviewId
        }

        const actionUrl = String(notification?.actionUrl || '').trim()
        if (!actionUrl) {
            return null
        }

        const queryString = actionUrl.includes('?') ? actionUrl.split('?')[1] : ''
        const queryParams = new URLSearchParams(queryString)
        const reviewIdFromQuery = queryParams.get('reviewId') || queryParams.get('id')
        if (reviewIdFromQuery?.trim()) {
            return reviewIdFromQuery.trim()
        }

        const match = actionUrl.match(/\/reviews\/([^/?#]+)/i)
        if (match?.[1]) {
            return match[1]
        }

        const hashMatch = actionUrl.match(/#review-([^/?#]+)/i)
        if (hashMatch?.[1]) {
            return hashMatch[1]
        }

        return null
    }

    const getNotificationIcon = (type: string) => {
        const t = (type || '').toLowerCase()
        if (t.includes('direct_request_received')) return <FontAwesomeIcon icon={faClipboardList} />
        if (t.includes('direct_request_accepted')) return <FontAwesomeIcon icon={faCircleCheck} />
        if (t.includes('direct_request_rejected')) return <FontAwesomeIcon icon={faCircleXmark} />
        if (t.includes('direct_request')) return <FontAwesomeIcon icon={faClipboardList} />
        if (t.includes('new_quote') || t.includes('quote_received')) return <FontAwesomeIcon icon={faMoneyBillWave} />
        if (t.includes('quote_accepted_for_chat')) return <FontAwesomeIcon icon={faComments} />
        if (t.includes('quote_accepted')) return <FontAwesomeIcon icon={faCircleCheck} />
        if (t.includes('quote_rejected')) return <FontAwesomeIcon icon={faCircleXmark} />
        if (t.includes('quote_revised')) return <FontAwesomeIcon icon={faPen} />
        if (t.includes('quote_cancelled')) return <FontAwesomeIcon icon={faBan} />
        if (t.includes('quote')) return <FontAwesomeIcon icon={faMoneyBillWave} />
        if (t.includes('order_requested')) return <FontAwesomeIcon icon={faBox} />
        if (t.includes('order_awaiting')) return <FontAwesomeIcon icon={faClock} />
        if (t.includes('order_created')) return <FontAwesomeIcon icon={faBox} />
        if (t.includes('order_completed')) return <FontAwesomeIcon icon={faGift} />
        if (t.includes('order_cancelled')) return <FontAwesomeIcon icon={faBan} />
        if (t.includes('order_in_progress')) return <FontAwesomeIcon icon={faHammer} />
        if (t.includes('order')) return <FontAwesomeIcon icon={faBox} />
        if (t.includes('message') || t.includes('chat')) return <FontAwesomeIcon icon={faComment} />
        if (t.includes('post')) return <FontAwesomeIcon icon={faFileLines} />
        if (t.includes('review')) return <FontAwesomeIcon icon={faStar} />
        if (t.includes('payment_received')) return <FontAwesomeIcon icon={faCreditCard} />
        if (t.includes('payment_failed')) return <FontAwesomeIcon icon={faTriangleExclamation} />
        if (t.includes('refund')) return <FontAwesomeIcon icon={faRotateLeft} />
        if (t.includes('account_verified')) return <FontAwesomeIcon icon={faCircleCheck} />
        if (t.includes('account_suspended') || t.includes('account_warning')) return <FontAwesomeIcon icon={faTriangleExclamation} />
        if (t.includes('subscription')) return <FontAwesomeIcon icon={faKey} />
        return <FontAwesomeIcon icon={faBell} />
    }

    const formatTime = (timestamp: string | Date) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInMs = now.getTime() - time.getTime()
        const diffInMinutes = Math.floor(diffInMs / 60000)
        const diffInHours = Math.floor(diffInMinutes / 60)
        const diffInDays = Math.floor(diffInHours / 24)

        if (diffInMinutes < 1) return 'Vừa xong'
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
        if (diffInHours < 24) return `${diffInHours} giờ trước`
        if (diffInDays < 7) return `${diffInDays} ngày trước`
        return time.toLocaleDateString('vi-VN')
    }

    const loadHeaderNotifications = async () => {
        try {
            setNotificationLoading(true)
            setNotificationError('')
            const response = await notificationService.getNotifications({ limit: 20 })
            const visibleNotifications = Array.isArray(response.notifications)
                ? response.notifications.filter((notif) => !isMessageNotification(notif))
                : []
            setNotificationItems(visibleNotifications)
            void loadUnreadNotificationCount()
        } catch (error) {
            console.error('Failed to load header notifications:', error)
            setNotificationError('Không thể tải thông báo')
        } finally {
            setNotificationLoading(false)
        }
    }

    const handleMarkNotificationAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId)
            let wasUnread = false

            setNotificationItems(prev => prev.map((notif) => {
                if (notif.id === notificationId) {
                    if (!notif.isRead) {
                        wasUnread = true
                    }
                    return { ...notif, isRead: true }
                }
                return notif
            }))

            if (wasUnread) {
                const nextUnreadCount = Math.max(0, unreadNotificationCount - 1)
                setUnreadNotificationCountSynced(nextUnreadCount)
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const resolveNotificationTarget = (notification: AppNotification) => {
        if (isDirectRequestNotification(notification)) {
            const metadata = notification.metadata || {}
            const customRequestId = metadata.customRequestId || metadata.custom_request_id
            if (customRequestId) {
                return `/yeu-cau-rieng/${customRequestId}`
            }

            const actionUrl = String(notification.actionUrl || '').trim()
            if (actionUrl) {
                return actionUrl.replace(/^\/custom-requests\//, '/yeu-cau-rieng/')
            }

            return '/yeu-cau-rieng'
        }

        if (isReviewNotification(notification)) {
            const reviewId = extractReviewIdFromNotification(notification)
            if (reviewId) {
                return `/danh-gia-ve-toi?highlightReviewId=${encodeURIComponent(reviewId)}`
            }
            return '/danh-gia-ve-toi'
        }

        if (isQuoteNotification(notification)) {
            const metadata = notification.metadata || notification.data || {}
            let postId = metadata.postId || metadata.post_id || metadata.postID
            if (!postId && notification.actionUrl) {
                postId = extractPostIdFromActionUrl(notification.actionUrl)
            }
            if (postId) {
                return `/posts/${postId}`
            }
        }

        const actionUrl = String(notification.actionUrl || '').trim()
        if (actionUrl) {
            return actionUrl.replace(/^\/custom-requests\//, '/yeu-cau-rieng/')
        }

        return '/thong-bao'
    }

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.isRead) {
            await handleMarkNotificationAsRead(notification.id)
        }

        setShowNotificationMenu(false)
        router.push(resolveNotificationTarget(notification))
    }

    const visibleNotificationItems = notificationItems.filter((notif) => !isMessageNotification(notif))
    const filteredNotificationItems = visibleNotificationItems.filter((notif) => {
        if (notificationFilter === 'unread') {
            return !notif.isRead
        }
        return true
    })

    const visibleNotificationUnreadCount = visibleNotificationItems.filter((notif) => !notif.isRead).length

    const loadUnreadNotificationCount = async () => {
        const response = await notificationService.getNotifications({ limit: 100, unreadOnly: true })
        const unreadNonMessage = Array.isArray(response.notifications)
            ? response.notifications.filter((notif: any) => !notif?.isRead && !isMessageNotification(notif)).length
            : 0
        setUnreadNotificationCountSynced(unreadNonMessage)
    }

    const refreshUnreadMessageCount = async () => {
        const userId = String(currentUser?.id || '')
        const isChatPage = pathname.startsWith('/tin-nhan')

        // On chat page, avoid early fallback to raw unread endpoint before user is hydrated,
        // because it can flash a stale large number then drop a few seconds later.
        if (!userId && isChatPage) {
            return
        }

        // Use one single source for chat badge: conversation unread fields + effective logic.
        // If user is not hydrated yet, skip instead of using raw unread endpoint.
        if (!userId) {
            return
        }

        // Prefer conversation-based unread aggregation because it reflects per-thread read state.
        let viewedMap: Record<string, number> = {}
        let viewedRawUnreadMap: Record<string, number> = {}
        if (typeof window !== 'undefined') {
            try {
                const raw = window.localStorage.getItem(CONVERSATION_LAST_VIEWED_AT_STORAGE_KEY)
                if (raw) {
                    const parsed = JSON.parse(raw)
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        viewedMap = Object.entries(parsed).reduce<Record<string, number>>((acc, [key, value]) => {
                            const asNumber = Number(value)
                            if (!Number.isNaN(asNumber) && asNumber > 0) {
                                acc[key] = asNumber
                            }
                            return acc
                        }, {})
                    }
                }

                const rawUnreadMap = window.localStorage.getItem(CONVERSATION_VIEWED_RAW_UNREAD_STORAGE_KEY)
                if (rawUnreadMap) {
                    const parsedRawMap = JSON.parse(rawUnreadMap)
                    if (parsedRawMap && typeof parsedRawMap === 'object' && !Array.isArray(parsedRawMap)) {
                        viewedRawUnreadMap = Object.entries(parsedRawMap).reduce<Record<string, number>>((acc, [key, value]) => {
                            const asNumber = Number(value)
                            if (!Number.isNaN(asNumber) && asNumber >= 0) {
                                acc[key] = asNumber
                            }
                            return acc
                        }, {})
                    }
                }
            } catch (error) {
                console.error('Failed to parse viewed conversation map:', error)
            }
        }

        const conversations = await chatService.getConversations()
        const totalUnread = conversations.reduce((total, conv: any) => {
            const conversationId = String(conv?.id || '')
            const viewedAt = Number(viewedMap[conversationId] || 0)
            const lastMessageAt = conv?.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0
            const viewedRawUnread = Number(viewedRawUnreadMap[conversationId] || 0)

            // Match message page behavior: suppress stale unread if user has viewed the thread
            // and there is no newer message than viewed timestamp.
            if (viewedAt > 0 && lastMessageAt > 0 && lastMessageAt <= viewedAt) {
                return total
            }

            let rawUnread = 0
            let effectiveBaseline = viewedRawUnread

            if (conv.customerId === userId) {
                rawUnread = Number(conv.customerUnreadCount) || 0
                effectiveBaseline = rawUnread < viewedRawUnread ? 0 : viewedRawUnread
                return total + Math.max(0, rawUnread - effectiveBaseline)
            }

            if (conv.providerId === userId) {
                rawUnread = Number(conv.providerUnreadCount) || 0
                effectiveBaseline = rawUnread < viewedRawUnread ? 0 : viewedRawUnread
                return total + Math.max(0, rawUnread - effectiveBaseline)
            }

            const role = String(currentUser?.accountType || currentUser?.role || '').toUpperCase()
            if (role === 'CUSTOMER') {
                rawUnread = Number(conv.customerUnreadCount) || 0
                effectiveBaseline = rawUnread < viewedRawUnread ? 0 : viewedRawUnread
                return total + Math.max(0, rawUnread - effectiveBaseline)
            }

            rawUnread = Number(conv.providerUnreadCount) || 0
            effectiveBaseline = rawUnread < viewedRawUnread ? 0 : viewedRawUnread
            return total + Math.max(0, rawUnread - effectiveBaseline)
        }, 0)

        setUnreadMessageCountSynced(totalUnread)
    }

    const accountType = String(currentUser?.accountType || currentUser?.role || '').toUpperCase()
    const isWorker = accountType === 'WORKER' || accountType === 'PROVIDER'

    const quickAccessPath = isWorker ? '/gio-hang' : '/bai-dang-cua-toi'
    const schedulePath = '/don-hang'

    const profileMenuItemClass =
        'flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/20'
    const profileMenuIconClass = 'h-4 w-4 shrink-0 text-white'
    const profileMenuDividerClass = 'my-1 border-white/30'

    const navTextClass = (active: boolean) =>
        [
            'relative whitespace-nowrap rounded-app-md px-2.5 py-2 text-sm font-medium tracking-tight transition-colors duration-app-fast ease-app-emphasized lg:px-3',
            "after:pointer-events-none after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand after:transition-opacity after:duration-app-fast after:content-['']",
            active
                ? 'text-brand-dark after:opacity-100'
                : 'text-foreground-muted after:opacity-0 hover:text-foreground hover:after:opacity-40',
        ].join(' ')

    const mapUserWithAvatar = (rawUser: any) => {
        if (!rawUser) return null
        const resolvedAvatar = normalizeImageUrl(rawUser.avatarUrl || rawUser.avatar)
        return {
            ...rawUser,
            avatar: resolvedAvatar,
            avatarUrl: resolvedAvatar,
        }
    }

    const mapPostSearchResult = (post: any): HeaderSearchResult => {
        const postId = String(post?.id || post?.postId || '')
        const title = String(post?.title || post?.postTitle || 'Bài đăng dịch vụ')
        const province = String(post?.province || post?.location || '').trim()

        return {
            id: postId,
            type: 'post',
            title,
            subtitle: province ? `Bài đăng${province ? ` - ${province}` : ''}` : 'Bài đăng',
        }
    }

    const mapProviderSearchResult = (provider: any): HeaderSearchResult => {
        const providerId = String(provider?.id || provider?.providerId || '')
        const displayName = String(provider?.displayName || provider?.fullName || 'Thợ dịch vụ')
        const province = String(provider?.province || provider?.address || '').trim()

        return {
            id: providerId,
            type: 'provider',
            title: displayName,
            subtitle: province ? `Thợ - ${province}` : 'Thợ',
            avatarUrl: normalizeImageUrl(provider?.avatarUrl || provider?.avatar),
        }
    }

    // Load user info if not provided
    useEffect(() => {
        if (!currentUser) {
            const loadUser = async () => {
                try {
                    const token = AuthService.getToken()
                    if (!token) return

                    const response = await fetch('/api/profile/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    })

                    if (response.ok) {
                        const data = await response.json()
                        setAvatarError(false)
                        setCurrentUser(mapUserWithAvatar(data.data || data))
                    }
                } catch (error) {
                    console.error('Failed to load user:', error)
                }
            }
            loadUser()
        }
    }, [currentUser])

    useEffect(() => {
        if (initialUser) {
            setAvatarError(false)
            setCurrentUser(mapUserWithAvatar(initialUser))
        }
    }, [initialUser])

    // Load unread counts
    useEffect(() => {
        const loadCounts = async () => {
            try {
                await loadUnreadNotificationCount()
                await refreshUnreadMessageCount()
            } catch (error) {
                console.error('Failed to load counts:', error)
                // Do not keep stale cached badge values when backend/API is unavailable.
                setUnreadNotificationCountSynced(0)
                setUnreadMessageCountSynced(0)
            }
        }

        // Hydrate instantly from local cache for smooth UX when user navigates back/forth
        if (typeof window !== 'undefined') {
            const isChatPage = pathname.startsWith('/tin-nhan')
            const isNotificationPage = pathname.startsWith('/thong-bao')

            // Do not hydrate chat badge from cache on chat page because cache can be stale
            // and cause a temporary wrong number before API sync.
            if (!isChatPage) {
                const cached = Number(window.localStorage.getItem('chat_unread_count') || '0')
                if (!Number.isNaN(cached)) {
                    setUnreadMessageCount(Math.max(0, cached))
                }
            }

            // Do not hydrate notification badge from cache on notification page to avoid flash/jump.
            if (!isNotificationPage) {
                const cachedNotification = Number(window.localStorage.getItem('notification_unread_count') || '0')
                if (!Number.isNaN(cachedNotification)) {
                    setUnreadNotificationCount(Math.max(0, cachedNotification))
                }
            }
        }

        loadCounts()

        // Realtime socket listeners for unread badges
        notificationSocketService.connect()
        chatSocketService.connect()

        const unsubscribeNotifNew = notificationSocketService.on('notification:new', (notification: any) => {
            if (notification && !isMessageNotification(notification)) {
                // Always sync from API to avoid badge drift on duplicated/missed socket events
                void loadUnreadNotificationCount()
                void loadHeaderNotifications()
            }
        })

        const unsubscribeNotifRead = notificationSocketService.on('notification:read', () => {
            void loadUnreadNotificationCount()
            void loadHeaderNotifications()
        })

        const unsubscribeNotifAllRead = notificationSocketService.on('notification:all_read', () => {
            setUnreadNotificationCountSynced(0)
            void loadHeaderNotifications()
        })

        const unsubscribeChatConnected = chatSocketService.on('connected', (data: { userId: string; unreadCount: number }) => {
            // Do not trust unread count from socket handshake because it can be stale after reconnect.
            // Always sync from API so badge reflects persisted backend state.
            void refreshUnreadMessageCount().catch((error) => {
                console.error('Failed to refresh message count on connect:', error)
            })
        })

        const unsubscribeChatUnreadUpdated = chatSocketService.on('unread_updated', () => {
            void refreshUnreadMessageCount().catch((error) => {
                console.error('Failed to refresh message count on unread_updated:', error)
                setUnreadMessageCountSynced(0)
            })
        })

        const unsubscribeChatNewMessage = chatSocketService.on('new_message', () => {
            void refreshUnreadMessageCount().catch((error) => {
                console.error('Failed to refresh message count on new_message:', error)
                setUnreadMessageCountSynced(0)
            })
        })

        // Polling fallback in case client misses socket events
        const interval = setInterval(loadCounts, 60000)

        const handleUnreadChanged = (event: Event) => {
            // Keep single source of truth by re-syncing from conversations/effective logic.
            // Ignore direct unread value from event payload.
            void refreshUnreadMessageCount().catch((error) => {
                console.error('Failed to refresh message count on unread event:', error)
            })
        }

        const handleNotificationUnreadChanged = (event: Event) => {
            // Keep one source of truth for notification badge by re-syncing from API.
            // Ignore direct unread value from event payload.
            void loadUnreadNotificationCount().catch((error) => {
                console.error('Failed to refresh notification count on unread event:', error)
            })
        }

        const handleNotificationMenuRefresh = () => {
            void loadHeaderNotifications().catch((error) => {
                console.error('Failed to refresh notification menu:', error)
            })
        }

        const handleWindowFocus = () => {
            void loadCounts()
        }

        const handleNotificationRefresh = () => {
            void loadUnreadNotificationCount().catch((error) => {
                console.error('Failed to refresh notification count:', error)
            })
        }

        const handleChatRefresh = () => {
            void refreshUnreadMessageCount().catch((error) => {
                console.error('Failed to refresh chat count:', error)
            })
        }

        window.addEventListener('chat:unread-count-changed', handleUnreadChanged as EventListener)
        window.addEventListener('notification:unread-count-changed', handleNotificationUnreadChanged as EventListener)
        window.addEventListener('notification:refresh-unread-count', handleNotificationRefresh as EventListener)
        window.addEventListener('notification:refresh-list', handleNotificationMenuRefresh)
        window.addEventListener('chat:refresh-unread-count', handleChatRefresh as EventListener)
        window.addEventListener('focus', handleWindowFocus)

        return () => {
            unsubscribeNotifNew()
            unsubscribeNotifRead()
            unsubscribeNotifAllRead()
            unsubscribeChatConnected()
            unsubscribeChatUnreadUpdated()
            unsubscribeChatNewMessage()
            window.removeEventListener('chat:unread-count-changed', handleUnreadChanged as EventListener)
            window.removeEventListener('notification:unread-count-changed', handleNotificationUnreadChanged as EventListener)
            window.removeEventListener('notification:refresh-unread-count', handleNotificationRefresh as EventListener)
            window.removeEventListener('notification:refresh-list', handleNotificationMenuRefresh)
            window.removeEventListener('chat:refresh-unread-count', handleChatRefresh as EventListener)
            window.removeEventListener('focus', handleWindowFocus)
            clearInterval(interval)
        }
    }, [currentUser?.id, currentUser?.accountType, currentUser?.role])

    useEffect(() => {
        if (!showNotificationMenu) {
            return
        }

        void loadHeaderNotifications()
    }, [showNotificationMenu])

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setShowSearchResults(false)
            setSearchResults([])
            setSearchError('')
            return
        }

        if (query.trim().length < 2) {
            setShowSearchResults(true)
            setSearchResults([])
            setSearchLoading(false)
            setSearchError('Nhập ít nhất 2 ký tự để tìm kiếm')
            return
        }

        try {
            setSearchError('')
            setSearchLoading(true)
            setShowSearchResults(true)

            const [globalResult, providersResult, postsResult] = await Promise.allSettled([
                SearchService.globalSearch({ q: query.trim(), limit: 6 }),
                SearchService.searchProviders({ displayName: query.trim(), limit: 4 }),
                SearchService.searchPosts({ title: query.trim(), limit: 4 }),
            ])

            const globalRes = globalResult.status === 'fulfilled' ? globalResult.value : null
            const providersRes = providersResult.status === 'fulfilled' ? providersResult.value : null
            const postsRes = postsResult.status === 'fulfilled' ? postsResult.value : null

            const errors = [globalResult, providersResult, postsResult]
                .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
                .map((result) => String(result.reason?.message || result.reason || 'Search request failed'))

            const mergedResults: HeaderSearchResult[] = []
            const seen = new Set<string>()

            const addResult = (item: HeaderSearchResult) => {
                if (!item.id) return
                const key = `${item.type}:${item.id}`
                if (seen.has(key)) return
                seen.add(key)
                mergedResults.push(item)
            }

            ;(globalRes?.providers || []).forEach((provider: any) => addResult(mapProviderSearchResult(provider)))
            ;(globalRes?.posts || []).forEach((post: any) => addResult(mapPostSearchResult(post)))
            ;(providersRes?.data || []).forEach((provider: any) => addResult(mapProviderSearchResult(provider)))
            ;(postsRes?.data || []).forEach((post: any) => addResult(mapPostSearchResult(post)))

            setSearchResults(mergedResults.slice(0, 12))

            if (mergedResults.length === 0 && errors.length > 0) {
                setSearchError(errors[0])
            }
        } catch (error) {
            console.error('Search error:', error)
            setSearchResults([])
            setSearchError('Không thể tìm kiếm lúc này, vui lòng thử lại')
        } finally {
            setSearchLoading(false)
        }
    }

    useEffect(() => {
        const query = searchQuery.trim()
        if (!query) {
            setShowSearchResults(false)
            setSearchResults([])
            setSearchLoading(false)
            setSearchError('')
            return
        }

        const timer = setTimeout(() => {
            void performSearch(query)
        }, 350)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.search-container')) {
                setShowSearchResults(false)
            }
            if (!target.closest('.notification-menu')) {
                setShowNotificationMenu(false)
            }
            if (!target.closest('.profile-menu')) {
                setShowProfileMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="page-enter sticky top-0 z-40 border-b border-outline-variant/50 bg-surface/90 shadow-app-header backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
            <div className="app-container flex w-full flex-wrap items-center gap-x-2 gap-y-2 py-2.5 md:flex-nowrap md:gap-x-5 md:py-3.5">
                {/* Logo + mobile search shortcut */}
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => router.push('/home')}
                        className="transition hover:opacity-90"
                        aria-label="Về trang chủ"
                    >
                        <ThoTotLogo className="w-[4.5rem] sm:w-20" />
                    </button>
                    <Link
                        href="/posts/search"
                        className="rounded-app-lg p-2 text-brand shadow-sm transition-all duration-app-fast hover:bg-brand-tint/80 hover:shadow-md md:hidden"
                        aria-label="Tìm kiếm"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </Link>
                </div>

                {/* Website primary nav (tablet/desktop) */}
                <nav className="mx-auto hidden min-w-0 flex-wrap items-center justify-center gap-x-0.5 gap-y-1 md:flex lg:gap-x-1" aria-label="Menu chính">
                    <Link href="/home" className={navTextClass(pathname === '/home' || pathname === '/')}>
                        Trang chủ
                    </Link>
                    <Link href="/posts/search" className={navTextClass(pathname.startsWith('/posts/search'))}>
                        Tìm kiếm
                    </Link>
                    <Link href="/tin-nhan" className={navTextClass(pathname.startsWith('/tin-nhan'))}>
                        Tin nhắn
                    </Link>
                    <Link href="/thong-bao" className={navTextClass(pathname.startsWith('/thong-bao'))}>
                        Thông báo
                    </Link>
                    <Link href={quickAccessPath} className={navTextClass(pathname === quickAccessPath)}>
                        {isWorker ? 'Chào giá' : 'Bài đăng'}
                    </Link>
                    <Link href={schedulePath} className={navTextClass(pathname.startsWith('/don-hang'))}>
                        Đơn hàng
                    </Link>
                    {isWorker && (
                        <Link
                            href="/subscription"
                            className={navTextClass(pathname.startsWith('/subscription'))}
                        >
                            Gói của bạn
                        </Link>
                    )}
                </nav>

                {/* Search — desktop */}
                <div className="relative search-container mx-auto hidden min-w-0 max-w-md flex-1 md:block lg:max-w-xl">
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchQuery.trim()) {
                                    setShowSearchResults(true)
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    void performSearch(searchQuery)
                                }
                            }}
                            placeholder="Tìm kiếm thợ, dịch vụ..."
                            className="w-full rounded-app-xl border border-outline-variant/70 bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground shadow-inner-soft placeholder:text-foreground-muted/80 transition duration-app-fast ease-app-emphasized hover:border-outline-variant focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-app-xl border border-outline-variant/50 bg-surface/98 p-1 shadow-float backdrop-blur-md">
                                {searchLoading ? (
                                    <div className="p-4 text-center text-foreground-muted">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
                                        <p className="mt-2">Đang tìm kiếm...</p>
                                    </div>
                                ) : searchError ? (
                                    <div className="p-4 text-center text-sm text-app-error">
                                        {searchError}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="divide-y divide-outline-variant/40">
                                        {searchResults.map((result) => (
                                            <button
                                                key={`${result.type}-${result.id}`}
                                                onClick={() => {
                                                    if (result.type === 'post') {
                                                        router.push(`/posts/${result.id}`)
                                                    } else {
                                                        router.push(`/profile/${result.id}`)
                                                    }
                                                    setShowSearchResults(false)
                                                    setSearchQuery('')
                                                }}
                                                className="flex w-full items-center space-x-3 p-3 text-left transition-colors duration-app-fast hover:bg-brand-tint/70"
                                            >
                                                <div className="flex-shrink-0">
                                                    {result.avatarUrl ? (
                                                        <img
                                                            src={result.avatarUrl}
                                                            alt={result.title}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
                                                            {(result.title || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {result.title}
                                                    </p>
                                                    <p className="text-xs text-foreground-muted">
                                                        {result.subtitle || (result.type === 'post' ? 'Bài đăng' : 'Thợ')}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-foreground-muted">
                                        Không tìm thấy kết quả
                                    </div>
                                )}
                            </div>
                        )}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 md:gap-2">
                    {/* Notifications */}
                    <div className="relative notification-menu">
                        <button
                            type="button"
                            onClick={() => setShowNotificationMenu((prev) => !prev)}
                            className="relative rounded-app-xl p-2.5 text-foreground-muted transition-all duration-app-fast hover:bg-brand-tint/60 hover:text-brand-dark hover:shadow-sm"
                            aria-label="Mở thông báo"
                            aria-expanded={showNotificationMenu}
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadNotificationCount > 0 && (
                                <span className="absolute right-0 top-0 inline-flex h-[22px] min-w-[22px] translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-app-error px-1.5 text-xs font-bold leading-none text-white shadow-sm">
                                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                                </span>
                            )}
                        </button>

                        {showNotificationMenu && (
                            <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-1rem)] rounded-[24px] border border-teal-500/30 bg-gradient-to-r from-teal-600 to-cyan-600 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
                                <div className="flex items-start justify-between gap-3 border-b border-white/30 px-4 py-3">
                                    <div>
                                        <p className="text-base font-semibold text-white">Thông báo</p>
                                        <p className="text-xs text-white/80">
                                            {visibleNotificationUnreadCount > 0
                                                ? `${visibleNotificationUnreadCount} thông báo chưa đọc`
                                                : 'Không có thông báo chưa đọc'}
                                        </p>
                                    </div>
                                    <Link
                                        href="/thong-bao"
                                        onClick={() => setShowNotificationMenu(false)}
                                        className="rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                                    >
                                        Xem tất cả
                                    </Link>
                                </div>

                                <div className="flex gap-1 border-b border-white/30 px-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setNotificationFilter('all')}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${notificationFilter === 'all'
                                            ? 'bg-white text-teal-700'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNotificationFilter('unread')}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${notificationFilter === 'unread'
                                            ? 'bg-white text-teal-700'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        Chưa đọc
                                    </button>
                                </div>

                                <div className="max-h-[24rem] overflow-y-auto p-2">
                                    {notificationLoading ? (
                                        <div className="flex items-center justify-center px-4 py-10 text-sm text-white/80">
                                            Đang tải thông báo...
                                        </div>
                                    ) : notificationError ? (
                                        <div className="px-4 py-6 text-center text-sm text-white/90">
                                            {notificationError}
                                        </div>
                                    ) : filteredNotificationItems.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {filteredNotificationItems.map((notification) => (
                                                <button
                                                    key={notification.id}
                                                    type="button"
                                                    onClick={() => void handleNotificationClick(notification)}
                                                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-all duration-app-fast hover:shadow-sm ${notification.isRead
                                                        ? 'border-transparent bg-white/10 hover:border-white/30 hover:bg-white/20'
                                                        : 'border-white/30 bg-white/20 hover:border-white/40 hover:bg-white/30'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notification.isRead ? 'bg-white/20' : 'bg-white/30'}`}>
                                                            <span className="text-lg leading-none">
                                                                {getNotificationIcon(notification.type)}
                                                            </span>
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start gap-2">
                                                                {!notification.isRead && (
                                                                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-sm" />
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-semibold text-white">
                                                                        {notification.title}
                                                                    </p>
                                                                    <p className="mt-0.5 line-clamp-2 text-sm text-white/80">
                                                                        {notification.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/70">
                                                                <span>{formatTime(notification.createdAt)}</span>
                                                                <span className="font-medium text-white/90">
                                                                    Bấm để mở
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-10 text-center text-sm text-white/80">
                                            {notificationFilter === 'unread'
                                                ? 'Không có thông báo chưa đọc'
                                                : 'Chưa có thông báo nào'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="relative message-menu">
                        <Link
                            href="/tin-nhan"
                            className="relative rounded-app-xl p-2.5 text-foreground-muted transition-all duration-app-fast hover:bg-brand-tint/60 hover:text-brand-dark hover:shadow-sm inline-flex"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {unreadMessageCount > 0 && (
                                <span className="absolute right-0 top-0 inline-flex h-[22px] min-w-[22px] translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-app-error px-1.5 text-xs font-bold leading-none text-white shadow-sm">
                                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Profile Menu */}
                    <div className="relative profile-menu">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 rounded-full border border-[#28c7c1]/80 bg-white px-2 py-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all duration-app-fast hover:border-[#18b7b0] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                        >
                            {normalizeImageUrl(currentUser?.avatarUrl || currentUser?.avatar) && !avatarError ? (
                                <img
                                    src={normalizeImageUrl(currentUser.avatarUrl || currentUser.avatar)}
                                    alt="Avatar"
                                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white ring-2 ring-white">
                                    {(currentUser?.displayName || currentUser?.fullName || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <svg className={`h-4 w-4 text-slate-500 transition-transform duration-app-medium ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showProfileMenu && (
                            <div className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-[24px] border border-teal-500/30 bg-gradient-to-r from-teal-600 to-cyan-600 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
                                <Link href="/profile" className={profileMenuItemClass} onClick={() => setShowProfileMenu(false)}>
                                    <FontAwesomeIcon icon={faUser} className={profileMenuIconClass} />
                                    <span>Trang cá nhân</span>
                                </Link>
                                {isWorker ? (
                                    <>
                                        <Link href="/gio-hang" className={profileMenuItemClass} onClick={() => setShowProfileMenu(false)}>
                                            <FontAwesomeIcon icon={faComments} className={profileMenuIconClass} />
                                            <span>Chào giá của tôi</span>
                                        </Link>
                                        <Link href="/danh-gia-ve-toi" className={profileMenuItemClass} onClick={() => setShowProfileMenu(false)}>
                                            <FontAwesomeIcon icon={faStar} className={profileMenuIconClass} />
                                            <span>Đánh giá về tôi</span>
                                        </Link>
                                        <Link href="/subscription" className={profileMenuItemClass} onClick={() => setShowProfileMenu(false)}>
                                            <FontAwesomeIcon icon={faBoxOpen} className={profileMenuIconClass} />
                                            <span>Gói của bạn</span>
                                        </Link>
                                    </>
                                ) : (
                                    <Link href="/bai-dang-cua-toi" className={profileMenuItemClass} onClick={() => setShowProfileMenu(false)}>
                                        <FontAwesomeIcon icon={faFileLines} className={profileMenuIconClass} />
                                        <span>Bài đăng của tôi</span>
                                    </Link>
                                )}
                                <Link href="/da-luu" className={profileMenuItemClass} onClick={() => setShowProfileMenu(false)}>
                                    <FontAwesomeIcon icon={faBookmark} className={profileMenuIconClass} />
                                    <span>Đã lưu</span>
                                </Link>
                                <hr className={profileMenuDividerClass} />
                                <button
                                    onClick={async () => {
                                        await AuthService.logout()
                                        router.push('/dang-nhap')
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/20"
                                >
                                    <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4 shrink-0" />
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
