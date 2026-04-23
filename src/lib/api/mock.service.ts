// src/lib/api/mock.service.ts
// Mock Service - Dùng khi backend offline

export const mockAuthService = {
  login: async (data: any) => {
    console.log('🎭 [MOCK] Login:', data)
    return {
      token: 'mock-token-' + Date.now(),
      user: {
        id: 'user-1',
        email: data.identifier || 'test@example.com',
        fullName: 'Nguyễn Văn Test',
        phone: '0912345678',
        accountType: 'CUSTOMER',
        avatar: 'https://i.pravatar.cc/150?img=1'
      }
    }
  },

  register: async (data: any) => {
    console.log('🎭 [MOCK] Register:', data)
    return {
      token: 'mock-token-' + Date.now(),
      user: {
        id: 'user-' + Date.now(),
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        accountType: data.accountType,
        avatar: 'https://i.pravatar.cc/150?img=2'
      }
    }
  }
}

export const mockPostService = {
  getFeed: async () => {
    console.log('🎭 [MOCK] Get Feed')
    return [
      {
        id: '1',
        title: 'Sửa máy lạnh',
        description: 'Máy lạnh không lạnh, cần sửa ngay',
        category: 'Điện lạnh',
        location: 'Hải Châu, Đà Nẵng',
        author: {
          id: 'user-1',
          fullName: 'Phạm Văn A',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        status: 'OPEN',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        quoteCount: 3
      },
      {
        id: '2',
        title: 'Lắp đặt cửa kính',
        description: 'Chdịu nhà đã sẵn sàng, cần lắp 3 cánh cửa kính 2m x 3m',
        category: 'Xây dựng',
        location: 'Thanh Khê, Đà Nẵng',
        author: {
          id: 'user-2',
          fullName: 'Trần Thị B',
          avatar: 'https://i.pravatar.cc/150?img=4'
        },
        status: 'OPEN',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        quoteCount: 2
      },
      {
        id: '3',
        title: 'Sơn nhà',
        description: 'Sơn lại tường, trần và cửa. Diện tích khoảng 80m2',
        category: 'Sơn sửa chữa',
        location: 'Ngũ Hành Sơn, Đà Nẵng',
        author: {
          id: 'user-3',
          fullName: 'Lê Văn C',
          avatar: 'https://i.pravatar.cc/150?img=5'
        },
        status: 'OPEN',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        quoteCount: 5
      },
      {
        id: '4',
        title: 'Lắp camera an ninh',
        description: 'Cần lắp 4 camera, 1 đầu ghi, bộ lưu điện',
        category: 'Lắp đặt camera',
        location: 'Cẩm Lệ, Đà Nẵng',
        author: {
          id: 'user-4',
          fullName: 'Hoàng Minh D',
          avatar: 'https://i.pravatar.cc/150?img=6'
        },
        status: 'OPEN',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        quoteCount: 4
      },
      {
        id: '5',
        title: 'Sửa khóa cửa',
        description: 'Khóa cửa hư, cần thay khóa mới',
        category: 'Sửa khóa',
        location: 'Sơn Trà, Đà Nẵng',
        author: {
          id: 'user-5',
          fullName: 'Ngô Văn E',
          avatar: 'https://i.pravatar.cc/150?img=7'
        },
        status: 'OPEN',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        quoteCount: 1
      }
    ]
  },

  getPostById: async (id: string) => {
    console.log('🎭 [MOCK] Get Post:', id)
    return {
      id,
      title: 'Sửa máy lạnh',
      description: 'Máy lạnh không lạnh, cần sửa ngay',
      category: 'Điện lạnh',
      location: 'Hải Châu, Đà Nẵng',
      author: {
        id: 'user-1',
        fullName: 'Phạm Văn A',
        avatar: 'https://i.pravatar.cc/150?img=3',
        rating: 4.5,
        jobCount: 20
      },
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      quoteCount: 3
    }
  },

  createPost: async (data: any) => {
    console.log('🎭 [MOCK] Create Post:', data)
    return {
      id: 'post-' + Date.now(),
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    }
  }
}

export const mockChatService = {
  getConversations: async () => {
    console.log('🎭 [MOCK] Get Conversations')
    return [
      {
        id: 'conv-1',
        participants: [
          { id: 'user-1', fullName: 'Phạm Văn A', avatar: 'https://i.pravatar.cc/150?img=3' }
        ],
        lastMessage: 'Máy lạnh bao nhiêu tiền sửa?',
        lastMessageTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        unreadCount: 2
      },
      {
        id: 'conv-2',
        participants: [
          { id: 'user-2', fullName: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?img=4' }
        ],
        lastMessage: 'OK, tôi sẽ đến vào thứ 7',
        lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        unreadCount: 0
      }
    ]
  },

  getMessages: async (id: string) => {
    console.log('🎭 [MOCK] Get Messages:', id)
    return [
      {
        id: 'msg-1',
        conversationId: id,
        sender: { id: 'user-1', fullName: 'Phạm Văn A' },
        content: 'Chào, máy lạnh tôi bị hỏng',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        conversationId: id,
        sender: { id: 'user-me', fullName: 'Bạn' },
        content: 'Vâng, tôi có thể sửa',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      }
    ]
  },

  sendMessage: async (id: string, data: any) => {
    console.log('🎭 [MOCK] Send Message:', id, data)
    return {
      id: 'msg-' + Date.now(),
      conversationId: id,
      sender: { id: 'user-me', fullName: 'Bạn' },
      content: data.content,
      type: data.type || 'TEXT',
      createdAt: new Date().toISOString()
    }
  }
}

export const mockQuoteService = {
  getQuotesByPostId: async (postId: string) => {
    console.log('🎭 [MOCK] Get Quotes:', postId)
    return [
      {
        id: 'quote-1',
        postId,
        provider: { id: 'user-1', fullName: 'Phạm Văn A', avatar: 'https://i.pravatar.cc/150?img=3' },
        price: 500000,
        description: 'Sửa máy lạnh (lau dàn, kiểm tra, nạp gas)',
        estimatedTime: '2 giờ',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        id: 'quote-2',
        postId,
        provider: { id: 'user-2', fullName: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?img=4' },
        price: 450000,
        description: 'Sửa nhanh, bảo hành 1 tháng',
        estimatedTime: '1.5 giờ',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    ]
  },

  createQuote: async (data: any) => {
    console.log('🎭 [MOCK] Create Quote:', data)
    return {
      id: 'quote-' + Date.now(),
      postId: data.postId,
      price: data.price,
      description: data.description,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }
  }
}

export const mockNotificationService = {
  getNotifications: async () => {
    console.log('🎭 [MOCK] Get Notifications')
    return [
      {
        id: 'notif-1',
        message: 'Phạm Văn A đã báo giá cho bài của bạn',
        type: 'QUOTE',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif-2',
        message: 'Bạn có tin nhắn mới từ Trần Thị B',
        type: 'MESSAGE',
        read: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ]
  },

  getUnreadCount: async () => {
    console.log('🎭 [MOCK] Get Unread Count')
    return 2
  }
}

export const mockOrderService = {
  getOrders: async () => {
    console.log('🎭 [MOCK] Get Orders')
    return [
      {
        id: 'order-1',
        postId: '1',
        title: 'Sửa máy lạnh',
        provider: { id: 'user-1', fullName: 'Phạm Văn A' },
        price: 500000,
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString()
      }
    ]
  },

  getStats: async () => {
    console.log('🎭 [MOCK] Get Stats')
    return {
      total: 10,
      pending: 2,
      inProgress: 3,
      completed: 4,
      cancelled: 1
    }
  }
}

export const mockProfileService = {
  getMyProfile: async () => {
    console.log('🎭 [MOCK] Get My Profile')
    return {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Nguyễn Văn Test',
      displayName: 'Nguyễn Văn Test',
      phone: '0912345678',
      bio: 'Đây là bio của tôi',
      avatar: 'https://i.pravatar.cc/150?img=1',
      address: '123 Đường ABC',
      city: 'Đà Nẵng',
      district: 'Hải Châu',
      ward: 'Phước Ninh'
    }
  },

  updateProfile: async (data: any) => {
    console.log('🎭 [MOCK] Update Profile:', data)
    return { success: true, message: 'Cập nhật thành công' }
  }
}

export const mockServices = {
  auth: mockAuthService,
  post: mockPostService,
  chat: mockChatService,
  quote: mockQuoteService,
  notification: mockNotificationService,
  order: mockOrderService,
  profile: mockProfileService
}
