import React from 'react'
import Link from 'next/link'
import { ShoppingCart, Star, Package, AlertTriangle, ChevronRight } from 'lucide-react'

interface OperationalLayerProps {
  recentOrders: any[]
  topProducts: any[]
  stockWarnings: any[]
  lowStockCount: number
  formatCurrency: (val: number) => string
  formatNumber: (val: number) => string
}

const OperationalLayer: React.FC<OperationalLayerProps> = ({
  recentOrders,
  topProducts,
  stockWarnings,
  lowStockCount,
  formatCurrency,
  formatNumber
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Recent Transactions */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
            <ShoppingCart className="text-emerald-500" size={20} />
            Giao Dịch Gần Đây
          </h3>
          <Link href="/admin/orders" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline text-wrap">Xem Tất Cả</Link>
        </div>
        <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50/50">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-nowrap">
                  <th className="px-6 py-4 text-left">Mã Đơn</th>
                  <th className="px-6 py-4 text-left">Khách Hàng</th>
                  <th className="px-4 py-4 text-right">Giá Trị (VND)</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase font-mono">{order.orderNumber}</div>
                      <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">{order.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 flex-shrink-0">{order.customer?.[0] || '?' }</div>
                        <span className="text-xs font-bold text-slate-600 truncate">{order.customer || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-xs font-black text-slate-900">{formatCurrency(order.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap ${
                        order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        order.status === 'PENDING' || order.status === 'PENDING_CONFIRMATION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {order.status === 'DELIVERED' ? 'Đã Giao' :
                         order.status === 'COMPLETED' ? 'Hoàn Tất' :
                         order.status === 'PENDING' ? 'Chờ Xử Lý' :
                         order.status === 'PENDING_CONFIRMATION' ? 'Chờ Xác Nhận' :
                         order.status === 'SHIPPED' ? 'Đang Giao' :
                         order.status === 'CONFIRMED' ? 'Đã Xác Nhận' :
                         order.status === 'CANCELLED' ? 'Đã Hủy' :
                         order.status === 'PROCESSING' ? 'Đang Xử Lý' :
                         order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Hub & Notifications */}
      <div className="space-y-6">
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
              <Star className="text-yellow-500" size={18} />
              Top Bán Chạy
            </h3>
            <Link href="/admin/products" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Chi Tiết</Link>
          </div>
          <div className="space-y-5">
            {topProducts?.slice(0, 3).map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>#{idx + 1}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase">{product.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Đã bán {product.quantity}</div>
                  </div>
                </div>
                <div className="text-xs font-black text-slate-900">{formatNumber(product.revenue / 1000000)}M</div>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <div className="text-center py-4">
                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-8 space-y-6 shadow-xl border border-amber-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between relative z-10">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-nowrap">Cảnh Báo Tồn Kho</h4>
            <AlertTriangle className="text-amber-500 flex-shrink-0" size={16} />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stockWarnings?.length || lowStockCount}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sản phẩm sắp hết hàng</p>
            </div>
            
            <div className="space-y-2 max-h-[120px] overflow-hidden">
              {stockWarnings?.slice(0, 3).map((w: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-600 line-clamp-1 flex-1 mr-2">{w.product}</span>
                  <span className={`px-1.5 py-0.5 rounded whitespace-nowrap ${w.urgency === 'CRITICAL' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                    Còn {w.current}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/admin/inventory" className="flex items-center justify-between p-4 bg-blue-500 rounded-2xl hover:bg-blue-600 transition-all text-white relative z-10 shadow-lg shadow-blue-500/30">
            <span className="text-[10px] font-black uppercase tracking-widest">Điều Chỉnh Kho</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OperationalLayer
