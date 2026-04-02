import React, { memo } from 'react'
import Link from 'next/link'
import { TableVirtuoso } from 'react-virtuoso'
import { Order } from '../types'

interface OrdersTableProps {
  orders: Order[]
  selectedOrderIds: string[]
  toggleSelectAll: () => void
  toggleSelectOrder: (id: string) => void
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getNextStatus: (status: string, paymentType?: string) => string | null
  onView: (order: Order) => void
  onPrint: (order: Order) => void
  onConfirm: (id: string, action: 'confirm' | 'reject', reason?: string) => void
  onConfirmDeposit: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onDelete: (order: Order) => void
  onOpenQR: (order: Order) => void
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  selectedOrderIds,
  toggleSelectAll,
  toggleSelectOrder,
  getStatusColor,
  getStatusLabel,
  getNextStatus,
  onView,
  onPrint,
  onConfirm,
  onConfirmDeposit,
  onUpdateStatus,
  onDelete,
  onOpenQR
}) => {
  return (
    <div className="bg-white shadow rounded-md overflow-hidden" style={{ height: '600px', width: '100%' }}>
      <TableVirtuoso
        data={orders}
        fixedHeaderContent={() => (
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left w-12 bg-slate-50">
              <input 
                type="checkbox" 
                checked={selectedOrderIds.length === orders.length && orders.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">Đơn Hàng</th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">Khách Hàng</th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">Sản Phẩm</th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">Tổng Tiền</th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">Trạng Thái</th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">Ngày</th>
            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px] bg-slate-50">Hành Động</th>
          </tr>
        )}
        itemContent={(index, order) => (
          <>
            <td className="px-4 py-3 align-top">
              <input 
                type="checkbox" 
                checked={selectedOrderIds.includes(order.id)}
                onChange={() => toggleSelectOrder(order.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </td>
            <td className="px-4 py-3 align-top max-w-[140px]">
              <div>
                <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors break-words">
                  {order.orderNumber}
                </Link>
                {order.trackingNumber && (
                  <div className="text-sm text-gray-500 mt-1">Mã vận đơn: {order.trackingNumber}</div>
                )}
                {order.customerType === 'GUEST' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                    Khách vãng lai
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 align-top">
              <div className="max-w-[200px]">
                <div className="text-sm font-black text-slate-900 truncate">
                  {order.customerName || order.customer?.name || order.guestName || 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 truncate font-medium">
                  {order.customerEmail || order.customer?.email || order.guestEmail || 'N/A'}
                </div>
                {order.guestPhone && (
                  <div className="text-[11px] text-blue-500 font-bold mt-1 inline-flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {order.guestPhone}
                  </div>
                )}
              </div>
            </td>
            <td className="px-4 py-3 align-top whitespace-nowrap text-sm text-gray-900">
              {order.orderItems.length} sản phẩm
            </td>
            <td className="px-4 py-3 align-top whitespace-nowrap text-sm font-medium text-gray-900">
              {order.totalAmount.toLocaleString()}đ
            </td>
            <td className="px-4 py-3 align-top whitespace-nowrap">
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
            <td className="px-4 py-3 align-top whitespace-nowrap text-sm text-gray-900">
              {new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 align-top">
              <div className="flex flex-wrap gap-2 max-w-[180px]">
                <button
                  onClick={() => onView(order)}
                  className="p-2 rounded-lg bg-slate-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition-all group/btn"
                  title="Xem chi tiết"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>

                <button
                  onClick={() => onPrint(order)}
                  className="p-2 rounded-lg bg-slate-50 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  title="In phiếu giao hàng"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                </button>

                <button
                  onClick={() => window.location.href = `/admin/orders/${order.id}/phases`}
                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="Lập lịch đợt giao"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>

                {order.status === 'PENDING_CONFIRMATION' && (
                  <>
                    <button
                      onClick={() => onConfirm(order.id, 'confirm')}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                      title="Xác nhận đơn"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Lý do từ chối:')
                        if (reason) onConfirm(order.id, 'reject', reason)
                      }}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                      title="Từ chối đơn"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </>
                )}

                {order.status === 'CONFIRMED_AWAITING_DEPOSIT' && (
                  <button
                    onClick={() => {
                      if (confirm('Xác nhận đã nhận tiền cọc?')) onConfirmDeposit(order.id)
                    }}
                    className="p-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white transition-all"
                    title="Xác nhận tiền cọc"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                )}

                {getNextStatus(order.status, order.paymentType) && (
                  <button
                    onClick={() => onUpdateStatus(order.id, getNextStatus(order.status, order.paymentType)!)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                    title={`Chuyển sang: ${getStatusLabel(getNextStatus(order.status, order.paymentType)!)}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                )}

                {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'PAID' && order.status !== 'PENDING' && order.status !== 'CANCELLED' && order.status !== 'RETURNED' && (
                  <button
                    onClick={() => onOpenQR(order)}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                    title="Lấy mã QR thanh toán"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v4H4V6zm12 0h4v4h-4V6zM4 14h4v4H4v-4zm12 0h4v4h-4v-4z" /></svg>
                  </button>
                )}

                <button
                  onClick={() => onDelete(order)}
                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Xóa đơn hàng"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </>
        )}
      />
    </div>
  )
}

export default memo(OrdersTable)
