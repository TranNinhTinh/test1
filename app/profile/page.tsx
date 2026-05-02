'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import AppShell from '@/app/components/AppShell'
import { ProfileService, ProfileResponse, UpdateProfileDto, UpdateContactDto, ChangeDisplayNameDto } from '@/lib/api/profile-new.service'
import { PostService } from '@/lib/api/post.service'
import { AuthService } from '@/lib/api/auth.service'
import { UserService } from '@/lib/api/user.service'
import { resolveMediaUrl as normalizeImageUrl } from '@/lib/media-url'

export default function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'contact' | 'display-name' | 'avatar' | 'my-posts' | 'change-password'>('view')
  const [isSaving, setIsSaving] = useState(false)

  // My Posts states
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editPostForm, setEditPostForm] = useState<any>({})
  const [postsLoaded, setPostsLoaded] = useState(false)

  // Form states
  const [editForm, setEditForm] = useState<UpdateProfileDto>({})
  const [contactForm, setContactForm] = useState<UpdateContactDto>({})
  const [displayNameForm, setDisplayNameForm] = useState({ displayName: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load profile on mount
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/dang-nhap')
      return
    }

    loadProfile()
  }, [router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await ProfileService.getMyProfile()
      const resolvedAvatarUrl = normalizeImageUrl((data as any).avatarUrl || (data as any).avatar)
      const normalizedProfile = {
        ...data,
        avatarUrl: resolvedAvatarUrl,
      }

      setAvatarLoadError(false)
      setProfile(normalizedProfile)
      setEditForm({
        fullName: data.fullName,
        bio: data.bio,
        address: data.address,
        gender: data.gender,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      })
      setContactForm({
        email: data.email || '',
        phone: data.phone || '',
      })
      setDisplayNameForm({ displayName: data.displayName || '' })
      setError('')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không tải được hồ sơ'
      console.error('Error loading profile:', err)
      
      // Check for Unauthorized
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
        setError('❌ Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
        setTimeout(() => {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          router.push('/dang-nhap')
        }, 2000)
      } else {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true)
      setError('')
      const updated = await ProfileService.updateProfile(editForm)
      setProfile(prev => ({
        ...updated,
        avatarUrl: normalizeImageUrl((updated as any).avatarUrl || (updated as any).avatar || prev?.avatarUrl),
      }))
      setActiveTab('view')
      alert('✅ Cập nhật hồ sơ thành công')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateContact = async () => {
    try {
      setIsSaving(true)
      setError('')
      const updated = await ProfileService.updateContact(contactForm)
      setProfile(prev => ({
        ...updated,
        avatarUrl: normalizeImageUrl((updated as any).avatarUrl || (updated as any).avatar || prev?.avatarUrl),
      }))
      setActiveTab('view')
      alert('✅ Cập nhật thông tin liên hệ thành công')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thông tin liên hệ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeDisplayName = async () => {
    try {
      setIsSaving(true)
      setError('')
      const response = await ProfileService.changeDisplayName(displayNameForm)
      await loadProfile()
      setActiveTab('view')
      alert(`✅ ${response.message}\nSố ngày tới lần đổi tiếp theo: ${response.daysUntilNextChange}`)
    } catch (err: any) {
      const message = err.message || 'Không thể đổi tên hiển thị'
      if (err.daysUntilCanChange) {
        setError(`${message}\nSố ngày còn lại: ${err.daysUntilCanChange}`)
      } else {
        setError(message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAvatar = async () => {
    try {
      setIsSaving(true)
      setError('')

      if (!avatarFile) {
        throw new Error('Vui lòng chọn ảnh từ máy để cập nhật ảnh đại diện')
      }

      const updated = await ProfileService.uploadAvatarFile(avatarFile)

      const resolvedAvatarUrl = normalizeImageUrl((updated as any).avatarUrl || (updated as any).avatar || profile?.avatarUrl)
      setProfile({
        ...updated,
        avatarUrl: resolvedAvatarUrl,
      })
      setAvatarFile(null)
      setAvatarPreviewUrl('')
      setAvatarLoadError(false)
      setActiveTab('view')
      alert('✅ Cập nhật ảnh đại diện thành công')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật ảnh đại diện')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa tài khoản? Bạn có thể khôi phục trong vòng 30 ngày.')) {
      return
    }

    try {
      setIsSaving(true)
      setError('')
      const response = await ProfileService.deleteAccount()
      alert(response.message)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      router.push('/dang-nhap')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tài khoản')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setIsSaving(true)
      setError('')

      if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
        throw new Error('Vui lòng nhập đầy đủ thông tin đổi mật khẩu')
      }

      if (changePasswordForm.newPassword.length < 8) {
        throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự')
      }

      if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp')
      }

      await UserService.changePassword(changePasswordForm)
      setChangePasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      alert('✅ Đổi mật khẩu thành công')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu')
    } finally {
      setIsSaving(false)
    }
  }

  // Post APIs
  const loadMyPosts = async () => {
    try {
      setPostsLoading(true)
      setPostsError('')
      const response = await PostService.getMyPosts({ limit: 50 })
      setMyPosts(response.data || [])
      setPostsLoaded(true)
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Không thể tải danh sách bài đăng')
      console.error('Error loading posts:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài đăng này?')) {
      return
    }

    try {
      await PostService.deletePost(postId)
      setMyPosts(myPosts.filter(p => p.id !== postId))
      alert('✅ Bài đăng đã xóa')
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Không thể xóa bài đăng')
    }
  }

  const handleClosePost = async (postId: string) => {
    try {
      const updatedPost = await PostService.closePost(postId)
      setMyPosts(myPosts.map(p => p.id === postId ? updatedPost : p))
      alert('✅ Bài đăng đã đóng')
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Không thể đóng bài đăng')
    }
  }

  const startEditPost = (post: any) => {
    setEditingPostId(post.id)
    setEditPostForm({
      title: post.title,
      description: post.description,
      imageUrls: post.imageUrls || [],
      location: post.location,
      desiredTime: post.desiredTime,
      budget: post.budget,
    })
  }

  const cancelEditPost = () => {
    setEditingPostId(null)
    setEditPostForm({})
  }

  const handleUpdatePost = async (postId: string) => {
    if (!editPostForm.title || !editPostForm.description) {
      alert('Vui lòng điền tiêu đề và mô tả')
      return
    }

    try {
      const updatedPost = await PostService.updatePost(postId, editPostForm)
      setMyPosts(myPosts.map(p => p.id === postId ? updatedPost : p))
      setEditingPostId(null)
      setEditPostForm({})
      alert('✅ Bài đăng đã cập nhật')
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Không thể cập nhật bài đăng')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-sm max-w-md w-full text-center">
          <p className="text-red-600 mb-4">Không tải được hồ sơ</p>
          <button
            onClick={() => router.push('/home')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
    <div className="flex min-h-screen flex-col bg-surface-lowest">
      {/* Header */}
      <Header />

      <div className="flex-1">
        {/* Back Button */}
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Hồ sơ của tôi</h1>
            <p className="text-gray-600 mt-2">Quản lý thông tin tài khoản và bài đăng của bạn</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {postsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {postsError}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b overflow-x-auto">
              {[
                { key: 'view', label: 'Xem hồ sơ' },
                { key: 'edit', label: 'Sửa hồ sơ' },
                { key: 'contact', label: 'Liên hệ' },
                { key: 'display-name', label: 'Tên hiển thị' },
                { key: 'avatar', label: 'Ảnh đại diện' },
                { key: 'change-password', label: 'Đổi mật khẩu' },
                { key: 'my-posts', label: 'Bài đăng của tôi' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any)
                    if (tab.key === 'my-posts' && !postsLoaded) {
                      loadMyPosts()
                    }
                  }}
                  className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* View Profile Tab */}
            {activeTab === 'view' && (
              <div className="space-y-6">
                {profile.avatarUrl && !avatarLoadError && (
                  <div className="flex justify-center">
                    <img
                      src={profile.avatarUrl}
                      alt="Ảnh đại diện"
                      onError={() => setAvatarLoadError(true)}
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-600"
                    />
                  </div>
                )}

                {(!profile.avatarUrl || avatarLoadError) && (
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-blue-600 flex items-center justify-center text-blue-700 text-2xl font-bold">
                      {(profile.displayName || profile.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Tên hiển thị</label>
                    <p className="text-lg text-gray-800">{profile.displayName || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Họ và tên</label>
                    <p className="text-lg text-gray-800">{profile.fullName || 'Chưa cập nhật'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-lg text-gray-800">{profile.email || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Số điện thoại</label>
                    <p className="text-lg text-gray-800">{profile.phone || 'Chưa cập nhật'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Giới tính</label>
                    <p className="text-lg text-gray-800">{profile.gender || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Ngày sinh</label>
                    <p className="text-lg text-gray-800">
                      {profile.birthday ? new Date(profile.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Địa chỉ</label>
                    <p className="text-lg text-gray-800">{profile.address || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Bio</label>
                    <p className="text-lg text-gray-800">{profile.bio || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-semibold text-gray-600">Đã xác thực</label>
                      <p>{profile.isVerified ? 'Có' : 'Không'}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600">Tài khoản hoạt động</label>
                      <p>{profile.isActive ? 'Có' : 'Không'}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600">Tham gia từ</label>
                      <p>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600">Cập nhật lần cuối</label>
                      <p>{new Date(profile.updatedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>

                {/* Display Name Change Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Thông tin đổi tên hiển thị</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Có thể đổi ngay: {profile.displayNameChangeInfo.canChange ? 'Có' : 'Không'}</p>
                    <p>Số lần đã đổi: {profile.displayNameChangeInfo.changeCount}</p>
                    <p>Số ngày tới lần đổi tiếp theo: {profile.displayNameChangeInfo.daysUntilNextChange}</p>
                    {profile.displayNameChangeInfo.lastChanged && (
                      <p>Lần đổi gần nhất: {new Date(profile.displayNameChangeInfo.lastChanged).toLocaleDateString('vi-VN')}</p>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t pt-6">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isSaving}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Xóa tài khoản
                  </button>
                  <p className="text-xs text-gray-600 mt-2">Có thể khôi phục tài khoản trong vòng 30 ngày</p>
                </div>
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleUpdateProfile()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    maxLength={255}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 255 ký tự</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={editForm.bio || ''}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 500 ký tự</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    maxLength={255}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 255 ký tự</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                    <select
                      value={editForm.gender || ''}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value || undefined })}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Chưa cập nhật</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                    <input
                      type="date"
                      value={
                        editForm.birthday
                          ? new Date(editForm.birthday).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={e => setEditForm({ ...editForm, birthday: e.target.value ? new Date(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleUpdateContact()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={contactForm.email || ''}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contactForm.phone || ''}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Định dạng Việt Nam: 10-11 số bắt đầu bằng 0 hoặc +84</p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Đang lưu...' : 'Cập nhật thông tin liên hệ'}
                </button>
              </form>
            )}

            {/* Display Name Tab */}
            {activeTab === 'display-name' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleChangeDisplayName()
                }}
                className="space-y-4"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> Bạn chỉ có thể đổi tên hiển thị 1 lần trong 30 ngày.
                    {!profile.displayNameChangeInfo.canChange && (
                      <div className="mt-2">
                        Số ngày còn lại: <strong>{profile.displayNameChangeInfo.daysUntilNextChange}</strong>
                      </div>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên hiển thị mới</label>
                  <input
                    type="text"
                    value={displayNameForm.displayName}
                    onChange={e => setDisplayNameForm({ displayName: e.target.value })}
                    minLength={3}
                    maxLength={100}
                    placeholder="3-100 ký tự"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    disabled={!profile.displayNameChangeInfo.canChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Chỉ dùng chữ cái, số, khoảng trắng. Độ dài 3-100 ký tự.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !profile.displayNameChangeInfo.canChange}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Đang đổi...' : 'Đổi tên hiển thị'}
                </button>
              </form>
            )}

            {/* Avatar Tab */}
            {activeTab === 'avatar' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleUpdateAvatar()
                }}
                className="space-y-4"
              >
                {(avatarPreviewUrl || profile?.avatarUrl) && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={avatarPreviewUrl || profile?.avatarUrl}
                      alt="Xem trước ảnh đại diện"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tải ảnh từ máy</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0] || null
                      setAvatarFile(file)
                      setAvatarLoadError(false)

                      if (!file) {
                        setAvatarPreviewUrl('')
                        return
                      }

                      const objectUrl = URL.createObjectURL(file)
                      setAvatarPreviewUrl(objectUrl)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Định dạng: jpg, jpeg, png, gif, webp. Tối đa 2MB.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Đang cập nhật...' : 'Cập nhật ảnh đại diện'}
                </button>
              </form>
            )}

            {/* Change Password Tab */}
            {activeTab === 'change-password' && (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleChangePassword()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={changePasswordForm.currentPassword}
                    onChange={e => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={changePasswordForm.newPassword}
                    onChange={e => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={changePasswordForm.confirmPassword}
                    onChange={e => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                </button>
              </form>
            )}

            {/* My Posts Tab */}
            {activeTab === 'my-posts' && (
              <div className="space-y-4">
                {!postsLoaded && (
                  <button
                    onClick={loadMyPosts}
                    disabled={postsLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {postsLoading ? 'Đang tải...' : 'Tải bài đăng của tôi'}
                  </button>
                )}

                {postsLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Đang tải bài đăng...</p>
                  </div>
                )}

                {postsLoaded && myPosts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Bạn chưa tạo bài đăng nào</p>
                    <button
                      onClick={() => router.push('/posts/create')}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                      + Tạo bài đăng mới
                    </button>
                  </div>
                )}

                {myPosts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Bài đăng của tôi ({myPosts.length})</h3>
                      <button
                        onClick={() => router.push('/posts/create')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        + Bài đăng mới
                      </button>
                    </div>

                    {myPosts.map(post => (
                      <div key={post.id} className="border rounded-lg bg-white hover:shadow-md transition">
                        {editingPostId === post.id ? (
                          // Edit Mode
                          <div className="p-6 space-y-4">
                            <h4 className="text-lg font-semibold">Chỉnh sửa bài đăng</h4>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                              <input
                                type="text"
                                value={editPostForm.title || ''}
                                onChange={e => setEditPostForm({ ...editPostForm, title: e.target.value })}
                                maxLength={255}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                              <textarea
                                value={editPostForm.description || ''}
                                onChange={e => setEditPostForm({ ...editPostForm, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                                <input
                                  type="text"
                                  value={editPostForm.location || ''}
                                  onChange={e => setEditPostForm({ ...editPostForm, location: e.target.value })}
                                  maxLength={255}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (VND)</label>
                                <input
                                  type="number"
                                  value={editPostForm.budget || ''}
                                  onChange={e => setEditPostForm({ ...editPostForm, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian mong muốn</label>
                              <input
                                type="datetime-local"
                                value={editPostForm.desiredTime ? new Date(editPostForm.desiredTime).toISOString().slice(0, 16) : ''}
                                onChange={e => setEditPostForm({ ...editPostForm, desiredTime: e.target.value ? new Date(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdatePost(post.id)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                              >
                                Lưu thay đổi
                              </button>
                              <button
                                onClick={cancelEditPost}
                                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-gray-800">{post.title}</h4>
                                <p className="text-gray-600 text-sm mt-1">{post.description?.substring(0, 100)}...</p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ml-2 ${post.status === 'open'
                                  ? 'bg-green-100 text-green-800'
                                  : post.status === 'closed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {post.status === 'open' ? '✅ Đang mở' : post.status === 'closed' ? '❌ Đã đóng' : post.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                              {post.location && <div>Địa điểm: {post.location}</div>}
                              {post.budget && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                                  </svg>
                                  {post.budget.toLocaleString('vi-VN')} VND
                                </div>
                              )}
                              <div>Ngày: {new Date(post.createdAt).toLocaleDateString('vi-VN')}</div>
                              {post.desiredTime && <div>Tg: {new Date(post.desiredTime).toLocaleDateString('vi-VN')}</div>}
                            </div>

                            {post.imageUrls && post.imageUrls.length > 0 && (
                              <div className="mb-4 flex gap-2 overflow-x-auto">
                                {post.imageUrls.map((url: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={normalizeImageUrl(url)}
                                    alt={`Post image ${idx + 1}`}
                                    className="h-16 w-16 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => router.push(`/posts/${post.id}`)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                              >
                                Xem
                              </button>
                              <button
                                onClick={() => startEditPost(post)}
                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
                              >
                                Sửa
                              </button>
                              {post.status === 'open' && (
                                <button
                                  onClick={() => handleClosePost(post.id)}
                                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm"
                                >
                                  Đóng
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  )
}
