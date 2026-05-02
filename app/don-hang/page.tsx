'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import Header from '@/app/components/Header'
import { AuthService } from '@/lib/api/auth.service'
import { orderService, type Order, type OrderStats } from '@/lib/api/order.service'

export default function DonHangPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<'customer' | 'provider' | ''>('')
  const [orderNumberQuery, setOrderNumberQuery] = useState('')
  const [searchingOrder, setSearchingOrder] = useState(false)

  useEffect(() => {
    const token = AuthService.getToken()
    if (!token) {
      router.push('/dang-nhap')
      return
    }

    fetchOrders()
    fetchStats()
  }, [router, statusFilter, roleFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('📦 [Orders Page] Fetching orders...')

      const response = await orderService.getOrders({
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        limit: 50
      })
      console.log('✅ [Orders Page] Orders fetched from API:', response)
      setOrders(response.data)
      setError('')
    } catch (err: any) {
      console.error('❌ [Orders Page] Fatal error:', err)
      setError(err.message || 'Không thể tải đơn hàng từ API')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      console.log('📊 [Orders Page] Fetching stats...')

      const response = await orderService.getStats()
      console.log('✅ [Orders Page] Stats fetched from API:', response)
      setStats(response)
    } catch (err: any) {
      console.error('❌ [Orders Page] Error fetching stats:', err)
      setStats(null)
    }
  }

  const handleProviderComplete = async (orderId: string) => {
    if (!confirm('Bạn đã hoàn thành công việc này?')) return
    
    try {
      await orderService.providerComplete(orderId)
      fetchOrders()
      fetchStats()
    } catch (err) {
      console.error('Error completing order:', err)
      alert('Không thể hoàn thành đơn hàng')
    }
  }

  const handleCustomerComplete = async (orderId: string) => {
    const rating = prompt('Đánh giá từ 1-5 sao:')
    if (!rating) return

    const review = prompt('Nhận xét của bạn:')
    
    try {
      await orderService.customerComplete(orderId, parseInt(rating), review || '')
      fetchOrders()
      fetchStats()
    } catch (err) {
      console.error('Error completing order:', err)
      alert('Không thể hoàn thành đơn hàng')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Lý do hủy đơn:')
    if (!reason) return
    
    try {
      await orderService.cancelOrder(orderId, reason)
      fetchOrders()
      fetchStats()
    } catch (err) {
      console.error('Error canceling order:', err)
      alert('Không thể hủy đơn hàng')
    }
  }

  const handleSearchByOrderNumber = async () => {
    const value = orderNumberQuery.trim()
    if (!value) {
      fetchOrders()
      return
    }

    try {
      setSearchingOrder(true)
      setError('')
      const order = await orderService.getOrderByNumber(value)
      setOrders(order ? [order] : [])
    } catch (err: any) {
      console.error('Error searching order by number:', err)
      setOrders([])
      setError(err?.message || 'Không tìm thấy đơn hàng theo mã số')
    } finally {
      setSearchingOrder(false)
    }
  }

  const handleViewOrderDetail = async (orderId: string) => {
    try {
      setDetailLoadingId(orderId)
      const detail = await orderService.getOrderById(orderId)
      setSelectedOrder(detail)
    } catch (err: any) {
      alert(err?.message || 'Không thể tải chi tiết đơn hàng')
    } finally {
      setDetailLoadingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'PROVIDER_COMPLETED':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ'
      case 'CONFIRMED':
        return 'Đã xác nhận'
      case 'IN_PROGRESS':
        return 'Đang thực hiện'
      case 'PROVIDER_COMPLETED':
        return 'Thợ đã hoàn thành'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
    <div className="flex h-screen flex-col overflow-hidden bg-surface-lowest">
      <Header />
      <div className="flex-shrink-0 border-b border-outline-variant/60 bg-surface shadow-app-bar">
        <div className="app-container py-app-sm">
          <h1 className="mb-app-sm text-xl font-bold text-foreground">Quản lý đơn hàng</h1>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Tổng đơn</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-600 mb-1">Đang chờ</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600 mb-1">Đang làm</p>
                <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 mb-1">Đã hủy</p>
                <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === '' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'PENDING' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Đang chờ
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'IN_PROGRESS' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Đang làm
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                statusFilter === 'COMPLETED' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Hoàn thành
            </button>
          </div>

          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setRoleFilter('')}
              className={`px-4 py-2 rounded-lg text-sm ${
                roleFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Tất cả vai trò
            </button>
            <button
              onClick={() => setRoleFilter('customer')}
              className={`px-4 py-2 rounded-lg text-sm ${
                roleFilter === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Khách hàng
            </button>
            <button
              onClick={() => setRoleFilter('provider')}
              className={`px-4 py-2 rounded-lg text-sm ${
                roleFilter === 'provider' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Thợ
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={orderNumberQuery}
              onChange={(e) => setOrderNumberQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchByOrderNumber()}
              placeholder="Tìm theo mã đơn (vd: DH123456)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleSearchByOrderNumber}
              disabled={searchingOrder}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {searchingOrder ? 'Đang tìm...' : 'Tra mã đơn'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {selectedOrder && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-4 rounded-lg mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-blue-700">Chi tiết đơn hàng đã chọn</p>
                  <h3 className="text-lg font-semibold mt-1">#{selectedOrder.orderNumber}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  Đóng
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white border border-blue-100 rounded-lg p-3">
                  <p className="text-blue-700">Giá trị đơn</p>
                  <p className="font-semibold mt-1">{selectedOrder.price.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="bg-white border border-blue-100 rounded-lg p-3">
                  <p className="text-blue-700">Trạng thái</p>
                  <p className="font-semibold mt-1">{getStatusText(selectedOrder.status)}</p>
                </div>
                <div className="bg-white border border-blue-100 rounded-lg p-3">
                  <p className="text-blue-700">Ngày tạo</p>
                  <p className="font-semibold mt-1">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div className="mt-3 bg-white border border-blue-100 rounded-lg p-3 text-sm text-gray-700">
                {selectedOrder.description || 'Không có mô tả'}
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng</h3>
              <p className="text-gray-500">Các đơn hàng của bạn sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👤 {order.customerName || 'Khách hàng'}</span>
                        <span>🔧 {order.providerName || 'Thợ'}</span>
                        <span>📅 {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-orange-600">
                        {order.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleViewOrderDetail(order.id)}
                      disabled={detailLoadingId === order.id}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      {detailLoadingId === order.id ? 'Đang tải...' : 'Xem chi tiết'}
                    </button>
                    
                    {order.status === 'CONFIRMED' && roleFilter === 'provider' && (
                      <button
                        onClick={() => handleProviderComplete(order.id)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        Hoàn thành
                      </button>
                    )}
                    
                    {order.status === 'PROVIDER_COMPLETED' && roleFilter === 'customer' && (
                      <button
                        onClick={() => handleCustomerComplete(order.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Xác nhận & Đánh giá
                      </button>
                    )}
                    
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
    </AppShell>
  )
}
