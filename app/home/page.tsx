'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/app/components/Header'
import { AuthService } from '@/lib/api/auth.service'
import { PostService } from '@/lib/api/post.service'
import { ProfileService } from '@/lib/api/profile.service'
import { chatService } from '@/lib/api/chat.service'
import { notificationService } from '@/lib/api/notification.service'
import { socketService } from '@/lib/api/socket.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { savedPostService } from '@/lib/api/saved-post.service'
import SkeletonPost from '@/app/components/SkeletonPost'

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postLoading, setPostLoading] = useState(false)
  const [postError, setPostError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCategories, setShowCategories] = useState(true)
  const [showServices, setShowServices] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set())
  const [savingPostIds, setSavingPostIds] = useState<Set<string>>(new Set())

  const resetCreatePostForm = () => {
    setPostContent('')
    setPostTitle('')
    setPostError('')
  }

  const handleCancelCreatePost = () => {
    if (postLoading) return

    const hasDraft = postTitle.trim() || postContent.trim()
    if (hasDraft && !confirm('Bạn có chắc muốn hủy đăng bài? Nội dung đã nhập sẽ bị mất.')) {
      return
    }

    resetCreatePostForm()
    setShowCreatePost(false)
  }

  // Search states
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

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

  // Load số thông báo và tin nhắn chưa đọc
  const loadUnreadCounts = async () => {
    try {
      const [notificationCount, messageData] = await Promise.all([
        notificationService.getUnreadCount().catch(() => 0),
        chatService.getUnreadCount().catch(() => ({ unreadCount: 0 }))
      ])

      setUnreadNotificationCount(notificationCount)
      setUnreadMessageCount(messageData.unreadCount || 0)
    } catch (error) {
      console.error('❌ Lỗi load số chưa đọc:', error)
    }
  }

  // Load bài đăng từ API
  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      const response = await PostService.getFeed({ limit: 20 })

      // Response type là FeedResponseDto: { data: PostResponseDto[], nextCursor?, total, hasMore }
      if (response.data && Array.isArray(response.data)) {
        setPosts(response.data)
      } else {
        console.warn('⚠️ Không có bài đăng nào')
        setPosts([])
      }
    } catch (error) {
      console.error('❌ Lỗi load bài đăng:', error)
      setPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }

  // Tìm kiếm profiles
  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      setShowSearchResults(true)

      // Tìm kiếm cả WORKER và CUSTOMER
      const response = await ProfileService.searchProfiles({
        q: query.trim(),
        limit: 10,
        sortBy: 'rating',
        order: 'desc'
      })

      setSearchResults(response.data || [])
    } catch (error) {
      console.error('❌ Lỗi tìm kiếm:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Đóng kết quả tìm kiếm khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Kiểm tra authentication khi component mount
  useEffect(() => {
    let isCancelled = false
    let unsubscribeNew = () => {}
    let unsubscribeRead = () => {}
    let unsubscribeAllRead = () => {}
    let unsubscribeChatNewMessage = () => {}
    let unsubscribeChatConnected = () => {}
    let unsubscribeChatUnread = () => {}

    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        // Chưa đăng nhập, chuyển về trang đăng nhập
        router.push('/dang-nhap')
        return
      }

      // Load thông tin user từ API
      try {
        const userData = await ProfileService.getMyProfile()
        if (!isCancelled) {
          setCurrentUser(mapUserWithAvatar(userData))
          setAvatarLoadError(false)
        }
      } catch (error) {
        console.error('❌ Không thể load thông tin user:', error)

        const message =
          error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
        const isAuthError =
          message.includes('401') ||
          message.includes('unauthorized') ||
          message.includes('đăng nhập') ||
          message.includes('hết hạn')

        if (isAuthError) {
          AuthService.handleTokenExpired()
          return
        }
      }

      if (isCancelled) return

      setIsLoading(false)
      // Load bài đăng và số chưa đọc
      await loadPosts()
      await loadUnreadCounts()

      if (isCancelled) return

      // Kết nối socket để nhận cập nhật real-time cho badge numbers
      socketService.connect()
      chatSocketService.connect()

      // ===== NOTIFICATION SOCKET EVENTS =====
      unsubscribeNew = socketService.on('notification:new', (notification: any) => {
        console.log('🔔 [Home] Nhận thông báo mới:', notification)
        void loadUnreadCounts()

        // Hiển thị browser notification
        if (Notification.permission === 'granted') {
          new Notification('Thông báo mới', {
            body: notification.message || 'Bạn có thông báo mới',
            icon: '/logo.png'
          })
        }
      })

      unsubscribeRead = socketService.on('notification:read', ({ notificationId }: any) => {
        console.log('✅ [Home] Thông báo đã đọc:', notificationId)
        void loadUnreadCounts()
      })

      unsubscribeAllRead = socketService.on('notification:all_read', () => {
        console.log('✅ [Home] Tất cả thông báo đã đọc')
        void loadUnreadCounts()
      })

      // ===== CHAT SOCKET EVENTS =====
      unsubscribeChatNewMessage = chatSocketService.on('new_message', (data: any) => {
        console.log('💬 [Home] Tin nhắn mới:', data)
        void loadUnreadCounts()
      })

      unsubscribeChatConnected = chatSocketService.on('connected', (data: { userId: string; unreadCount: number }) => {
        console.log('💬 [Home] Chat connected:', data)
        void loadUnreadCounts()
      })

      unsubscribeChatUnread = chatSocketService.on('unread_updated', (data: { conversationId: string; increment: number }) => {
        console.log('💬 [Home] Chat unread updated:', data)
        void loadUnreadCounts()
      })

      // Yêu cầu quyền hiển thị browser notification
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Browser notification permission:', permission)
        })
      }
    }

    checkAuth()

    return () => {
      isCancelled = true
      unsubscribeNew()
      unsubscribeRead()
      unsubscribeAllRead()
      unsubscribeChatNewMessage()
      unsubscribeChatConnected()
      unsubscribeChatUnread()
      socketService.disconnect()
    }
  }, [router])

  // Dữ liệu mẫu cho danh sách lĩnh vực
  const categories = [
    { id: 'danang', name: 'Thợ Điện Đà Nẵng', icon: '⚡' },
    { id: 'uytin', name: 'Thợ Sen Uy Tín', icon: '🔧' },
    { id: 'chuyennghiep', name: 'Thợ Mộc Chuyên Nghiệp', icon: '🔨' }
  ]

  const services = [
    { id: 'dien', name: 'Sửa chữa điện', icon: '⚡', color: 'text-orange-500' },
    { id: 'sen', name: 'Thợ sen', icon: '🔧', color: 'text-blue-500' },
    { id: 'moc', name: 'Thợ mộc', icon: '🔨', color: 'text-yellow-600' },
    { id: 'dieuhoa', name: 'Sửa điều hòa', icon: '❄️', color: 'text-cyan-500' },
    { id: 'nha', name: 'Vệ sinh nhà cửa', icon: '🧹', color: 'text-green-500' }
  ]

  // Không còn dữ liệu giả - chỉ dùng dữ liệu thật từ API

  // Handlers cho post actions
  const handleClosePost = async (postId: string) => {
    if (!confirm('Bạn có chắc muốn đóng bài đăng này?')) return

    try {
      await PostService.closePost(postId)
      alert('Đóng bài đăng thành công!')
      await loadPosts() // Reload posts
      setOpenMenuId(null)
    } catch (error: any) {
      console.error('Error closing post:', error)
      alert(error.message || 'Không thể đóng bài đăng')
    }
  }

  const handleEditPost = (postId: string) => {
    router.push(`/posts/create?edit=${postId}`)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài đăng này? Hành động này không thể hoàn tác!')) return

    try {
      await PostService.deletePost(postId)
      alert('Xóa bài đăng thành công!')
      await loadPosts() // Reload posts
      setOpenMenuId(null)
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(error.message || 'Không thể xóa bài đăng')
    }
  }

  // Nhắn tin với người đăng bài
  const handleSendMessageToAuthor = async (post: any) => {
    const authorId = post.customerId || post.customer?.id

    if (!authorId) {
      alert('Không thể xác định người đăng bài')
      return
    }

    if (currentUser && authorId === currentUser.id) {
      alert('Bạn không thể nhắn tin với chính mình')
      return
    }
    try {
      // Tạo hoặc mở cuộc trò chuyện (providerId not workerId - match backend API)
      await chatService.createDirectConversation({ providerId: authorId })
      // Chuyển đến trang tin nhắn
      router.push('/tin-nhan')
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      alert(error.message || 'Không thể tạo cuộc trò chuyện')
    }
  }

  const isWorkerRole = () => {
    const userRole = String(currentUser?.accountType || currentUser?.role || '').toUpperCase()
    return userRole === 'WORKER' || userRole === 'PROVIDER'
  }

  const loadSavedStatuses = async (postList: any[]) => {
    if (!isWorkerRole() || postList.length === 0) {
      setSavedPostIds(new Set())
      return
    }

    try {
      const statuses = await Promise.all(
        postList.map(async (post) => {
          const postId = post?.id
          if (!postId) return { postId: '', saved: false }
          const saved = await savedPostService.getSavedStatus(String(postId)).catch(() => false)
          return { postId: String(postId), saved }
        })
      )

      const nextSavedPostIds = new Set(
        statuses.filter((item) => item.saved && item.postId).map((item) => item.postId)
      )

      setSavedPostIds(nextSavedPostIds)
    } catch (error) {
      console.error('❌ Lỗi tải trạng thái bài đã lưu:', error)
      setSavedPostIds(new Set())
    }
  }

  const handleToggleSavePost = async (postId: string) => {
    if (!postId || savingPostIds.has(postId)) return

    const isSaved = savedPostIds.has(postId)
    setSavingPostIds((prev) => new Set(prev).add(postId))

    try {
      if (isSaved) {
        await savedPostService.unsavePost(postId)
        setSavedPostIds((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
      } else {
        await savedPostService.savePost(postId)
        setSavedPostIds((prev) => new Set(prev).add(postId))
      }
    } catch (error: any) {
      console.error('❌ Lỗi lưu/bỏ lưu bài đăng:', error)
      alert(error?.message || 'Không thể lưu bài đăng')
    } finally {
      setSavingPostIds((prev) => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  useEffect(() => {
    if (!currentUser || posts.length === 0) {
      setSavedPostIds(new Set())
      return
    }

    if (!isWorkerRole()) {
      setSavedPostIds(new Set())
      return
    }

    loadSavedStatuses(posts)
  }, [currentUser, posts])

  // Dữ liệu mẫu cho bài đăng (dùng khi không có API)
  const mockPosts = [
    {
      id: 1,
      author: 'Nguyễn Thị Mai',
      time: '8 giờ trước',
      location: 'Hải Châu, Đà Nẵng',
      title: 'Cần thợ sửa điện tại nhà nào. Mất điện toàn bộ đường Lê Duẩn. Ai sánh có thể đến ngay giúp em',
      status: 'Đăng',
      price: '200,000 - 300,000đ',
      urgent: true,
      comments: 8,
      shares: 2,
      likes: 8,
      avatar: '😊',
      avatarColor: 'from-yellow-400 to-orange-500',
      commentList: [
        {
          id: 1,
          author: 'Thợ Điện Minh',
          avatar: 'Đ',
          avatarBg: 'bg-blue-500',
          badge: 'THỢ',
          content: 'Chào chị, e chuyên sửa điện dân dụng 2 năm. Giờ nay có sánh, có thể kiểm tra và sửa được...',
          time: '1 giờ trước',
          likes: 8
        },
        {
          id: 2,
          author: 'Điện Lạnh Phát',
          avatar: 'Đ',
          avatarBg: 'bg-green-500',
          badge: 'THỢ',
          content: 'Em nhận sửa chữa điện tại nhà. Có kinh nghiệm...',
          time: '2 giờ trước',
          likes: 5
        }
      ]
    },
    {
      id: 2,
      author: 'Trần Văn Hùng',
      time: '3 giờ trước',
      location: 'Thanh Khê, Đà Nẵng',
      title: 'Cần thợ sửa ống nước bị rò rỉ gấp. Nước chảy từ tầng 2 xuống tầng 1. Nhà đang ngập nước, cần người đến ngay',
      status: 'Đăng',
      price: '150,000 - 250,000đ',
      urgent: true,
      comments: 12,
      shares: 1,
      likes: 15,
      avatar: '👨‍🔧',
      avatarColor: 'from-blue-400 to-blue-600',
      commentList: [
        {
          id: 1,
          author: 'Thợ Nước Toàn',
          avatar: 'N',
          avatarBg: 'bg-blue-600',
          badge: 'THỢ',
          content: 'Anh ơi, em là thợ nước chuyên nghiệp 5 năm kinh nghiệm. Giờ này em rảnh, có thể qua ngay ạ!',
          time: '2 giờ trước',
          likes: 10
        }
      ]
    },
    {
      id: 3,
      author: 'Lê Thị Hoa',
      time: '5 giờ trước',
      location: 'Sơn Trà, Đà Nẵng',
      title: 'Tìm thợ làm tủ bếp theo yêu cầu. Em có bản thiết kế sẵn rồi, cần thợ tư vấn và báo giá',
      status: 'Đăng',
      price: 'Thương lượng',
      urgent: false,
      comments: 6,
      shares: 3,
      likes: 12,
      avatar: '🏠',
      avatarColor: 'from-pink-400 to-pink-600',
      commentList: [
        {
          id: 1,
          author: 'Mộc Tâm',
          avatar: 'M',
          avatarBg: 'bg-yellow-600',
          badge: 'THỢ',
          content: 'Chào chị, em chuyên làm tủ bếp và nội thất gỗ. Có thể qua xem bản vẽ và báo giá cho chị ạ',
          time: '4 giờ trước',
          likes: 7
        }
      ]
    },
    {
      id: 4,
      author: 'Phạm Minh Tuấn',
      time: '6 giờ trước',
      location: 'Ngũ Hành Sơn, Đà Nẵng',
      title: 'Máy lạnh không lạnh, có tiếng kêu lạ. Cần thợ qua kiểm tra và sửa chữa. Máy Daikin 1.5HP dùng được 3 năm',
      status: 'Đăng',
      price: '200,000 - 400,000đ',
      urgent: false,
      comments: 9,
      shares: 2,
      likes: 10,
      avatar: '❄️',
      avatarColor: 'from-cyan-400 to-blue-500',
      commentList: [
        {
          id: 1,
          author: 'Điện Lạnh Hưng',
          avatar: 'H',
          avatarBg: 'bg-cyan-600',
          badge: 'THỢ',
          content: 'Anh cho em xin địa chỉ, em qua kiểm tra miễn phí. Chuyên sửa máy lạnh các hãng',
          time: '5 giờ trước',
          likes: 6
        }
      ]
    },
    {
      id: 5,
      author: 'Võ Thị Lan',
      time: '1 ngày trước',
      location: 'Cẩm Lệ, Đà Nẵng',
      title: 'Cần người vệ sinh nhà cửa tổng vệ sinh cuối năm. Nhà 2 tầng khoảng 120m2, cần lau dọn kỹ',
      status: 'Đang thực hiện',
      price: '500,000 - 700,000đ',
      urgent: false,
      comments: 15,
      shares: 5,
      likes: 20,
      avatar: '🧹',
      avatarColor: 'from-green-400 to-green-600',
      commentList: [
        {
          id: 1,
          author: 'Vệ Sinh Lan Anh',
          avatar: 'L',
          avatarBg: 'bg-green-600',
          badge: 'THỢ',
          content: 'Chị ơi, em nhận vệ sinh tổng vệ sinh nhà cửa, có đội ngũ 3 người làm nhanh và sạch ạ',
          time: '20 giờ trước',
          likes: 12
        }
      ]
    },
    {
      id: 6,
      author: 'Nguyễn Văn Bình',
      time: '1 ngày trước',
      location: 'Liên Chiểu, Đà Nẵng',
      title: 'Sửa cửa cuốn bị kẹt không lên xuống được. Cần thợ có kinh nghiệm đến sửa',
      status: 'Hoàn thành',
      price: '300,000đ',
      urgent: false,
      comments: 4,
      shares: 1,
      likes: 8,
      avatar: '🚪',
      avatarColor: 'from-gray-400 to-gray-600',
      commentList: []
    },
    {
      id: 7,
      author: 'Hoàng Thị Thu',
      time: '2 ngày trước',
      location: 'Hải Châu, Đà Nẵng',
      title: 'Tìm thợ sơn nhà trong và ngoài. Nhà 3 tầng, cần sơn lại toàn bộ. Ai có kinh nghiệm inbox báo giá nhé',
      status: 'Đăng',
      price: 'Thương lượng',
      urgent: false,
      comments: 18,
      shares: 8,
      likes: 25,
      avatar: '🎨',
      avatarColor: 'from-purple-400 to-purple-600',
      commentList: [
        {
          id: 1,
          author: 'Thợ Sơn Minh',
          avatar: 'S',
          avatarBg: 'bg-purple-600',
          badge: 'THỢ',
          content: 'Chị ơi em nhận sơn nhà, có đội thợ 5 người, làm nhanh và đẹp. Em qua xem nhà và báo giá cho chị nhé',
          time: '1 ngày trước',
          likes: 15
        },
        {
          id: 2,
          author: 'Sơn Đẹp Pro',
          avatar: 'P',
          avatarBg: 'bg-indigo-600',
          badge: 'THỢ',
          content: 'Em chuyên sơn nhà, sơn epoxy. Bảo hành 2 năm ạ',
          time: '1 ngày trước',
          likes: 8
        }
      ]
    },
    {
      id: 8,
      author: 'Đỗ Minh Châu',
      time: '2 ngày trước',
      location: 'Thanh Khê, Đà Nẵng',
      title: 'Cần thợ lắp camera an ninh cho cửa hàng. Cần lắp 4 camera, có hệ thống lưu trữ',
      status: 'Đăng',
      price: '2,000,000 - 3,000,000đ',
      urgent: true,
      comments: 11,
      shares: 3,
      likes: 14,
      avatar: '📹',
      avatarColor: 'from-red-400 to-red-600',
      commentList: [
        {
          id: 1,
          author: 'Kỹ Thuật Bảo An',
          avatar: 'K',
          avatarBg: 'bg-red-600',
          badge: 'THỢ',
          content: 'Anh ơi, em chuyên lắp đặt camera giám sát, có nhiều gói giá khác nhau. Em qua khảo sát và tư vấn miễn phí ạ',
          time: '1 ngày trước',
          likes: 9
        }
      ]
    },
    {
      id: 9,
      author: 'Trương Văn Nam',
      time: '3 ngày trước',
      location: 'Sơn Trà, Đà Nẵng',
      title: 'Bồn cầu bị tắc nghẽn, nước không chảy. Cần thợ thông tắc bồn cầu gấp',
      status: 'Hoàn thành',
      price: '150,000đ',
      urgent: true,
      comments: 7,
      shares: 1,
      likes: 9,
      avatar: '🚽',
      avatarColor: 'from-teal-400 to-teal-600',
      commentList: [
        {
          id: 1,
          author: 'Thông Tắc 24/7',
          avatar: 'T',
          avatarBg: 'bg-teal-600',
          badge: 'THỢ',
          content: 'Em nhận thông tắc bồn cầu, thông cống, hút bể phốt. Bảo hành 6 tháng',
          time: '3 ngày trước',
          likes: 5
        }
      ]
    },
    {
      id: 10,
      author: 'Lý Thị Nga',
      time: '3 ngày trước',
      location: 'Ngũ Hành Sơn, Đà Nẵng',
      title: 'Cần thợ làm cửa nhôm kính cho ban công. Diện tích khoảng 15m2, cần tư vấn loại kính tốt',
      status: 'Đăng',
      price: 'Thương lượng',
      urgent: false,
      comments: 13,
      shares: 4,
      likes: 18,
      avatar: '🪟',
      avatarColor: 'from-sky-400 to-sky-600',
      commentList: [
        {
          id: 1,
          author: 'Nhôm Kính Phát Đạt',
          avatar: 'N',
          avatarBg: 'bg-sky-600',
          badge: 'THỢ',
          content: 'Chị ơi, em chuyên làm cửa nhôm kính các loại. Em qua đo đạc và báo giá cho chị ạ',
          time: '2 ngày trước',
          likes: 11
        }
      ]
    }
  ]

  // Helper function để render avatar
  const renderAvatar = (size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = {
      small: 'w-8 h-8 text-sm',
      medium: 'w-10 h-10 text-base',
      large: 'w-12 h-12 text-lg'
    }
    const className = `${sizeClasses[size]} rounded-full flex items-center justify-center`

    const avatarUrl = normalizeImageUrl(currentUser?.avatar || currentUser?.avatarUrl)

    if (avatarUrl && !avatarLoadError) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className={`${className} object-cover`}
          onError={() => setAvatarLoadError(true)}
        />
      )
    }

    return (
      <div className={`${className} bg-blue-500 text-white font-semibold`}>
        {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
      </div>
    )
  }

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-screen overflow-hidden aurora-bg page-enter bg-gradient-to-br from-[#f2fbf9] via-[#f7fffd] to-[#e8f3ff]">
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl animate-pulse" style={{ animationDelay: '1.1s' }} />
      {/* Header */}
      <Header currentUser={currentUser} />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Create Post Modal */}
        {showCreatePost && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center z-50 px-4 pt-28 sm:pt-32 pb-6 overflow-y-auto animate-fade-in"
            onClick={handleCancelCreatePost}
          >
            <div
              className="relative glass-surface w-full max-w-lg rounded-2xl hover-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleCancelCreatePost}
                disabled={postLoading}
                aria-label="Đóng form đăng bài"
                className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="p-5 pr-14 border-b border-slate-200/80">
                <h2 className="text-xl font-bold text-slate-800">Tạo bài viết</h2>
              </div>

              {/* Modal Body */}
              <div className="p-5">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-4">
                  {renderAvatar('medium')}
                  <div>
                    <div className="font-semibold text-gray-800">{currentUser?.fullName || currentUser?.displayName || 'Người dùng'}</div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>Công khai</span>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                {postError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {postError}
                  </div>
                )}

                {/* Title */}
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Tiêu đề (ví dụ: Cần thợ sửa điện)"
                  className="w-full p-3 mb-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />

                {/* Description */}
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Mô tả chi tiết công việc cần làm..."
                  className="w-full min-h-[150px] p-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-lg bg-white"
                />

                {/* Action Icons */}
                <div className="border border-slate-200 rounded-xl p-3 mb-4 bg-slate-50/70">
                  <div className="text-sm text-slate-500 text-center">
                    Hoặc <button
                      onClick={() => {
                        resetCreatePostForm()
                        setShowCreatePost(false)
                        router.push('/posts/create')
                      }}
                      className="text-teal-700 hover:underline font-medium"
                    >
                      tạo bài đăng chi tiết hơn
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCancelCreatePost}
                    disabled={postLoading}
                    className="w-full border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Không đăng nữa
                  </button>

                  {/* Submit Button */}
                  <button
                    disabled={postLoading || !postTitle.trim() || !postContent.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed shadow-lg shadow-cyan-800/20"
                    onClick={async () => {
                      if (!postTitle.trim() || !postContent.trim()) {
                        setPostError('Vui lòng nhập tiêu đề và mô tả!')
                        return
                      }

                      setPostLoading(true)
                      setPostError('')

                      try {
                        const result = await PostService.createPost({
                          title: postTitle.trim(),
                          description: postContent.trim()
                        })

                        console.log('✅ Tạo bài đăng thành công:', result)
                        setShowCreatePost(false)
                        resetCreatePostForm()
                        alert('Tạo bài đăng thành công!')

                        // Reload danh sách bài đăng để hiển thị bài mới
                        await loadPosts()

                        // Có thể chuyển đến trang chi tiết nếu muốn
                        // router.push(`/posts/${result.id}`)
                      } catch (error: any) {
                        console.error('❌ Lỗi tạo bài:', error)
                        setPostError(error.message || 'Không thể tạo bài đăng. Vui lòng thử lại!')
                      } finally {
                        setPostLoading(false)
                      }
                    }}
                  >
                    {postLoading ? 'Đang đăng...' : 'Đăng bài'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="hidden md:flex w-72 bg-gradient-to-b from-rose-50/85 via-orange-50/70 to-white/85 backdrop-blur-xl border-r border-rose-100/80 flex-col shadow-xl shadow-rose-900/5 stagger-item">
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {/* Người dùng */}
              <Link
                href="/profile"
                className="relative flex items-center space-x-3 px-3 py-3 rounded-2xl bg-gradient-to-r from-rose-100 via-orange-50 to-amber-50 border border-rose-200 text-rose-700 transition cursor-pointer shadow-md shadow-rose-900/10"
              >
                <span className="absolute -top-2 right-2 rounded-full bg-rose-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm">
                  Tài khoản của bạn
                </span>
                {renderAvatar('small')}
                <div className="flex-1">
                  <div className="font-semibold text-sm">{currentUser?.fullName || currentUser?.displayName || 'Người dùng'}</div>
                  <div className="text-[11px] text-rose-600/80">Ưu tiên hiển thị</div>
                </div>
              </Link>

              {/* Menu items - Hiển thị theo role */}
              {(() => {
                const userRole = currentUser?.accountType || currentUser?.role
                const isCustomer = userRole === 'CUSTOMER' || userRole === 'customer'
                const isWorker = userRole === 'WORKER' || userRole === 'provider'

                return (
                  <>
                    {/* Menu cho Khách hàng */}
                    {isCustomer && (
                      <>
                        <Link href="/bai-dang-cua-toi" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50/80 hover:shadow-md text-slate-700 transition-all duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm">Bài đăng của tôi</span>
                        </Link>

                        <Link href="/lich-su" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50/80 hover:shadow-md text-slate-700 transition-all duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">Lịch sử hoạt động</span>
                        </Link>

                        <Link href="/yeu-thich" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50/80 hover:shadow-md text-slate-700 transition-all duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-sm">Thợ yêu thích</span>
                        </Link>
                      </>
                    )}

                    {/* Menu cho Thợ */}
                    {isWorker && (
                      <>
                        <Link href="/da-luu" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50/80 hover:shadow-md text-slate-700 transition-all duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span className="text-sm">Đã lưu</span>
                        </Link>

                        <Link href="/gio-hang" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50/80 hover:shadow-md text-slate-700 transition-all duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm">Chào giá của tôi</span>
                        </Link>

                        <Link href="/lich-su" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50/80 hover:shadow-md text-slate-700 transition-all duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">Lịch sử hoạt động</span>
                        </Link>
                      </>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Lĩnh vực của bạn */}
            <div className="mt-6">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-slate-600 hover:bg-rose-50/80 rounded-xl transition"
              >
                <span className="font-medium">Lĩnh vực của bạn</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showCategories ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategories && (
                <div className="mt-2 space-y-1">
                  {categories.map(cat => (
                    <a key={cat.id} href="#" className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-rose-50/80 text-slate-700 text-sm transition-all hover:translate-x-1">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Khám phá thêm mục */}
            <div className="mt-6">
              <button
                onClick={() => setShowServices(!showServices)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-slate-600 hover:bg-rose-50/80 rounded-xl transition"
              >
                <span className="font-medium">Khám phá thêm mục</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showServices ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showServices && (
                <div className="mt-2 space-y-1">
                  {services.map(service => (
                    <a key={service.id} href="#" className={`flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-rose-50/80 text-sm transition-all hover:translate-x-1 ${service.color}`}>
                      <span>{service.icon}</span>
                      <span className="text-gray-700">{service.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-6 px-3 md:px-6">
              <div className="md:hidden mb-4 animate-fade-in">
                <div className="rounded-2xl border border-white/80 bg-white/80 backdrop-blur p-3 shadow-lg shadow-slate-900/5">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <Link href="/profile" className="shrink-0 px-3 py-1.5 rounded-full bg-teal-600 text-white text-sm font-medium">Cá nhân</Link>
                    <Link href="/bai-dang-cua-toi" className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">Bài đăng</Link>
                    <Link href="/lich-su" className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">Lịch sử</Link>
                    <Link href="/yeu-thich" className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">Yêu thích</Link>
                  </div>
                </div>
              </div>
              {/* Create Post Section - Chỉ hiển thị cho Khách hàng */}
              {(() => {
                const userRole = currentUser?.accountType || currentUser?.role
                const isCustomer = userRole === 'CUSTOMER' || userRole === 'customer'

                if (!isCustomer) return null

                return (
                  <div className="bg-white/85 backdrop-blur rounded-2xl border border-white/80 shadow-xl shadow-slate-900/5 mb-5 p-4 md:p-5 animate-fade-in">
                    <div className="flex items-center space-x-3">
                      {renderAvatar('medium')}
                      <input
                        type="text"
                        placeholder="Bạn cần tìm thợ gì?"
                        onClick={() => setShowCreatePost(true)}
                        readOnly
                        className="flex-1 px-4 py-2.5 bg-slate-100/90 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 cursor-pointer hover:bg-slate-100 transition"
                      />
                    </div>

                    {/* Filter Buttons */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button className="flex items-center justify-center space-x-2 px-3 py-2 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 rounded-xl transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Ảnh/Video</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 px-3 py-2 text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-xl transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Vị trí</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 px-3 py-2 text-cyan-700 bg-cyan-50/70 hover:bg-cyan-100 rounded-xl transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Thời gian</span>
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Tabs */}
              <div className="bg-white/85 backdrop-blur rounded-2xl border border-white/80 shadow-xl shadow-slate-900/5 mb-5 animate-fade-in">
                <div className="flex p-2 gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === 'all'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-700/20'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === 'services'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-700/20'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Gần tôi
                  </button>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === 'jobs'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-700/20'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Gấp
                  </button>
                </div>
              </div>

              {/* Posts */}
              {loadingPosts ? (
                <>
                  <SkeletonPost />
                  <SkeletonPost />
                  <SkeletonPost />
                </>
              ) : posts.length === 0 ? (
                <div className="bg-white/85 backdrop-blur rounded-2xl border border-white/80 shadow-xl shadow-slate-900/5 p-12 text-center animate-fade-in">
                  <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Chưa có bài đăng nào</h3>
                  <p className="text-slate-500 mb-6">Hãy là người đầu tiên tạo bài đăng!</p>
                  {(() => {
                    const userRole = currentUser?.accountType || currentUser?.role
                    const isCustomer = userRole === 'CUSTOMER' || userRole === 'customer'

                    if (!isCustomer) return null

                    return (
                      <button
                        onClick={() => setShowCreatePost(true)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl hover:from-emerald-700 hover:to-cyan-700 transition shadow-lg shadow-cyan-800/20"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo bài đăng
                      </button>
                    )
                  })()}
                </div>
              ) : (
                posts.map((post, index) => {
                  // Kiểm tra xem bài viết có phải của currentUser không
                  // So sánh nhiều trường có thể có
                  const isMyPost =
                    post.customerId === currentUser?.id ||
                    post.customer?.id === currentUser?.id ||
                    post.userId === currentUser?.id ||
                    post.authorId === currentUser?.id ||
                    // So sánh theo tên nếu không có ID
                    (post.customer?.fullName === currentUser?.fullName && currentUser?.fullName)

                  const postAuthor = isMyPost ? currentUser : post.customer
                  const userRole = currentUser?.accountType || currentUser?.role
                  const isWorker = userRole === 'WORKER' || userRole === 'provider'
                  const postId = String(post.id)
                  const isSaved = savedPostIds.has(postId)
                  const isSaving = savingPostIds.has(postId)

                  return (
                    <div key={post.id} className="bg-white/90 backdrop-blur rounded-2xl border border-white/80 shadow-xl shadow-slate-900/5 mb-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/10 animate-fade-in" style={{ animationDelay: `${Math.min(0.8, index * 0.05)}s` }}>
                      {/* Post Header */}
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex items-start justify-between">
                          <Link
                            href={isMyPost ? '/profile' : `/profile/${post.customerId || post.customer?.id || post.customer?.customerId}`}
                            className="flex items-center space-x-3 hover:opacity-80 transition cursor-pointer"
                            style={{ flexDirection: 'row' }}
                          >
                            {/* Avatar - Luôn ở bên trái */}
                            <div className="flex-shrink-0">
                              {(() => {
                                let avatarUrl: string | null = null;

                                if (isMyPost) {
                                  // Nếu là bài của mình, ưu tiên: currentUser.avatar > currentUser.avatarUrl > localStorage
                                  avatarUrl = currentUser?.avatar || currentUser?.avatarUrl;

                                  // Nếu không có, kiểm tra localStorage
                                  if (!avatarUrl && currentUser?.id && typeof window !== 'undefined') {
                                    const avatarKey = `user_avatar_${currentUser.id}`;
                                    const savedAvatar = localStorage.getItem(avatarKey);
                                    if (savedAvatar) {
                                      avatarUrl = savedAvatar;
                                    }
                                  }
                                } else {
                                  // Nếu là bài của người khác
                                  avatarUrl = post.customer?.avatarUrl || postAuthor?.avatarUrl;

                                  // Kiểm tra localStorage cho customer
                                  if (!avatarUrl && post.customerId && typeof window !== 'undefined') {
                                    const avatarKey = `user_avatar_${post.customerId}`;
                                    const savedAvatar = localStorage.getItem(avatarKey);
                                    if (savedAvatar) {
                                      avatarUrl = savedAvatar;
                                    }
                                  }
                                }

                                if (avatarUrl) {
                                  return (
                                    <img
                                      src={avatarUrl}
                                      alt="Avatar"
                                      className="w-10 h-10 rounded-full object-cover"
                                      onError={(e) => {
                                        // Fallback nếu ảnh lỗi
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          const fallback = document.createElement('div');
                                          fallback.className = 'w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold';
                                          fallback.textContent = (postAuthor?.fullName || post.customer?.fullName || currentUser?.fullName || 'U').charAt(0).toUpperCase();
                                          parent.appendChild(fallback);
                                        }
                                      }}
                                    />
                                  );
                                }

                                // Fallback: hiển thị chữ cái đầu
                                return (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(postAuthor?.fullName || post.customer?.fullName || currentUser?.fullName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                );
                              })()}
                            </div>
                            {/* Tên và thông tin - Ở bên phải */}
                            <div>
                              <h3 className="font-semibold text-slate-800 hover:text-cyan-700 transition">{postAuthor?.fullName || post.author || currentUser?.fullName || 'Người dùng'}</h3>
                              <div className="flex items-center space-x-2 text-xs text-slate-500">
                                <span>{post.time || new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                <span>•</span>
                                <span>{post.location || 'Chưa cập nhật'}</span>
                              </div>
                            </div>
                          </Link>

                          {/* Dropdown Menu - Chỉ hiển thị cho Khách hàng */}
                          {(() => {
                            const userRole = currentUser?.accountType || currentUser?.role
                            const isCustomer = userRole === 'CUSTOMER' || userRole === 'customer'

                            if (!isCustomer) return null

                            return (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId(openMenuId === post.id ? null : post.id)
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {openMenuId === post.id && (
                                  <div
                                    className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Kiểm tra ownership */}
                                    {currentUser && post.customerId === currentUser.id ? (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditPost(post.id)
                                          }}
                                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 text-sm transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                          <span>Chỉnh sửa</span>
                                        </button>

                                        {post.status === 'OPEN' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleClosePost(post.id)
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 text-sm transition-colors"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Đóng bài đăng</span>
                                          </button>
                                        )}

                                        <div className="border-t border-slate-200 my-2"></div>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePost(post.id)
                                          }}
                                          className="w-full px-4 py-2 text-left hover:bg-rose-50 flex items-center gap-3 text-rose-600 text-sm transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                          <span>Xóa</span>
                                        </button>
                                      </>
                                    ) : (
                                      <div className="px-4 py-3">
                                        <p className="text-sm text-slate-500 text-center">
                                          {!currentUser ? 'Vui lòng đăng nhập' : 'Chỉ chủ bài đăng mới có thể chỉnh sửa'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Post Content */}
                      <Link href={`/posts/${post.id}`} className="block p-4 hover:bg-cyan-50/40 transition-colors cursor-pointer">
                        <p className="text-slate-800 mb-3 hover:text-cyan-700 transition">{post.title}</p>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${post.status === 'Đăng' ? 'bg-green-100 text-green-800' :
                            post.status === 'Đang thực hiện' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {post.status}
                          </span>
                          <span className="inline-flex items-center text-emerald-700 font-semibold">
                            {post.price}
                          </span>
                          {post.urgent && (
                            <span className="inline-flex items-center text-orange-500">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Gấp
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Post Images - Chỉ hiển thị khi có ảnh */}
                      {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="w-full">
                          {post.imageUrls.length === 1 ? (
                            <div className="relative w-full aspect-video">
                              <Image
                                src={post.imageUrls[0]}
                                alt={post.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : post.imageUrls.length === 2 ? (
                            <div className="grid grid-cols-2 gap-1">
                              {post.imageUrls.map((url: string, index: number) => (
                                <div key={index} className="relative aspect-video">
                                  <Image
                                    src={url}
                                    alt={`${post.title} - Image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ))}
                            </div>
                          ) : post.imageUrls.length === 3 ? (
                            <div className="grid grid-cols-2 gap-1">
                              <div className="relative aspect-video row-span-2">
                                <Image
                                  src={post.imageUrls[0]}
                                  alt={`${post.title} - Image 1`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="relative aspect-video">
                                <Image
                                  src={post.imageUrls[1]}
                                  alt={`${post.title} - Image 2`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="relative aspect-video">
                                <Image
                                  src={post.imageUrls[2]}
                                  alt={`${post.title} - Image 3`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1">
                              {post.imageUrls.slice(0, 4).map((url: string, index: number) => (
                                <div key={index} className="relative aspect-video">
                                  <Image
                                    src={url}
                                    alt={`${post.title} - Image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                  {index === 3 && post.imageUrls.length > 4 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                      <span className="text-white text-2xl font-bold">+{post.imageUrls.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Post Stats */}
                      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                        <span>{post.likes} lượt thích</span>
                      </div>

                      {/* Post Actions */}
                      <div className="px-3 md:px-4 py-2 border-t border-slate-100 flex items-center justify-around gap-2">
                        <button className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-100 rounded-xl transition">
                          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span className="text-slate-700 font-medium">Thích</span>
                        </button>

                        {!isMyPost && (() => {
                          // Chỉ thợ mới có thể gửi chào giá
                          if (!isWorker) return null

                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/posts/${post.id}`)
                              }}
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-emerald-50 rounded-xl transition"
                            >
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-green-600 font-medium">Chào giá</span>
                            </button>
                          )
                        })()}

                        {isWorker && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleSavePost(postId)
                            }}
                            disabled={isSaving}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${isSaved
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'hover:bg-slate-100'} ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <svg className={`w-5 h-5 ${isSaved ? 'text-emerald-600' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span className={`font-medium ${isSaved ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {isSaving ? 'Đang lưu...' : isSaved ? 'Đã lưu' : 'Lưu'}
                            </span>
                          </button>
                        )}
                      </div>

                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

