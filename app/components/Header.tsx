'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/api/auth.service'
import { notificationService } from '@/lib/api/notification.service'
import { chatService } from '@/lib/api/chat.service'
import { notificationSocketService } from '@/lib/api/notification-socket.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { SearchService } from '@/lib/api/search.service'
import ThoTotLogo from '@/app/components/ThoTotLogo'

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
    const [showMessageMenu, setShowMessageMenu] = useState(false)
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
    const [unreadMessageCount, setUnreadMessageCount] = useState(0)
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

    const navButtonClass = (targetPath: string) => {
        const isActive = pathname === targetPath
        return `p-2.5 rounded-xl transition ${isActive
            ? 'text-cyan-700 bg-cyan-100 ring-1 ring-cyan-200'
            : 'text-slate-600 hover:text-cyan-700 hover:bg-cyan-50'
            }`
    }

    const normalizeImageUrl = (rawUrl?: string | null) => {
        if (!rawUrl) return ''
        const cleanUrl = rawUrl.trim()
        if (!cleanUrl) return ''

        if (/^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('data:')) {
            return cleanUrl
        }

        const apiDomain = (process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '')
        if (!apiDomain) return cleanUrl

        if (cleanUrl.startsWith('/')) {
            return `${apiDomain}${cleanUrl}`
        }

        return `${apiDomain}/${cleanUrl}`
    }

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
            }
        })

        const unsubscribeNotifRead = notificationSocketService.on('notification:read', () => {
            void loadUnreadNotificationCount()
        })

        const unsubscribeNotifAllRead = notificationSocketService.on('notification:all_read', () => {
            setUnreadNotificationCountSynced(0)
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
            window.removeEventListener('chat:refresh-unread-count', handleChatRefresh as EventListener)
            window.removeEventListener('focus', handleWindowFocus)
            clearInterval(interval)
        }
    }, [currentUser?.id, currentUser?.accountType, currentUser?.role])

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
            if (!target.closest('.message-menu')) {
                setShowMessageMenu(false)
            }
            if (!target.closest('.profile-menu')) {
                setShowProfileMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="sticky top-0 z-40 px-4 py-2 border-b border-cyan-200/80 bg-gradient-to-r from-cyan-50/90 via-sky-50/85 to-cyan-100/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(14,165,183,0.12)] page-enter">
            <div className="flex items-center gap-3">
                {/* Left: Logo and Search Container */}
                <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => router.push('/home')}
                            className="hover:opacity-80 transition"
                        >
                            <ThoTotLogo className="w-20" />
                        </button>
                    </div>

                    {/* Search Container */}
                    <div className="relative search-container w-96 hover-lift">
                        <svg className="absolute left-3 top-2.5 w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-cyan-100 rounded-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-300 transition"
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 border border-cyan-100 rounded-xl shadow-xl shadow-cyan-900/10 max-h-96 overflow-y-auto z-50 backdrop-blur-sm glass-surface">
                                {searchLoading ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                                        <p className="mt-2">Đang tìm kiếm...</p>
                                    </div>
                                ) : searchError ? (
                                    <div className="p-4 text-center text-rose-600 text-sm">
                                        {searchError}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
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
                                                className="w-full p-3 hover:bg-cyan-50/60 flex items-center space-x-3 text-left transition"
                                            >
                                                <div className="flex-shrink-0">
                                                    {result.avatarUrl ? (
                                                        <img
                                                            src={result.avatarUrl}
                                                            alt={result.title}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                                            {(result.title || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                        {result.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {result.subtitle || (result.type === 'post' ? 'Bài đăng' : 'Thợ')}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        Không tìm thấy kết quả
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Navigation Icons */}
                <div className="flex items-center justify-center gap-8 flex-1">
                    {/* Home */}
                    <Link
                        href="/home"
                        className={navButtonClass('/home')}
                        title="Trang chủ"
                        aria-label="Trang chủ"
                    >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                    </Link>

                    {/* Quick Access */}
                    <Link
                        href={quickAccessPath}
                        className={navButtonClass(quickAccessPath)}
                        title={isWorker ? 'Chào giá của tôi' : 'Bài đăng của tôi'}
                        aria-label={isWorker ? 'Chào giá của tôi' : 'Bài đăng của tôi'}
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Link>

                    {/* Orders & Schedule */}
                    <Link
                        href={schedulePath}
                        className={navButtonClass(schedulePath)}
                        title="Đơn hàng"
                        aria-label="Đơn hàng"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </Link>
                </div>

                {/* Right: Header Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Notifications */}
                    <Link
                        href="/thong-bao"
                        className="relative p-2.5 text-slate-600 hover:bg-cyan-50 rounded-xl transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadNotificationCount > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-rose-500 to-orange-400 rounded-full shadow-sm">
                                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                            </span>
                        )}
                    </Link>

                    {/* Messages */}
                    <div className="relative message-menu">
                        <button
                            onClick={() => setShowMessageMenu(!showMessageMenu)}
                            className="relative p-2.5 text-slate-600 hover:bg-cyan-50 rounded-xl transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {unreadMessageCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-rose-500 to-orange-400 rounded-full shadow-sm">
                                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                </span>
                            )}
                        </button>
                        {showMessageMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white/95 rounded-xl shadow-xl shadow-cyan-900/10 border border-cyan-100 p-2 z-50 backdrop-blur-sm glass-surface">
                                <Link href="/tin-nhan" className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 rounded-lg transition" onClick={() => setShowMessageMenu(false)}>
                                    Xem tin nhắn
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Profile Menu */}
                    <div className="relative profile-menu">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 p-1.5 hover:bg-cyan-50 rounded-xl transition"
                        >
                            {(currentUser?.avatarUrl || currentUser?.avatar) && !avatarError ? (
                                <img
                                    src={currentUser.avatarUrl || currentUser.avatar}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    {(currentUser?.displayName || currentUser?.fullName || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <svg className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white/95 rounded-xl shadow-xl shadow-cyan-900/10 border border-cyan-100 py-2 z-50 backdrop-blur-sm glass-surface">
                                <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 transition" onClick={() => setShowProfileMenu(false)}>
                                    👤 Trang cá nhân
                                </Link>
                                <Link href="/bai-dang-cua-toi" className="block px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 transition" onClick={() => setShowProfileMenu(false)}>
                                    📝 Bài đăng của tôi
                                </Link>
                                <Link href="/da-luu" className="block px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 transition" onClick={() => setShowProfileMenu(false)}>
                                    💾 Đã lưu
                                </Link>
                                <hr className="my-2" />
                                <button
                                    onClick={async () => {
                                        await AuthService.logout()
                                        router.push('/dang-nhap')
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                                >
                                    🚪 Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
