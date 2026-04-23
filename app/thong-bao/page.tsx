'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import { AuthService } from '@/lib/api/auth.service'
import { notificationService, type Notification } from '@/lib/api/notification.service'
import { notificationSocketService } from '@/lib/api/notification-socket.service'
import { quoteService, type Quote } from '@/lib/api/quote.service'
import { ProfileService } from '@/lib/api/profile.service'

export default function ThongBaoPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Modal state cho báo giá
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])

  const emitNotificationUnreadCountChanged = (count: number) => {
    const next = Math.max(0, Number(count) || 0)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('notification_unread_count', String(next))
      window.dispatchEvent(new CustomEvent('notification:unread-count-changed', {
        detail: {}
      }))
    }
  }

  const isMessageNotification = (notification: Partial<Notification>) => {
    const type = String(notification.type || '').toLowerCase()
    const title = String((notification as any).title || '').toLowerCase()
    const message = String((notification as any).message || '').toLowerCase()
    const actionUrl = String((notification as any).actionUrl || '').toLowerCase()

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

  const isQuoteNotification = (notification: Partial<Notification>) => {
    const type = String(notification.type || '').toLowerCase()
    const title = String((notification as any).title || '').toLowerCase()
    const message = String((notification as any).message || '').toLowerCase()

    return (
      type.includes('quote') ||
      type.includes('bao_gia') ||
      title.includes('báo giá') ||
      message.includes('báo giá')
    )
  }

  useEffect(() => {
    const token = AuthService.getToken()
    if (!token) {
      router.push('/dang-nhap')
      return
    }

    fetchNotifications()
    fetchUnreadCount()

    // Kết nối socket để nhận notifications real-time
    notificationSocketService.connect()

    // Lắng nghe notification mới
    const unsubscribeNew = notificationSocketService.on('notification:new', (notification: Notification) => {
      console.log('🔔 Received new notification via socket:', notification)

      // Tin nhắn được hiển thị ở khu vực tin nhắn, không hiển thị trong danh sách thông báo
      if (isMessageNotification(notification)) {
        return
      }

      // Thêm notification mới vào đầu danh sách, tránh duplicate theo id
      setNotifications(prev => {
        const exists = prev.some(item => item.id === notification.id)
        if (exists) {
          return prev.map(item => (item.id === notification.id ? notification : item))
        }
        return [notification, ...prev]
      })

      // Tăng unread count nếu notification chưa đọc
      if (!notification.isRead) {
        setUnreadCount(prev => {
          const next = prev + 1
          emitNotificationUnreadCountChanged(next)
          return next
        })
      }

      // Hiển thị browser notification (nếu được phép)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        })
      }
    })

    // Lắng nghe khi notification được đánh dấu đã đọc
    const unsubscribeRead = notificationSocketService.on('notification:read', (data: { notificationId: string }) => {
      console.log('✓ Notification marked as read via socket:', data.notificationId)

      let shouldDecreaseUnread = false
      setNotifications(prev =>
        prev.map(notif => {
          if (notif.id === data.notificationId && !notif.isRead) {
            shouldDecreaseUnread = true
            return { ...notif, isRead: true }
          }
          return notif
        })
      )

      if (shouldDecreaseUnread) {
        setUnreadCount(prev => {
          const next = Math.max(0, prev - 1)
          emitNotificationUnreadCountChanged(next)
          return next
        })
      }
    })

    // Lắng nghe khi tất cả notification được đánh dấu đã đọc
    const unsubscribeAllRead = notificationSocketService.on('notification:all_read', () => {
      console.log('✓ All notifications marked as read via socket')

      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      setUnreadCount(0)
      emitNotificationUnreadCountChanged(0)
    })

    // Yêu cầu quyền browser notification
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Browser notification permission:', permission)
      })
    }

    // Cleanup
    return () => {
      unsubscribeNew()
      unsubscribeRead()
      unsubscribeAllRead()
      // Không disconnect socket ở đây vì có thể dùng ở trang khác
    }
  }, [router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications({ limit: 50 })
      console.log('📬 Notifications response:', response)

      // Backend chuẩn: { notifications, total, unreadCount }
      const notificationsArray = Array.isArray(response.notifications)
        ? response.notifications.filter(notif => !isMessageNotification(notif))
        : []

      setNotifications(notificationsArray)
      const unread = notificationsArray.filter(notif => !notif.isRead).length
      setUnreadCount(unread)
      emitNotificationUnreadCountChanged(unread)
    } catch (err: any) {
      console.error('❌ Error fetching notifications:', err)
      setError('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getNotifications({ limit: 100, unreadOnly: true })
      const unreadNonMessage = Array.isArray(response.notifications)
        ? response.notifications.filter(notif => !notif.isRead && !isMessageNotification(notif)).length
        : 0
      setUnreadCount(unreadNonMessage)
      emitNotificationUnreadCountChanged(unreadNonMessage)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      let wasUnread = false
      setNotifications(prev =>
        prev.map(notif => {
          if (notif.id === notificationId) {
            if (!notif.isRead) {
              wasUnread = true
            }
            return { ...notif, isRead: true }
          }
          return notif
        })
      )

      if (wasUnread) {
        setUnreadCount(prev => {
          const next = Math.max(0, prev - 1)
          emitNotificationUnreadCountChanged(next)
          return next
        })
      }

      // Sync hard with server to handle out-of-order socket events
      fetchUnreadCount()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      setUnreadCount(0)
      emitNotificationUnreadCountChanged(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      fetchUnreadCount()
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const handleDeleteAllRead = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả thông báo đã đọc?')) return

    try {
      await notificationService.deleteReadNotifications()
      setNotifications(prev => prev.filter(notif => !notif.isRead))
    } catch (err) {
      console.error('Error deleting read notifications:', err)
    }
  }

  // Chuyển đến trang chi tiết bài đăng khi click vào thông báo chào giá
  const handleViewQuoteNotification = async (notification: Notification) => {
    console.log('=== CLICK NOTIFICATION ===')
    console.log('🔍 Type:', notification.type)
    console.log('🔍 Title:', notification.title)
    console.log('🔍 Message:', notification.message)
    console.log('🔍 Data object:', (notification as any).data)
    console.log('🔍 Metadata object:', (notification as any).metadata)

    // Đánh dấu đã đọc
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }

    // Backend gửi data trong field "metadata", KHÔNG phải "data"
    const metadata = (notification as any).metadata || (notification as any).data

    let postId = null

    if (metadata) {
      console.log('🔍 Found metadata/data:', metadata)

      // Lấy postId từ metadata
      postId = metadata.postId || metadata.post_id || metadata.postID

      console.log('🔍 Extracted postId:', postId)
    } else {
      console.warn('⚠️ notification.metadata và notification.data đều null/undefined')
    }

    if (!postId) {
      console.error('❌ KHÔNG TÌM THẤY postId trong notification')
      alert(
        '⚠️ Thông báo thiếu thông tin bài đăng.\n\n' +
        'Vui lòng vào "Bài đăng của tôi" để xem tất cả báo giá.'
      )
      router.push('/bai-dang-cua-toi')
      return
    }

    console.log('✅ PostId found:', postId)

    // Chuyển đến trang chi tiết bài đăng
    router.push(`/posts/${postId}`)
  }

  const handleNotificationClick = async (notification: Notification) => {
    const shouldNavigateToQuote = isQuoteNotification(notification)
    const actionUrl = String((notification as any).actionUrl || '').trim()
    const needsMarkAsRead = !notification.isRead

    if (needsMarkAsRead && !shouldNavigateToQuote) {
      await handleMarkAsRead(notification.id)
    }

    if (shouldNavigateToQuote) {
      await handleViewQuoteNotification(notification)
      return
    }

    if (actionUrl) {
      router.push(actionUrl)
    }
  }

  // Chấp nhận báo giá và chuyển đến chat
  const handleAcceptQuote = async (quoteId: string) => {
    try {
      setQuoteLoading(true)
      console.log('📤 Accepting quote:', quoteId)

      const response = await quoteService.acceptQuoteForChat(quoteId)
      console.log('✅ Quote accepted, response:', response)

      // Backend trả về conversationId sau khi tạo conversation
      const conversationId = response.conversationId

      console.log('✅ ConversationId:', conversationId)

      // Đóng modal
      setShowQuoteModal(false)
      setSelectedQuote(null)

      // Thông báo thành công - Rõ ràng hơn
      const successMessage = conversationId
        ? '✅ Đã chấp nhận báo giá!\n\n🔔 Hệ thống đã gửi thông báo cho thợ\n💬 Đang chuyển đến phần chat...'
        : '✅ Đã chấp nhận báo giá!\n\n🔔 Thợ sẽ nhận được thông báo\n💬 Đang chuyển đến phần tin nhắn...'

      alert(successMessage)

      // Chuyển đến trang tin nhắn
      // Nếu có conversationId, có thể thêm query param để mở conversation cụ thể
      if (conversationId) {
        console.log('💬 Redirecting to conversation:', conversationId)
        router.push(`/tin-nhan?conversation=${conversationId}`)
      } else {
        console.log('💬 No conversationId, redirecting to tin-nhan page')
        router.push('/tin-nhan')
      }

    } catch (error: any) {
      console.error('❌ Error accepting quote:', error)
      alert(error.message || 'Không thể chấp nhận báo giá')
    } finally {
      setQuoteLoading(false)
    }
  }

  // Từ chối báo giá
  const handleRejectQuote = async (quoteId: string) => {
    const reason = prompt('Lý do từ chối (tùy chọn):')

    try {
      setQuoteLoading(true)
      await quoteService.rejectQuote(quoteId, reason || undefined)
      console.log('✅ Quote rejected')

      // Cập nhật quotes list
      setQuotes(prev => prev.map(q =>
        q.id === quoteId ? { ...q, status: 'REJECTED' } : q
      ))

      alert('Đã từ chối báo giá')
    } catch (error: any) {
      console.error('❌ Error rejecting quote:', error)
      alert(error.message || 'Không thể từ chối báo giá')
    } finally {
      setQuoteLoading(false)
    }
  }



  const visibleNotifications = (notifications || []).filter(notif => !isMessageNotification(notif))
  const visibleUnreadCount = visibleNotifications.filter(notif => !notif.isRead).length

  const filteredNotifications = visibleNotifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead
    return true
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return '💰'
      case 'order':
        return '📦'
      case 'message':
        return '💬'
      case 'post':
        return '📝'
      case 'review':
        return '⭐'
      case 'system':
        return '🔔'
      default:
        return '📢'
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông báo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Notifications Page Content */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">
                Thông báo {visibleUnreadCount > 0 && `(${visibleUnreadCount})`}
              </h1>
            </div>
            <div className="flex space-x-2">
              {visibleUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-orange-600 hover:text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-50"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button
                onClick={handleDeleteAllRead}
                className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Xóa đã đọc
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 px-1 ${filter === 'all'
                ? 'border-b-2 border-orange-500 text-orange-600 font-medium'
                : 'text-gray-600'
                }`}
            >
              Tất cả ({visibleNotifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 px-1 ${filter === 'unread'
                ? 'border-b-2 border-orange-500 text-orange-600 font-medium'
                : 'text-gray-600'
                }`}
            >
              Chưa đọc ({visibleUnreadCount})
            </button>
          </div>

          {/* Notifications Content */}
          <div className="max-w-4xl mx-auto px-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {(filteredNotifications?.length || 0) === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
                </h3>
                <p className="text-gray-500">
                  {filter === 'unread'
                    ? 'Bạn đã đọc tất cả thông báo'
                    : 'Các thông báo mới sẽ xuất hiện ở đây'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const quoteNotification = isQuoteNotification(notification)

                  // Debug: Log notification data
                  console.log('🔍 Notification type:', notification.type)
                  console.log('🔍 Is quote notification:', quoteNotification)
                  console.log('🔍 Notification data:', (notification as any).data)

                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        console.log('👆 Clicked notification:', notification)
                        void handleNotificationClick(notification)
                      }}
                      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${!notification.isRead ? 'border-l-4 border-orange-500' : ''
                        } cursor-pointer`}
                    >
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatTime(notification.createdAt)}
                                </p>

                                {/* Hiển thị hint cho notification báo giá */}
                                {quoteNotification && (
                                  <p className="mt-2 text-xs text-blue-600 font-medium">
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkAsRead(notification.id)
                                    }}
                                    className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                    title="Đánh dấu đã đọc"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteNotification(notification.id)
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Xóa thông báo"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Báo Giá */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => {
          setShowQuoteModal(false)
          setSelectedQuote(null)
          setQuotes([])
        }}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div>
                <h2 className="text-xl font-bold">💼 Thông tin báo giá</h2>
                <p className="text-sm text-orange-100 mt-1">Xem và quyết định chấp nhận hay từ chối</p>
              </div>
              <button
                onClick={() => {
                  setShowQuoteModal(false)
                  setSelectedQuote(null)
                  setQuotes([])
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {quoteLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Đang tải báo giá...</p>
                </div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600 font-medium">Không tìm thấy báo giá</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-bold">💡 Lưu ý:</span> Sau khi chấp nhận báo giá, bạn có thể trò chuyện với thợ trong mục &quot;Tin nhắn&quot;
                    </p>
                  </div>
                  {quotes.map((quote) => {
                    console.log('📋 Quote item:', quote)
                    console.log('📋 Quote status:', quote.status)
                    console.log('📋 Provider info from API:', quote.providerName)

                    // Normalize status (backend trả về 'pending' chữ thường)
                    const normalizedStatus = quote.status?.toUpperCase() || 'PENDING'

                    // Tên thợ đã được load từ API getUserProfile
                    const providerName = quote.providerName || 'Thợ (chưa có tên)'
                    const providerAvatar = quote.providerAvatar || null
                    const providerEmail = (quote as any).providerEmail || null
                    const providerPhone = (quote as any).providerPhone || null

                    console.log('✅ Final provider name:', providerName)
                    console.log('✅ Provider contact:', providerEmail, providerPhone)

                    return (
                      <div
                        key={quote.id}
                        className={`border-2 rounded-lg p-4 ${normalizedStatus === 'PENDING'
                          ? 'border-blue-400 bg-blue-50'
                          : normalizedStatus === 'ACCEPTED' || normalizedStatus === 'IN_CHAT'
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-300 bg-gray-50'
                          }`}
                      >
                        {/* Thông tin thợ */}
                        <div className="flex items-center gap-3 mb-4 bg-white rounded-lg p-3 shadow-sm">
                          {providerAvatar ? (
                            <img
                              src={providerAvatar}
                              alt={providerName}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ring-2 ring-orange-200">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{providerName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${normalizedStatus === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                                normalizedStatus === 'ACCEPTED' || normalizedStatus === 'IN_CHAT' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                {normalizedStatus === 'PENDING' && '⏳ Đang chờ xác nhận'}
                                {normalizedStatus === 'ACCEPTED' && '✅ Đã chấp nhận'}
                                {normalizedStatus === 'IN_CHAT' && '💬 Đang trò chuyện'}
                                {normalizedStatus === 'REJECTED' && '❌ Đã từ chối'}
                                {!quote.status && '⏳ Chưa xác nhận'}
                              </span>
                            </div>

                            {/* Thông tin liên hệ của thợ */}
                            {(providerEmail || providerPhone) && (
                              <div className="mt-2 pt-2 border-t border-orange-100 space-y-1">
                                {providerEmail && (
                                  <p className="text-xs text-gray-600">
                                    📧 {providerEmail}
                                  </p>
                                )}
                                {providerPhone && (
                                  <p className="text-xs text-gray-600">
                                    📞 {providerPhone}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chi tiết báo giá */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Giá:</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {parseFloat(quote.price.toString()).toLocaleString('vi-VN')}đ
                            </p>
                          </div>

                          {quote.estimatedDuration && (
                            <div>
                              <p className="text-sm text-gray-600">Thời gian ước tính:</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {quote.estimatedDuration} phút
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-gray-600 mb-1">Mô tả:</p>
                            <p className="text-gray-900">{quote.description}</p>
                          </div>

                          <div className="text-xs text-gray-500">
                            Gửi lúc: {new Date(quote.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        {/* Actions - Làm nổi bật hơn */}
                        {(normalizedStatus === 'PENDING' || !quote.status) && (
                          <div className="mt-6 pt-4 border-t-2 border-orange-200 bg-orange-50/50 rounded-b-lg p-4 -mx-4 -mb-4">
                            <p className="text-sm text-gray-700 mb-3 font-bold text-center">
                              👇 Bạn muốn làm gì với báo giá này? 👇
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAcceptQuote(quote.id)
                                }}
                                disabled={quoteLoading}
                                className="flex-1 bg-green-500 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-2xl">✅</span>
                                  <span>Chấp nhận</span>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRejectQuote(quote.id)
                                }}
                                disabled={quoteLoading}
                                className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-2xl">❌</span>
                                  <span>Từ chối</span>
                                </div>
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-3">
                              Chấp nhận để mở chat với thợ, hoặc từ chối nếu không phù hợp
                            </p>
                          </div>
                        )}

                        {(normalizedStatus === 'ACCEPTED' || normalizedStatus === 'IN_CHAT') && (
                          <div className="mt-4 bg-green-100 text-green-800 px-4 py-3 rounded-lg text-center font-medium">
                            ✅ Đã chấp nhận báo giá này. Bạn có thể nhắn tin với thợ trong mục &quot;Tin nhắn&quot;
                          </div>
                        )}

                        {normalizedStatus === 'REJECTED' && (
                          <div className="mt-4 bg-red-100 text-red-800 px-4 py-3 rounded-lg text-center font-medium">
                            ❌ Đã từ chối báo giá này
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            {!quoteLoading && quotes.length > 0 && (
              <div className="bg-gray-50 border-t px-6 py-4">
                <p className="text-xs text-gray-500 text-center mb-2">
                  Tổng số báo giá: <span className="font-bold">{quotes.length}</span>
                </p>
                <button
                  onClick={() => {
                    setShowQuoteModal(false)
                    setSelectedQuote(null)
                    setQuotes([])
                  }}
                  className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
