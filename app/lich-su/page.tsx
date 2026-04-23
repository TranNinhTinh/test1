'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import { AuthService } from '@/lib/api/auth.service'
import Image from 'next/image'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  service: string
  price: string
  location: string
  customer: string
  status: 'Đang thực hiện' | 'Hoàn thành' | 'Đã hủy'
  createdAt: string
  completedAt?: string
  rating?: number
  review?: string
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Sửa chữa hệ thống điện',
    service: 'Sửa chữa điện',
    price: '800,000đ',
    location: 'Quận 1, TP.HCM',
    customer: 'Nguyễn Văn A',
    status: 'Đang thực hiện',
    createdAt: '15/11/2025'
  },
  {
    id: '2',
    title: 'Sửa ống nước rò rỉ',
    service: 'Thợ nước',
    price: '300,000đ',
    location: 'Thanh Khê, Đà Nẵng',
    customer: 'Trần Văn B',
    status: 'Hoàn thành',
    createdAt: '12/11/2025',
    completedAt: '13/11/2025',
    rating: 5,
    review: 'Thợ làm việc rất tốt, nhanh và sạch sẽ!'
  },
  {
    id: '3',
    title: 'Làm tủ bếp gỗ công nghiệp',
    service: 'Mộc - Đồ gỗ',
    price: '28,000,000đ',
    location: 'Quận Bình Thạnh, TP.HCM',
    customer: 'Hoàng Thu E',
    status: 'Hoàn thành',
    createdAt: '25/10/2025',
    completedAt: '10/11/2025',
    rating: 5,
    review: 'Tủ bếp đẹp, chất lượng tốt. Rất hài lòng!'
  },
  {
    id: '4',
    title: 'Vệ sinh máy lạnh',
    service: 'Điện lạnh',
    price: '250,000đ',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    customer: 'Phạm Minh T',
    status: 'Hoàn thành',
    createdAt: '08/11/2025',
    completedAt: '08/11/2025',
    rating: 4,
    review: 'Tốt, máy lạnh chạy mát hơn'
  },
  {
    id: '5',
    title: 'Lắp camera an ninh',
    service: 'Lắp đặt camera',
    price: '2,500,000đ',
    location: 'Thanh Khê, Đà Nẵng',
    customer: 'Đỗ Minh C',
    status: 'Hoàn thành',
    createdAt: '01/11/2025',
    completedAt: '02/11/2025',
    rating: 5,
    review: 'Lắp đặt chuyên nghiệp, hướng dẫn sử dụng rất chi tiết'
  },
  {
    id: '6',
    title: 'Sơn lại phòng khách',
    service: 'Sơn nhà',
    price: '3,500,000đ',
    location: 'Quận 7, TP.HCM',
    customer: 'Lê Thị H',
    status: 'Đã hủy',
    createdAt: '28/10/2025'
  },
  {
    id: '7',
    title: 'Thay ổ khóa cửa chính',
    service: 'Sửa khóa',
    price: '450,000đ',
    location: 'Hải Châu, Đà Nẵng',
    customer: 'Võ Văn D',
    status: 'Hoàn thành',
    createdAt: '20/10/2025',
    completedAt: '20/10/2025',
    rating: 5,
    review: 'Nhanh gọn, giá cả hợp lý'
  },
  {
    id: '8',
    title: 'Sửa bồn cầu bị tắc',
    service: 'Thông tắc',
    price: '200,000đ',
    location: 'Sơn Trà, Đà Nẵng',
    customer: 'Nguyễn Thị L',
    status: 'Hoàn thành',
    createdAt: '15/10/2025',
    completedAt: '15/10/2025',
    rating: 4,
    review: 'OK, giải quyết được vấn đề'
  }
]

