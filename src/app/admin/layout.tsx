'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Building,
  ClipboardList,
  Truck,
  CreditCard,
  Calendar,
  FileText,
  TrendingUp,
  Bell,
  FolderOpen,
  PieChart,
  ChevronDown,
  ChevronRight,
  Box,
  Briefcase,
  Receipt,
  LineChart,
  Star
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import { useAuth } from '@/contexts/auth-context'

// Nhóm navigation theo category
const navigationGroups = [
  {
    name: 'Tổng Quan',
    items: [
      { name: 'Bảng Điều Khiển', href: '/admin', icon: BarChart3 },
    ]
  },
  {
    name: 'Quản Lý Sản Phẩm',
    icon: Box,
    items: [
      { name: 'Sản Phẩm & Nhà Cung Cấp', href: '/admin/products', icon: Package },
      { name: 'Kho Hàng', href: '/admin/inventory', icon: Package },
    ]
  },
  {
    name: 'Bán Hàng',
    icon: ShoppingCart,
    items: [
      { name: 'Đơn Hàng', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Khách Hàng', href: '/admin/customers', icon: Users },
      // { name: 'Khách Hàng Thân Thiết', href: '/admin/loyalty', icon: Star },
      { name: 'Quản Lý Bán Hàng', href: '/admin/sales-management', icon: Receipt },
      { name: 'Đánh Giá Sản Phẩm', href: '/admin/reviews', icon: Star },
    ]
  },
  /* HIDDEN FOR NOW - SME Management (uncomment to enable)
  {
    name: 'Quản Lý SME',
    icon: CreditCard,
    items: [
      { name: 'Quản Lý Công Nợ', href: '/admin/credit-management', icon: CreditCard },
      { name: 'Nhập Hàng Thông Minh', href: '/admin/procurement-management', icon: Truck },
      { name: 'Hợp Đồng & Giá B2B', href: '/admin/contract-management', icon: FileText },
    ]
  },
  */
  {
    name: 'Nhân Sự',
    icon: Briefcase,
    items: [
      { name: 'Quản Lý Nhân Sự', href: '/admin/hr-management', icon: Users },
      { name: 'Lương', href: '/admin/payroll', icon: CreditCard },
    ]
  },
  {
    name: 'Dự Án',
    icon: FolderOpen,
    items: [
      { name: 'Dự Án', href: '/admin/projects', icon: FolderOpen },
    ]
  },
  {
    name: 'Báo Cáo Tài Chính',
    icon: LineChart,
    items: [
      { name: 'Báo Cáo Tài Chính', href: '/admin/financial-reports', icon: LineChart },
    ]
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Tổng Quan', 'Quản Lý Sản Phẩm', 'Bán Hàng', 'Nhân Sự'])
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout()
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Đóng thanh bên</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Quản Trị</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigationGroups.map((group) => (
                  <div key={group.name} className="space-y-1">
                    {/* Group Header */}
                    {group.items.length > 1 && (
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-md"
                      >
                        <span className="flex items-center">
                          {group.icon && <group.icon className="h-4 w-4 mr-2" />}
                          {group.name}
                        </span>
                        {expandedGroups.includes(group.name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Group Items */}
                    {expandedGroups.includes(group.name) && group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`${isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            } group flex items-center px-3 py-2 text-sm font-medium rounded-md ${group.items.length > 1 ? 'ml-4' : ''}`}
                        >
                          <item.icon
                            className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                              } mr-3 flex-shrink-0 h-5 w-5`}
                          />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Bảng Quản Trị</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-2">
              {navigationGroups.map((group) => (
                <div key={group.name} className="space-y-1">
                  {/* Group Header */}
                  {group.items.length > 1 && (
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <span className="flex items-center">
                        {group.icon && <group.icon className="h-4 w-4 mr-2" />}
                        {group.name}
                      </span>
                      {expandedGroups.includes(group.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Group Items */}
                  {expandedGroups.includes(group.name) && group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                          } group flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-all ${group.items.length > 1 ? 'ml-2' : ''}`}
                      >
                        <item.icon
                          className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                            } mr-3 flex-shrink-0 h-5 w-5`}
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Mở thanh bên</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigationGroups
                    .flatMap(g => g.items)
                    .find(item => pathname.startsWith(item.href))?.name || 'Bảng Điều Khiển'}
                </h1>
                <div className="flex items-center space-x-4">
                  <NotificationBell />
                  <button className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                    <User className="h-5 w-5 mr-1" />
                    Quản Trị
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    Đăng Xuất
                  </button>
                </div>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}