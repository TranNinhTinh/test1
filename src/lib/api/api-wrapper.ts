// src/lib/api/api-wrapper.ts
// Wrapper để auto-fallback sang mock data khi backend fail

import { mockServices } from './mock.service'
import { shouldUseMock, getApiMode, API_MODE } from './api-mode'

export class ApiWrapper {
  private static useMock = false

  static async wrappedCall<T>(
    name: string,
    realCall: () => Promise<T>,
    mockCall: () => Promise<T>
  ): Promise<T> {
    try {
      // Nếu đã decide dùng mock, skip real call
      if (this.useMock) {
        console.log(`🎭 [API Wrapper] ${name} - Using MOCK (cached)`)
        return await mockCall()
      }

      // Thử gọi real API
      console.log(`🔵 [API Wrapper] ${name} - Trying REAL API`)
      const result = await realCall()
      
      console.log(`✅ [API Wrapper] ${name} - REAL API Success`)
      return result
    } catch (error: any) {
      // Kiểm tra xem có nên fallback sang mock không
      if (shouldUseMock(error)) {
        console.warn(`⚠️ [API Wrapper] ${name} - Real API failed, fallback to MOCK`)
        this.useMock = true
        
        try {
          const mockResult = await mockCall()
          console.log(`🎭 [API Wrapper] ${name} - MOCK Success`)
          return mockResult
        } catch (mockError) {
          console.error(`❌ [API Wrapper] ${name} - MOCK also failed`)
          throw mockError
        }
      }

      // Nếu error không phải network, throw error (bukan fallback)
      throw error
    }
  }

  static setUseMock(value: boolean) {
    this.useMock = value
    console.log(`🔧 [API Wrapper] Force MOCK mode: ${value}`)
  }

  static isUsingMock(): boolean {
    return this.useMock
  }
}

// Wrapper cho Auth Service
export const wrappedAuthService = {
  login: async (data: any, rememberMe: boolean = false) => {
    return ApiWrapper.wrappedCall(
      'AuthService.login',
      async () => {
        // Real API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Login failed')
        
        // Save token
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', result.data?.accessToken || result.token)
          localStorage.setItem('user', JSON.stringify(result.data?.user || result.user))
        }
        
        return result.data || result
      },
      async () => {
        // Mock API
        const mockResult = await mockServices.auth.login(data)
        
        // Save mock token
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', mockResult.token)
          localStorage.setItem('user', JSON.stringify(mockResult.user))
        }
        
        return mockResult
      }
    )
  },

  register: async (data: any) => {
    return ApiWrapper.wrappedCall(
      'AuthService.register',
      async () => {
        // Real API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Register failed')
        return result.data || result
      },
      async () => {
        // Mock API
        return await mockServices.auth.register(data)
      }
    )
  }
}

// Wrapper cho Post Service
export const wrappedPostService = {
  getFeed: async () => {
    return ApiWrapper.wrappedCall(
      'PostService.getFeed',
      async () => {
        const response = await fetch('/api/posts/feed')
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load posts')
        return result.data || result
      },
      async () => {
        return await mockServices.post.getFeed()
      }
    )
  },

  getPostById: async (id: string) => {
    return ApiWrapper.wrappedCall(
      `PostService.getPostById(${id})`,
      async () => {
        const response = await fetch(`/api/posts/${id}`)
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load post')
        return result.data || result
      },
      async () => {
        return await mockServices.post.getPostById(id)
      }
    )
  },

  createPost: async (data: any) => {
    return ApiWrapper.wrappedCall(
      'PostService.createPost',
      async () => {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to create post')
        return result.data || result
      },
      async () => {
        return await mockServices.post.createPost(data)
      }
    )
  }
}

// Wrapper cho Chat Service
export const wrappedChatService = {
  getConversations: async () => {
    return ApiWrapper.wrappedCall(
      'ChatService.getConversations',
      async () => {
        const response = await fetch('/api/chat/conversations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load conversations')
        return result.data || result
      },
      async () => {
        return await mockServices.chat.getConversations()
      }
    )
  },

  getMessages: async (id: string) => {
    return ApiWrapper.wrappedCall(
      `ChatService.getMessages(${id})`,
      async () => {
        const response = await fetch(`/api/chat/conversations/${id}/messages`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load messages')
        return result.data || result
      },
      async () => {
        return await mockServices.chat.getMessages(id)
      }
    )
  },

  sendMessage: async (id: string, data: any) => {
    return ApiWrapper.wrappedCall(
      `ChatService.sendMessage(${id})`,
      async () => {
        const response = await fetch(`/api/chat/conversations/${id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to send message')
        return result.data || result
      },
      async () => {
        return await mockServices.chat.sendMessage(id, data)
      }
    )
  }
}

// Wrapper cho Notification Service
export const wrappedNotificationService = {
  getNotifications: async () => {
    return ApiWrapper.wrappedCall(
      'NotificationService.getNotifications',
      async () => {
        const response = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load notifications')
        return result.data || result
      },
      async () => {
        return await mockServices.notification.getNotifications()
      }
    )
  },

  getUnreadCount: async () => {
    return ApiWrapper.wrappedCall(
      'NotificationService.getUnreadCount',
      async () => {
        const response = await fetch('/api/notifications/unread-count', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load unread count')
        return result.data?.unreadCount || result.unreadCount || 0
      },
      async () => {
        return await mockServices.notification.getUnreadCount()
      }
    )
  }
}

// Wrapper cho Quote Service
export const wrappedQuoteService = {
  getQuotesByPostId: async (postId: string) => {
    return ApiWrapper.wrappedCall(
      `QuoteService.getQuotesByPostId(${postId})`,
      async () => {
        const response = await fetch(`/api/quotes/post/${postId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load quotes')
        return result.data || result
      },
      async () => {
        return await mockServices.quote.getQuotesByPostId(postId)
      }
    )
  },

  createQuote: async (data: any) => {
    return ApiWrapper.wrappedCall(
      'QuoteService.createQuote',
      async () => {
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to create quote')
        return result.data || result
      },
      async () => {
        return await mockServices.quote.createQuote(data)
      }
    )
  }
}

// Wrapper cho Profile Service
export const wrappedProfileService = {
  getMyProfile: async () => {
    return ApiWrapper.wrappedCall(
      'ProfileService.getMyProfile',
      async () => {
        const response = await fetch('/api/profile/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to load profile')
        return result.data || result
      },
      async () => {
        return await mockServices.profile.getMyProfile()
      }
    )
  },

  updateProfile: async (data: any) => {
    return ApiWrapper.wrappedCall(
      'ProfileService.updateProfile',
      async () => {
        const response = await fetch('/api/profile/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) throw new Error('Failed to update profile')
        return result.data || result
      },
      async () => {
        return await mockServices.profile.updateProfile(data)
      }
    )
  }
}
