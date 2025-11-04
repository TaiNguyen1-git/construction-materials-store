'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'
import Pagination from '@/components/Pagination'

interface Customer {
  id: string
  name: string
  email: string
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
}

interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customer?: Customer
  customerName?: string
  customerEmail?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  customerType: 'REGISTERED' | 'GUEST'
  orderItems: OrderItem[]
  totalAmount: number
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED_AWAITING_DEPOSIT' | 'DEPOSIT_PAID' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  shippingAddress: string | any
  paymentMethod: string
  paymentStatus?: string
  paymentType?: 'FULL' | 'DEPOSIT'
  depositPercentage?: number
  depositAmount?: number
  remainingAmount?: number
  depositPaidAt?: string
  depositProof?: string
  confirmedBy?: string
  confirmedAt?: string
  trackingNumber?: string
  note?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [previousOrderCount, setPreviousOrderCount] = useState(0)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    page: 1
  })

  useEffect(() => {
    fetchOrders()
    fetchCustomers()
  }, [filters])

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true) // Silent refresh
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [filters])

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.customerId) params.append('customerId', filters.customerId)
      params.append('page', filters.page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both nested and flat response structures
        const ordersData = data.data?.orders || data.orders || data.data?.data || data.data || []
        const ordersArray = Array.isArray(ordersData) ? ordersData : []
        const paginationData = data.data?.pagination || data.pagination || {}
        
        console.log('Fetched orders:', ordersArray.length)
        
        // Update pagination
        if (paginationData.total !== undefined) {
          setPagination({
            total: paginationData.total || 0,
            page: paginationData.page || filters.page,
            limit: paginationData.limit || 20,
            pages: paginationData.pages || Math.ceil((paginationData.total || 0) / (paginationData.limit || 20))
          })
        }
        
        // Check for new orders and show notification
        if (silent && ordersArray.length > previousOrderCount && previousOrderCount > 0) {
          const newOrdersCount = ordersArray.length - previousOrderCount
          toast.success(`🔔 ${newOrdersCount} đơn hàng mới!`, {
            duration: 5000,
            icon: '🎉'
          })
        }
        
        setPreviousOrderCount(ordersArray.length)
        setOrders(ordersArray)
      } else {
        console.error('Orders API error:', response.status)
        if (!silent) toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      if (!silent) toast.error('Failed to load orders')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        // Handle nested data structure
        const customersData = data.data?.data || data.data || []
        const customersArray = Array.isArray(customersData) ? customersData : []
        console.log('Fetched customers:', customersArray.length)
        setCustomers(customersArray)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber })
      })

      if (response.ok) {
        toast.success(`Trạng thái đơn hàng đã cập nhật thành ${status === 'CONFIRMED' ? 'Xác nhận' : status === 'PROCESSING' ? 'Đang xử lý' : status === 'SHIPPED' ? 'Đã gửi' : status === 'COMPLETED' ? 'Hoàn thành' : status.toLowerCase()}`)
        fetchOrders()
        setShowModal(false)
      } else {
        const error = await response.json()
        // Extract error message from API response structure: { success, error: { code, message, details } }
        const errorMessage = error.error?.message || error.message || 'Không thể cập nhật trạng thái đơn hàng'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Không thể cập nhật trạng thái đơn hàng')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'bg-orange-100 text-orange-800'
      case 'CONFIRMED_AWAITING_DEPOSIT': return 'bg-amber-100 text-amber-800'
      case 'DEPOSIT_PAID': return 'bg-cyan-100 text-cyan-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'RETURNED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'Chờ Xác Nhận'
      case 'CONFIRMED_AWAITING_DEPOSIT': return 'Chờ Cọc'
      case 'DEPOSIT_PAID': return 'Đã Cọc'
      case 'PENDING': return 'Chờ Xử Lý'
      case 'CONFIRMED': return 'Đã Xác Nhận'
      case 'PROCESSING': return 'Đang Xử Lý'
      case 'SHIPPED': return 'Đang Giao'
      case 'DELIVERED': return 'Đã Giao'
      case 'COMPLETED': return 'Hoàn Thành'
      case 'CANCELLED': return 'Đã Hủy'
      case 'RETURNED': return 'Đã Trả Hàng'
      default: return status
    }
  }

  const getNextStatus = (currentStatus: string, paymentType?: string) => {
    // For deposit orders - no manual status change from PENDING_CONFIRMATION or CONFIRMED_AWAITING_DEPOSIT
    if (paymentType === 'DEPOSIT') {
      switch (currentStatus) {
        case 'DEPOSIT_PAID': return 'PROCESSING'
        case 'PROCESSING': return 'SHIPPED'
        case 'SHIPPED': return 'DELIVERED'
        case 'DELIVERED': return 'COMPLETED'
        default: return null
      }
    }
    
    // For regular orders
    switch (currentStatus) {
      case 'PENDING': return 'CONFIRMED'
      case 'CONFIRMED': return 'PROCESSING'
      case 'PROCESSING': return 'SHIPPED'
      case 'SHIPPED': return 'DELIVERED'
      case 'DELIVERED': return 'COMPLETED'
      default: return null
    }
  }
  
  const confirmOrder = async (orderId: string, action: 'confirm' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })
      
      if (response.ok) {
        toast.success(action === 'confirm' ? 'Đơn hàng đã được xác nhận' : 'Đơn hàng đã bị từ chối')
        fetchOrders()
        setShowModal(false)
      } else {
        const error = await response.json()
        // Extract error message from API response structure: { success, error: { code, message, details } }
        const errorMessage = error.error?.message || error.message || 'Không thể xử lý đơn hàng'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error('Không thể xử lý đơn hàng')
    }
  }
  
  const confirmDeposit = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/deposit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        toast.success('Đã xác nhận nhận tiền cọc')
        fetchOrders()
        setShowModal(false)
      } else {
        const error = await response.json()
        // Extract error message from API response structure: { success, error: { code, message, details } }
        const errorMessage = error.error?.message || error.message || 'Không thể xác nhận tiền cọc'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error confirming deposit:', error)
      toast.error('Không thể xác nhận tiền cọc')
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return

    try {
      const response = await fetch(`/api/orders/${deletingOrder.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa đơn hàng thành công')
        setDeletingOrder(null)
        setShowDeleteDialog(false)
        fetchOrders()
      } else {
        const error = await response.json()
        // Extract error message from API response structure: { success, error: { code, message, details } }
        const errorMessage = error.error?.message || error.message || 'Không thể xóa đơn hàng'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Không thể xóa đơn hàng')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            🔄 Tự động cập nhật mỗi 30 giây
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            >
              <option value="">Tất Cả Trạng Thái</option>
              <option value="PENDING_CONFIRMATION">Chờ Xác Nhận</option>
              <option value="CONFIRMED_AWAITING_DEPOSIT">Chờ Cọc</option>
              <option value="DEPOSIT_PAID">Đã Cọc</option>
              <option value="PENDING">Chờ Xử Lý</option>
              <option value="CONFIRMED">Đã Xác Nhận</option>
              <option value="PROCESSING">Đang Xử Lý</option>
              <option value="SHIPPED">Đang Giao</option>
              <option value="DELIVERED">Đã Giao</option>
              <option value="COMPLETED">Hoàn Thành</option>
              <option value="CANCELLED">Đã Hủy</option>
              <option value="RETURNED">Đã Trả Hàng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khách Hàng</label>
            <select
              value={filters.customerId}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            >
              <option value="">Tất Cả Khách Hàng</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', customerId: '', page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Xóa Bộ Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn Hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng Tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      {order.trackingNumber && (
                        <div className="text-sm text-gray-500">Mã vận đơn: {order.trackingNumber}</div>
                      )}
                      {order.customerType === 'GUEST' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          Khách vãng lai
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName || order.customer?.name || order.guestName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerEmail || order.customer?.email || order.guestEmail || 'N/A'}
                      </div>
                      {order.guestPhone && (
                        <div className="text-sm text-gray-500">📞 {order.guestPhone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.orderItems.length} sản phẩm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.totalAmount.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      {order.paymentType === 'DEPOSIT' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                          🏦 Cọc {order.depositPercentage}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        👁️ Xem
                      </button>
                      
                      {/* Confirm/Reject buttons for pending orders */}
                      {order.status === 'PENDING_CONFIRMATION' && (
                        <>
                          <button
                            onClick={() => confirmOrder(order.id, 'confirm')}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            ✅ Xác nhận
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Lý do từ chối:')
                              if (reason) confirmOrder(order.id, 'reject', reason)
                            }}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            ❌ Từ chối
                          </button>
                        </>
                      )}
                      
                      {/* Confirm deposit button */}
                      {order.status === 'CONFIRMED_AWAITING_DEPOSIT' && (
                        <button
                          onClick={() => {
                            if (confirm('Xác nhận đã nhận tiền cọc?')) {
                              confirmDeposit(order.id)
                            }
                          }}
                          className="text-cyan-600 hover:text-cyan-900 text-sm font-medium"
                        >
                          💰 Xác nhận cọc
                        </button>
                      )}
                      
                      {/* Regular status progression */}
                      {getNextStatus(order.status, order.paymentType) && (
                        <button
                          onClick={() => updateOrderStatus(order.id, getNextStatus(order.status, order.paymentType)!)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                        >
                          ➡️ {getStatusLabel(getNextStatus(order.status, order.paymentType)!)}
                        </button>
                      )}
                      
                      {/* Cancel button */}
                      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'DELIVERED' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          className="text-orange-600 hover:text-orange-900 text-sm font-medium"
                        >
                          🚫 Hủy
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeletingOrder(order)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => setFilters({ ...filters, page })}
          loading={loading}
        />
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Chi Tiết Đơn Hàng</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Đóng</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số Đơn Hàng</label>
                  <p className="text-sm text-gray-900">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng Thái</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Khách Hàng</label>
                <div className="text-sm text-gray-900">
                  <p className="font-medium">
                    {selectedOrder.customerName || selectedOrder.customer?.name || selectedOrder.guestName || 'N/A'}
                    {selectedOrder.customerType === 'GUEST' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Khách vãng lai
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600">
                    📧 {selectedOrder.customerEmail || selectedOrder.customer?.email || selectedOrder.guestEmail || 'N/A'}
                  </p>
                  {selectedOrder.guestPhone && (
                    <p className="text-gray-600">📞 {selectedOrder.guestPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sản Phẩm Đặt Hàng</label>
                <div className="mt-2 border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số Lượng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Giá Đơn Vị</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tổng</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.product.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.unitPrice.toLocaleString()}đ</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.totalPrice.toLocaleString()}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng: {selectedOrder.totalAmount.toLocaleString()}đ</span>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Địa Chỉ Giao Hàng</label>
                  <p className="text-sm text-gray-900">
                    {typeof selectedOrder.shippingAddress === 'string' 
                      ? selectedOrder.shippingAddress 
                      : `${selectedOrder.shippingAddress.address || ''}, ${selectedOrder.shippingAddress.ward || ''}, ${selectedOrder.shippingAddress.district || ''}, ${selectedOrder.shippingAddress.city || ''}`
                    }
                  </p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã Vận Đơn</label>
                  <p className="text-sm text-gray-900">{selectedOrder.trackingNumber}</p>
                </div>
              )}

              {(selectedOrder.note || selectedOrder.notes) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghi Chú</label>
                  <p className="text-sm text-gray-900">{selectedOrder.note || selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Phương Thức Thanh Toán</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900">{selectedOrder.paymentMethod}</p>
                  {selectedOrder.paymentStatus && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 
                      selectedOrder.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 
                       selectedOrder.paymentStatus === 'PENDING' ? 'Chờ thanh toán' :
                       selectedOrder.paymentStatus === 'PARTIAL' ? 'Đã cọc' : 
                       'Thất bại'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Deposit Information */}
              {selectedOrder.paymentType === 'DEPOSIT' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏦</span>
                    Thông Tin Đặt Cọc
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tỷ lệ cọc:</p>
                      <p className="text-lg font-bold text-gray-900">{selectedOrder.depositPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số tiền cọc:</p>
                      <p className="text-lg font-bold text-green-600">{selectedOrder.depositAmount?.toLocaleString()}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Còn lại:</p>
                      <p className="text-lg font-bold text-blue-600">{selectedOrder.remainingAmount?.toLocaleString()}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái:</p>
                      <p className={`text-sm font-bold ${
                        selectedOrder.status === 'DEPOSIT_PAID' ? 'text-cyan-600' :
                        selectedOrder.status === 'CONFIRMED_AWAITING_DEPOSIT' ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {selectedOrder.status === 'DEPOSIT_PAID' ? '✅ Đã nhận cọc' :
                         selectedOrder.status === 'CONFIRMED_AWAITING_DEPOSIT' ? '⏳ Chờ khách cọc' :
                         selectedOrder.status === 'PENDING_CONFIRMATION' ? '🔍 Chờ xác nhận' :
                         'Đang xử lý'}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.depositPaidAt && (
                    <div className="mt-3 pt-3 border-t border-yellow-300">
                      <p className="text-sm text-gray-600">
                        Ngày nhận cọc: <span className="font-semibold text-gray-900">
                          {new Date(selectedOrder.depositPaidAt).toLocaleString('vi-VN')}
                        </span>
                      </p>
                    </div>
                  )}
                  {selectedOrder.confirmedBy && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Xác nhận bởi: <span className="font-semibold text-gray-900">{selectedOrder.confirmedBy}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeletingOrder(null)
        }}
        onConfirm={handleDeleteOrder}
        title="Xóa Đơn Hàng"
        message={`Bạn có chắc muốn xóa đơn hàng "${deletingOrder?.orderNumber}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />
    </div>
  )
}