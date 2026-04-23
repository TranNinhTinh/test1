'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { PostService } from '@/lib/api/post.service'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService } from '@/lib/api/profile-new.service'
import SkeletonPost from '@/app/components/SkeletonPost'

export default function MyPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'OPEN' | 'CLOSED'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      if (!AuthService.isAuthenticated()) {
        alert('Vui lòng đăng nhập để xem bài đăng của bạn!')
        router.push('/dang-nhap')
        return
      }

      try {
        // Xác thực token thuộc user hiện tại trước khi tải bài đăng
        await ProfileService.getMyProfile()
        await loadMyPosts()
      } catch (error: any) {
        alert(error?.message || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!')
        router.push('/dang-nhap')
      }
    }

    initializePage()
  }, [router])

  const loadMyPosts = async () => {
    try {
      setLoading(true)
      const response = await PostService.getMyPosts({ limit: 50 })

      if (response.data && Array.isArray(response.data)) {
        setPosts(response.data)
      } else {
        setPosts([])
      }
    } catch (error: any) {
      console.error('❌ Lỗi load bài đăng:', error)
      if (error.message?.includes('đăng nhập')) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!')
        router.push('/dang-nhap')
      }
    } finally {
      setLoading(false)
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
      await loadMyPosts() // Reload
      setOpenMenuId(null)
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(error.message || 'Không thể xóa bài đăng')
    }
  }

  const handleClosePost = async (postId: string) => {
    if (!confirm('Đánh dấu bài đăng này đã hoàn thành?')) return

    try {
      await PostService.closePost(postId)
      alert('Đã đóng bài đăng thành công!')
      await loadMyPosts() // Reload
      setOpenMenuId(null)
    } catch (error: any) {
      console.error('Error closing post:', error)
      alert(error.message || 'Không thể đóng bài đăng')
    }
  }

  const handleViewPost = (postId: string) => {
    router.push(`/posts/${postId}`)
  }

  // Filter posts
  const filteredPosts = filterStatus === 'all'
    ? posts
    : posts.filter(post => post.status === filterStatus)

  const openPosts = posts.filter(p => p.status === 'OPEN').length
  const closedPosts = posts.filter(p => p.status === 'CLOSED').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-gray-600 text-sm">Tất cả</p>
            <p className="text-2xl font-bold text-gray-800">{posts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-gray-600 text-sm">Đang mở</p>
            <p className="text-2xl font-bold text-green-600">{openPosts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-gray-600 text-sm">Đã đóng</p>
            <p className="text-2xl font-bold text-gray-500">{closedPosts}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-3 text-center font-medium ${filterStatus === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Tất cả ({posts.length})
            </button>
            <button
              onClick={() => setFilterStatus('OPEN')}
              className={`flex-1 py-3 text-center font-medium ${filterStatus === 'OPEN'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Đang mở ({openPosts})
            </button>
            <button
              onClick={() => setFilterStatus('CLOSED')}
              className={`flex-1 py-3 text-center font-medium ${filterStatus === 'CLOSED'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Đã đóng ({closedPosts})
            </button>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {filterStatus === 'all' && 'Chưa có bài đăng nào'}
              {filterStatus === 'OPEN' && 'Không có bài đăng đang tìm thợ'}
              {filterStatus === 'CLOSED' && 'Không có bài đăng đã hoàn thành'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' && 'Tạo bài đăng đầu tiên để tìm thợ ngay!'}
              {filterStatus === 'OPEN' && 'Tất cả bài đăng của bạn đã hoàn thành'}
              {filterStatus === 'CLOSED' && 'Chưa có bài đăng nào được đánh dấu hoàn thành'}
            </p>
            {filterStatus === 'all' && (
              <Link
                href="/posts/create"
                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
              >
                Tạo bài đăng mới
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${post.status === 'OPEN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {post.status === 'OPEN' ? '🟢 Đang tìm thợ' : '✅ Đã hoàn thành'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{post.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      {post.location && <span>📍 {post.location}</span>}
                      {post.budget && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                          </svg>
                          {post.budget.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu 3 chấm */}
                  <div className="relative ml-4">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openMenuId === post.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-2">
                          <button
                            onClick={() => handleViewPost(post.id)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Chỉnh sửa
                          </button>
                          {post.status === 'OPEN' && (
                            <button
                              onClick={() => handleClosePost(post.id)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-green-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Đánh dấu hoàn thành
                            </button>
                          )}
                          <hr className="my-2" />
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Xóa bài đăng
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
