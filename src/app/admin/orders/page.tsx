'use client'

import { useState, useEffect, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import ConfirmDialog from '@/components/ConfirmDialog'
import Pagination from '@/components/Pagination'
import dynamic from 'next/dynamic'

// Internal Components
import NewsletterBanner from './components/NewsletterBanner'
import OrderFilters from './components/OrderFilters'
import OrderBulkActions from './components/OrderBulkActions'
import OrdersTable from './components/OrdersTable'

// Dynamic Imports for Modals
const OrderDetailsModal = dynamic(() => import('./components/OrderDetailsModal'), {
  loading: () => <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})

// Types
import { Order, Customer, OrderFilters as OrderFiltersType } from './types'

const BANK_INFO = {
  bankId: '970423',
  accountNumber: '06729594301',
  accountName: 'NGUYEN THANH TAI'
}

export default function OrdersPage() {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  
  const [filters, setFilters] = useState<OrderFiltersType>({
    status: '',
    customerId: '',
    customerType: '',
    search: '',
    page: 1
  })

  const [searchInput, setSearchInput] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, filters.search])

  // Fetch Orders with React Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.customerId) params.append('customerId', filters.customerId)
      if (filters.customerType) params.append('customerType', filters.customerType)
      if (filters.search) params.append('search', filters.search)
      params.append('page', filters.page.toString())
      params.append('limit', '20')

      const response = await fetchWithAuth(`/api/orders?${params}`)
      if (!response.ok) throw new Error('Network response was not ok')
      return await response.json()
    },
    staleTime: 60000,
    refetchInterval: 30000 
  })

  // Fetch Customers with React Query
  const { data: customersData } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      return data.data?.data || data.data || []
    },
    staleTime: 5 * 60000
  })

  const orders = ordersData?.data?.orders || ordersData?.orders || []
  const paginationData = ordersData?.data?.pagination || ordersData?.pagination || { total: 0, page: 1, limit: 20, pages: 0 }
  const customers = (customersData || []) as Customer[]

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const resp = await fetchWithAuth(`/api/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      if (!resp.ok) throw new Error('Update failed')
      return resp
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      setShowModal(false)
    },
    onError: () => toast.error('Lỗi khi cập nhật')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetchWithAuth(`/api/orders/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Delete failed')
    },
    onSuccess: () => {
      toast.success('Đã xóa thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      setShowDeleteDialog(false)
    },
    onError: () => toast.error('Lỗi khi xóa')
  })

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
      return Promise.all(ids.map(id => fetchWithAuth(`/api/orders/${id}/status`, {
        method: 'PUT', body: JSON.stringify({ status })
      })))
    },
    onSuccess: () => {
      toast.success('Cập nhật hàng loạt thành công')
      setSelectedOrderIds([])
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }
  })

  const confirmMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string, action: string, reason?: string }) => {
      const resp = await fetchWithAuth(`/api/orders/${id}/confirm`, {
        method: 'PUT', body: JSON.stringify({ action, reason })
      })
      if (!resp.ok) throw new Error('Confirm failed')
    },
    onSuccess: () => {
      toast.success('Xử lý thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      setShowModal(false)
    }
  })

  const depositMutation = useMutation({
    mutationFn: async (id: string) => {
      const resp = await fetchWithAuth(`/api/orders/${id}/deposit`, { method: 'PUT' })
      if (!resp.ok) throw new Error('Deposit failed')
    },
    onSuccess: () => {
      toast.success('Xác nhận đặt cọc thành công')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }
  })

  // Bulk Print Logic
  const handleBulkPrint = () => {
    if (selectedOrderIds.length === 0) return
    const selectedOrders = orders.filter((o: Order) => selectedOrderIds.includes(o.id))
    
    const w = window.open('', '_blank')
    if (!w) return

    let content = ''
    selectedOrders.forEach((order: Order, idx: number) => {
      const items = order.orderItems.map(i => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.product.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${i.unitPrice.toLocaleString()}đ</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(i.quantity * i.unitPrice).toLocaleString()}đ</td>
        </tr>`).join('')

      content += `
        <div style="page-break-after: always; font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; margin-bottom: 20px;">
          <div style="display: flex; justify-between: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
             <div>
               <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">Phiếu Giao Hàng</h1>
               <p style="margin: 5px 0; color: #666;">Mã đơn: <b style="color: #000;">${order.orderNumber}</b></p>
               <p style="margin: 5px 0; color: #666;">Ngày lặp: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
             </div>
             <div style="text-align: right; flex-grow: 1;">
               <h2 style="margin: 0; font-size: 18px;">SMARTBUILD MATERIALS</h2>
               <p style="margin: 5px 0; font-size: 12px; color: #666;">Hệ thống Cung ứng Vật tư Công nghệ</p>
             </div>
          </div>

          <div style="margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
              <h3 style="font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 10px;">Khách hàng nhận</h3>
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${order.customerName || order.guestName}</p>
              <p style="margin: 5px 0; color: #444;">SĐT: ${order.customerPhone || order.guestPhone || 'N/A'}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #eee; font-size: 13px;">Sản phẩm</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #eee; font-size: 13px;">SL</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #eee; font-size: 13px;">Đơn giá</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #eee; font-size: 13px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${items}</tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
            <div style="width: 250px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Tổng giá trị hàng:</span>
                <span style="font-weight: bold;">${order.totalAmount.toLocaleString()}đ</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 10px; font-size: 18px; font-weight: bold;">
                <span>Cần thanh toán:</span>
                <span style="color: #e11d48;">${order.totalAmount.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; margin-top: 60px;">
            <div>
              <p style="margin-bottom: 60px;">Người lập phiếu</p>
              <p style="color: #ccc;">(Ký & ghi rõ họ tên)</p>
            </div>
            <div>
              <p style="margin-bottom: 60px;">Nhân viên giao hàng</p>
              <p style="color: #ccc;">(Ký & ghi rõ họ tên)</p>
            </div>
            <div>
              <p style="margin-bottom: 60px;">Khách hàng nhận</p>
              <p style="color: #ccc;">(Ký & ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      `
    })

    w.document.write(`<html><head><title>In hàng loạt đơn hàng</title></head><body>${content}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script></body></html>`)
    w.document.close()
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING_CONFIRMATION': return 'bg-orange-100 text-orange-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PROCESSING': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (s: string) => {
    switch (s) {
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
      default: return s
    }
  }

  const getNextStatus = (s: string, p?: string) => {
    if (p === 'DEPOSIT') {
      if (s === 'DEPOSIT_PAID') return 'PROCESSING'
      if (s === 'PROCESSING') return 'SHIPPED'
      if (s === 'SHIPPED') return 'DELIVERED'
      if (s === 'DELIVERED') return 'COMPLETED'
      return null
    }
    if (s === 'PENDING') return 'CONFIRMED'
    if (s === 'CONFIRMED') return 'PROCESSING'
    if (s === 'PROCESSING') return 'SHIPPED'
    if (s === 'SHIPPED') return 'DELIVERED'
    if (s === 'DELIVERED') return 'COMPLETED'
    return null
  }

  const handlePrint = (order: Order) => {
    const w = window.open('', '_blank')
    if (!w) return
    const items = order.orderItems.map(i => `<tr><td>${i.product.name}</td><td>${i.quantity}</td><td>${i.unitPrice.toLocaleString()}đ</td><td>${i.totalPrice.toLocaleString()}đ</td></tr>`).join('')
    w.document.write(`<html><head><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #eee;padding:10px;text-align:left}</style></head><body><h1>PHIẾU GIAO HÀNG #${order.orderNumber}</h1><p>Khách: ${order.customerName || order.guestName}</p><table><thead><tr><th>SP</th><th>SL</th><th>Giá</th><th>Tổng</th></tr></thead><tbody>${items}</tbody></table><p><b>Tổng: ${order.totalAmount.toLocaleString()}đ</b></p><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script></body></html>`)
    w.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          Quản Lý Đơn Hàng
          {ordersLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
        </h1>
        <button 
          onClick={() => {
            const refreshToast = toast.loading('Đang đồng bộ dữ liệu mới nhất...')
            Promise.all([
              queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
              queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
            ]).then(() => {
              toast.success('Dữ liệu đã được làm mới!', { id: refreshToast })
            }).catch(() => {
              toast.error('Lỗi khi làm mới dữ liệu', { id: refreshToast })
            })
          }} 
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 group"
        >
          <svg className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      <NewsletterBanner />

      <OrderFilters 
        filters={filters} searchInput={searchInput} setSearchInput={setSearchInput}
        setFilters={setFilters} customers={customers} getStatusLabel={getStatusLabel}
      />

      <OrderBulkActions 
        selectedCount={selectedOrderIds.length} 
        onClearSelection={() => setSelectedOrderIds([])}
        onBulkStatusUpdate={(s: string) => { if(confirm(`Cập nhật đơn hàng sang ${getStatusLabel(s)}?`)) bulkStatusMutation.mutate({ ids: selectedOrderIds, status: s })}}
        onBulkDelete={() => { if(confirm(`Xóa vĩnh viễn ${selectedOrderIds.length} đơn hàng?`)) Promise.all(selectedOrderIds.map((id: string) => deleteMutation.mutate(id))) }}
        onBulkPrint={handleBulkPrint}
        getStatusLabel={getStatusLabel}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {ordersLoading && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <OrdersTable 
          orders={orders} selectedOrderIds={selectedOrderIds}
          toggleSelectAll={() => setSelectedOrderIds(selectedOrderIds.length === orders.length ? [] : orders.map((o: Order)=>o.id))}
          toggleSelectOrder={(id: string) => setSelectedOrderIds(p => p.includes(id) ? p.filter(i=>i!==id) : [...p, id])}
          getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} getNextStatus={getNextStatus}
          onView={(o: Order) => { setSelectedOrder(o); setShowModal(true) }}
          onPrint={handlePrint} onDelete={(o: Order) => { setDeletingOrder(o); setShowDeleteDialog(true) }}
          onConfirm={(id: string, action: string, reason?: string) => confirmMutation.mutate({ id, action, reason })} 
          onConfirmDeposit={(id: string) => depositMutation.mutate(id)} 
          onUpdateStatus={(id: string, status: string) => updateStatusMutation.mutate({ id, status })}
          onOpenQR={(o: Order) => window.open(`https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact.png?amount=${o.totalAmount}&addInfo=DH%20${o.orderNumber}&accountName=${BANK_INFO.accountName}`)}
        />
      </div>

      <Pagination 
        currentPage={paginationData.page} totalPages={paginationData.pages}
        totalItems={paginationData.total} itemsPerPage={paginationData.limit}
        onPageChange={p => setFilters({ ...filters, page: p })} 
        loading={ordersLoading}
      />

      {showModal && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} onClose={() => setShowModal(false)}
          getStatusColor={getStatusColor} getStatusLabel={getStatusLabel}
        />
      )}

      {showDeleteDialog && deletingOrder && (
        <ConfirmDialog 
          isOpen={showDeleteDialog} title="Xóa đơn hàng"
          message={`Xóa đơn #${deletingOrder.orderNumber}?`}
          onConfirm={() => deleteMutation.mutate(deletingOrder.id)}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  )
}