export default function HistoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS)
  const [filter, setFilter] = useState<'all' | 'Đang thực hiện' | 'Hoàn thành' | 'Đã hủy'>('all')
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (!AuthService.isAuthenticated()) {
        router.push('/dang-nhap')
      } else {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang thực hiện':
        return 'bg-blue-100 text-blue-800'
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800'
      case 'Đã hủy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    total: jobs.length,
    inProgress: jobs.filter(j => j.status === 'Đang thực hiện').length,
    completed: jobs.filter(j => j.status === 'Hoàn thành').length,
    cancelled: jobs.filter(j => j.status === 'Đã hủy').length,
    totalRevenue: jobs
      .filter(j => j.status === 'Hoàn thành')
      .reduce((sum, j) => sum + parseInt(j.price.replace(/[,.đ]/g, '')), 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Thợ Tốt"
                width={120}
                height={95}
                className="object-contain"
                style={{ maxWidth: '120px', height: 'auto' }}
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              <a href="/profile" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">U</div>
                <div className="flex-1"><div className="font-medium text-sm">Người dùng</div></div>
              </a>

              <a href="/home" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm">Trang chủ</span>
              </a>

              <a href="/tin-nhan" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm">Tin nhắn</span>
              </a>

              <a href="/thong-bao" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm">Thông báo</span>
              </a>

              <a href="/da-luu" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-sm">Đã lưu</span>
              </a>

              <a href="/lich-su" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Lịch sử yêu cầu</span>
              </a>

              <a href="/yeu-thich" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm">Thợ yêu thích</span>
              </a>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={async () => {
                await AuthService.logout()
                router.push('/dang-nhap')
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Lịch sử yêu cầu</h1>
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="text-blue-600 text-sm font-medium mb-1">Tổng công việc</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <div className="text-yellow-600 text-sm font-medium mb-1">Đang thực hiện</div>
                  <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="text-green-600 text-sm font-medium mb-1">Hoàn thành</div>
                  <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                  <div className="text-red-600 text-sm font-medium mb-1">Đã hủy</div>
                  <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="text-purple-600 text-sm font-medium mb-1">Tổng thu nhập</div>
                  <div className="text-2xl font-bold text-purple-900">{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-4 border-b border-gray-200">
                <button
                  onClick={() => setFilter('all')}
                  className={`pb-3 px-2 font-medium transition ${filter === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Tất cả ({jobs.length})
                </button>
                <button
                  onClick={() => setFilter('Đang thực hiện')}
                  className={`pb-3 px-2 font-medium transition ${filter === 'Đang thực hiện'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Đang thực hiện ({stats.inProgress})
                </button>
                <button
                  onClick={() => setFilter('Hoàn thành')}
                  className={`pb-3 px-2 font-medium transition ${filter === 'Hoàn thành'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Hoàn thành ({stats.completed})
                </button>
                <button
                  onClick={() => setFilter('Đã hủy')}
                  className={`pb-3 px-2 font-medium transition ${filter === 'Đã hủy'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Đã hủy ({stats.cancelled})
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có lịch sử</h3>
                  <p className="text-gray-500">Các công việc bạn đã làm sẽ hiển thị tại đây</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                              <span className="text-sm text-gray-500">#{job.id}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span>{job.service}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Khách hàng: {job.customer}</span>
                              </div>
                              <div className="flex items-center gap-2 font-semibold text-green-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{job.price}</span>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                              <span>Ngày tạo: {job.createdAt}</span>
                              {job.completedAt && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Hoàn thành: {job.completedAt}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rating & Review */}
                        {job.rating && job.review && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < job.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-2 text-sm text-gray-600">({job.rating}/5)</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 italic">&quot;{job.review}&quot;</p>
                          </div>
                        )}

                        {/* Actions */}
                        {job.status === 'Đang thực hiện' && (
                          <div className="mt-4 flex gap-3">
                            <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                              Hoàn thành công việc
                            </button>
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                              Liên hệ khách hàng
                            </button>
                          </div>
                        )}
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
  )
}
