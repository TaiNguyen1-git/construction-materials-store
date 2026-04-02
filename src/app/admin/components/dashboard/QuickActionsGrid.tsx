import React from 'react'
import Link from 'next/link'
import { ArrowRight, Package, ShoppingCart, Boxes, Target } from 'lucide-react'

const quickActions = [
  { name: 'Thêm Sản Phẩm', href: '/admin/products', icon: Package, color: 'text-blue-600 bg-blue-50' },
  { name: 'Xem Đơn Hàng', href: '/admin/orders', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Quản Lý Kho', href: '/admin/inventory', icon: Boxes, color: 'text-amber-600 bg-amber-50' },
  { name: 'Bảng Lương', href: '/admin/payroll', icon: Target, color: 'text-purple-600 bg-purple-50' },
]

const QuickActionsGrid: React.FC = () => {
  return (
    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
      {quickActions.map((action, i) => (
        <Link key={i} href={action.href} className="group relative bg-white hover:bg-blue-600 rounded-[40px] p-8 border border-slate-200 shadow-sm transition-all duration-500 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 group-hover:bg-white/20 rounded-full blur-2xl transition-all"></div>
          
          <div className={`w-14 h-14 rounded-[20px] ${action.color} shadow-sm flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-white`}>
            <action.icon size={26} className="group-hover:text-blue-600 transition-colors" />
          </div>

          <div>
            <h4 className="text-[11px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-[0.2em] mb-1 transition-colors">ERP Action</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 group-hover:text-white transition-colors">{action.name}</span>
              <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <ArrowRight size={14} className="text-white" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default QuickActionsGrid
