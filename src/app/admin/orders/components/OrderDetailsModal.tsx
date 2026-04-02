import React from 'react'
import { Order } from '../types'

interface OrderDetailsModalProps {
  order: Order
  onClose: () => void
  getStatusLabel: (status: string) => string
  getStatusColor: (status: string) => string
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  getStatusLabel,
  getStatusColor
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-4xl shadow-2xl rounded-xl bg-white animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Chi Tiết Đơn Hàng #{order.orderNumber}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto pr-2">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số Đơn Hàng</label>
                <p className="text-sm font-bold text-blue-700">{order.orderNumber}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng Thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">📦 Danh mục sản phẩm</label>
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Sản Phẩm</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">SL</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">Kho</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Đơn Giá</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.product.name}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.quantity > 100 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.quantity > 100 ? '⚠️ Xem Kho' : '✅ Đủ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">{item.unitPrice.toLocaleString()}đ</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/50">
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-right text-gray-700">Tổng cộng:</td>
                      <td className="px-4 py-3 text-lg font-black text-right text-blue-700">{order.totalAmount.toLocaleString()}đ</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">📍 Địa Chỉ Giao Hàng</label>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {order.shippingAddress ? (
                    typeof order.shippingAddress === 'string'
                      ? order.shippingAddress
                      : `${order.shippingAddress.address || ''}, ${order.shippingAddress.ward || ''}, ${order.shippingAddress.district || ''}, ${order.shippingAddress.city || ''}`
                  ) : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">📝 Ghi Chú</label>
                <p className="text-sm text-slate-700 italic">
                  {order.note || order.notes || 'Không có ghi chú từ khách hàng'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-6 border-l border-gray-100 pl-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Thông tin khách
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Tên khách hàng</p>
                  <p className="text-sm font-bold">{order.customerName || order.customer?.name || order.guestName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Loại khách</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${order.customerType === 'GUEST' ? 'bg-gray-100 text-gray-700' : 'bg-purple-100 text-purple-700'}`}>
                    {order.customerType === 'GUEST' ? 'Khách vãng lai' : 'Khách Đăng ký'}
                  </span>
                </div>
                {order.guestPhone && (
                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    <p className="text-sm font-bold text-blue-600">{order.guestPhone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Timeline xử lý
              </h4>
              <div className="relative">
                <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gray-100"></div>
                <div className="space-y-8 relative">
                  <div className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-md z-10"></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Đơn hàng mới</p>
                      <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  {order.status !== 'PENDING_CONFIRMATION' && order.status !== 'CANCELLED' && (
                    <div className="flex gap-4">
                      <div className={`w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div>
                        <p className={`text-xs font-bold ${['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) ? 'text-gray-900' : 'text-gray-400'}`}>Đã xác nhận</p>
                        <p className="text-[10px] text-gray-400">{new Date(order.updatedAt).toLocaleTimeString('vi-VN')}</p>
                      </div>
                    </div>
                  )}
                  {['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
                    <div className="flex gap-4">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow-md z-10"></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Đang vận chuyển</p>
                        <p className="text-[10px] text-gray-400">{order.trackingNumber || 'Vận đơn: --'}</p>
                      </div>
                    </div>
                  )}
                  {order.status === 'COMPLETED' && (
                    <div className="flex gap-4">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-md z-10"></div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600">Đã hoàn thành</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsModal
