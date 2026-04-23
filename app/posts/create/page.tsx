'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PostService } from '@/lib/api/post.service'
import { AuthService } from '@/lib/api/auth.service'
import type { CreatePostDto } from '@/lib/api'

export default function CreatePostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit') // Lấy ID bài đăng cần edit
  const isEditMode = !!editId

  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const [formData, setFormData] = useState<CreatePostDto>({
    title: '',
    description: '',
    location: '',
    desiredTime: '',
    budget: undefined,
    imageUrls: []
  })

  useEffect(() => {
    // Kiểm tra authentication
    if (!AuthService.isAuthenticated()) {
      alert('Vui lòng đăng nhập để tạo bài đăng!')
      router.push('/dang-nhap')
      return
    }
    setCheckingAuth(false)

    // Nếu là edit mode, load dữ liệu bài đăng
    if (isEditMode && editId) {
      loadPostData(editId)
    }
  }, [editId, isEditMode])

  const loadPostData = async (postId: string) => {
    try {
      setLoadingPost(true)
      console.log('📖 Loading post for edit:', postId)
      const post = await PostService.getPostById(postId)

      console.log('✅ Post loaded:', post)

      // Populate form với dữ liệu từ post
      setFormData({
        title: post.title || '',
        description: post.description || '',
        location: post.location || '',
        desiredTime: post.desiredTime ? new Date(post.desiredTime).toISOString().slice(0, 16) : '',
        budget: post.budget || undefined,
        imageUrls: post.imageUrls || []
      })
    } catch (err: any) {
      console.error('❌ Lỗi load bài đăng:', err)
      alert('Không thể load bài đăng để chỉnh sửa!')
      router.push('/bai-dang-cua-toi')
    } finally {
      setLoadingPost(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề!')
      return
    }
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả!')
      return
    }

    setLoading(true)

    try {
      const postData: CreatePostDto = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ...(formData.location && { location: formData.location.trim() }),
        ...(formData.desiredTime && { desiredTime: new Date(formData.desiredTime).toISOString() }),
        ...(formData.budget && { budget: Number(formData.budget) }),
        ...((!isEditMode && selectedFiles.length === 0 && formData.imageUrls && formData.imageUrls.length > 0) && { imageUrls: formData.imageUrls }),
        ...((isEditMode && formData.imageUrls && formData.imageUrls.length > 0) && { imageUrls: formData.imageUrls })
      }

      let result

      if (isEditMode && editId) {
        // Chế độ chỉnh sửa
        console.log('✏️ Updating post:', editId, postData)
        result = await PostService.updatePost(editId, postData)
        console.log('✅ Post updated successfully:', result)
        alert('Cập nhật bài đăng thành công!')
      } else {
        // Chế độ tạo mới
        console.log('📝 Creating post with data:', postData)
        result = selectedFiles.length > 0
          ? await PostService.createPostWithFiles(postData, selectedFiles)
          : await PostService.createPost(postData)
        console.log('✅ Post created successfully:', result)
        alert('Tạo bài đăng thành công!')
      }

      router.push(`/posts/${result.id || editId}`)
    } catch (err: any) {
      console.error('❌ Lỗi:', err)

      // Kiểm tra nếu là lỗi authentication
      if (err.message.includes('đăng nhập') || err.message.includes('phiên')) {
        setError(err.message)
        setTimeout(() => {
          router.push('/dang-nhap')
        }, 2000)
      } else {
        setError(err.message || (isEditMode ? 'Cập nhật bài đăng thất bại!' : 'Tạo bài đăng thất bại!'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth || loadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {checkingAuth ? 'Đang kiểm tra đăng nhập...' : 'Đang tải bài đăng...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={isEditMode ? "/bai-dang-cua-toi" : "/home"}
            className="text-blue-500 hover:text-blue-600 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng mới'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode
              ? 'Cập nhật thông tin bài đăng của bạn'
              : 'Mô tả công việc bạn cần để tìm thợ phù hợp'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Tiêu đề */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ví dụ: Cần thợ sửa điện nước tại nhà"
                required
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Mô tả chi tiết công việc cần làm..."
                rows={6}
                required
              />
            </div>

            {/* Địa điểm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa điểm
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ví dụ: Quận 1, TP.HCM"
              />
            </div>

            {/* Thời gian mong muốn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian mong muốn
              </label>
              <input
                type="datetime-local"
                value={formData.desiredTime}
                onChange={(e) => setFormData({ ...formData, desiredTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Ngân sách */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngân sách (VNĐ)
              </label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ví dụ: 500000"
                min="0"
              />
            </div>

            {/* Hình ảnh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh
              </label>
              <div className="space-y-3">
                {!isEditMode && (
                  <div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setSelectedFiles(files)
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Chọn tối đa 10 ảnh, mỗi ảnh tối đa 5MB.</p>
                  </div>
                )}

                {!isEditMode && selectedFiles.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">Đã chọn {selectedFiles.length} file:</p>
                    <ul className="space-y-1 text-sm text-blue-700">
                      {selectedFiles.map((file, index) => (
                        <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                          >
                            Xóa
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Display added images */}
                {formData.imageUrls && formData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Hình ảnh ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23d1d5db" viewBox="0 0 24 24"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/%3E%3C/svg%3E'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentImageUrls = formData.imageUrls || []
                            setFormData({
                              ...formData,
                              imageUrls: currentImageUrls.filter((_, i) => i !== index)
                            })
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading
                  ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...')
                  : (isEditMode ? 'Cập nhật bài đăng' : 'Tạo bài đăng')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
