'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService } from '@/lib/api/profile-new.service'
import { savedPostService } from '@/lib/api/saved-post.service'
import Link from 'next/link'

interface SavedPost {
  id: string
  title: string
  service?: string
  price?: string
  location?: string
  postedBy?: string
  postedAt?: string
  savedAt?: string
  status?: string
  urgent: boolean
}

interface CurrentUser {
  id: string
  fullName?: string
  displayName?: string
  avatarUrl?: string
}

export default function SavedPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent'>('all')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const formatSavedAt = (savedAt?: string) => {
    if (!savedAt) return 'gần đây'
    const date = new Date(savedAt)
    if (Number.isNaN(date.getTime())) return savedAt
    return date.toLocaleString('vi-VN')
  }

  useEffect(() => {
    const loadUserAndSavedPosts = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push('/dang-nhap')
        return
      }

      try {
        const profile = await ProfileService.getMyProfile()
        const user = {
          id: profile.id,
          fullName: profile.fullName,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        }
        setCurrentUser(user)

        const response = await savedPostService.getSavedPosts({ limit: 100 })
        const mappedPosts: SavedPost[] = (response.data || []).map((item) => ({
          id: item.postId,
          title: item.post?.title || 'Bài đăng không còn tồn tại',
          service: 'Dịch vụ',
          price: item.post?.budget ? `${Number(item.post.budget).toLocaleString('vi-VN')} VND` : 'Liên hệ báo giá',
          location: item.post?.location || 'Chưa cập nhật địa điểm',
          postedBy: 'Người dùng',
          postedAt: item.post?.createdAt ? new Date(item.post.createdAt).toLocaleString('vi-VN') : 'Không rõ thời gian',
          savedAt: item.savedAt,
          status: item.post?.status === 'OPEN' ? 'Đang tìm thợ' : 'Đã đóng',
          urgent: false,
        }))

        setSavedPosts(mappedPosts)
      } catch (error) {
        console.error('Không thể tải thông tin người dùng:', error)
        router.push('/dang-nhap')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserAndSavedPosts()
  }, [router])

  const handleUnsave = async (postId: string) => {
    try {
      await savedPostService.unsavePost(postId)
      setSavedPosts(prev => prev.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Không thể bỏ lưu bài đăng:', error)
      alert(error instanceof Error ? error.message : 'Không thể bỏ lưu bài đăng')
    }
  }

  const filteredPosts = selectedFilter === 'urgent'
    ? savedPosts.filter(post => post.urgent)
    : savedPosts

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AppShell>
    <div className="flex h-screen flex-col bg-surface-lowest">
      {/* Header */}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Bài viết đã lưu</h1>

              {/* Filter */}
              <div className="flex gap-4 border-b border-gray-200">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`pb-3 px-2 font-medium transition ${selectedFilter === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Tất cả ({savedPosts.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('urgent')}
                  className={`pb-3 px-2 font-medium transition ${selectedFilter === 'urgent'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Gấp ({savedPosts.filter(p => p.urgent).length})
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có bài viết đã lưu</h3>
                  <p className="text-gray-500 mb-4">Lưu các bài viết quan tâm để xem lại sau</p>
                  <Link href="/home" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Khám phá công việc
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${post.status === 'Đang tìm thợ' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {post.status || 'Đang xử lý'}
                              </span>
                              {post.urgent && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  Gấp
                                </span>
                              )}
                            </div>
                            <Link href={`/posts/${post.id}`} className="block hover:text-blue-600">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span>{post.service || 'Dịch vụ khác'}</span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold text-green-600">{post.price || 'Liên hệ báo giá'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span>{post.location || 'Chưa cập nhật địa điểm'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span>Đăng bởi: <strong>{post.postedBy || 'Ẩn danh'}</strong></span>
                                <span>•</span>
                                <span>{post.postedAt || 'Không rõ thời gian'}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Đã lưu {formatSavedAt(post.savedAt)}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUnsave(post.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Bỏ lưu"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          <Link
                            href={`/posts/${post.id}`}
                            className="flex-1 text-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            Xem chi tiết
                          </Link>
                          <button className="flex-1 text-center py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            Ứng tuyển
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  )
}
