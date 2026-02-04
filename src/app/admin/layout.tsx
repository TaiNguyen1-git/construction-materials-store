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
  Building2,
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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  Headset,
  LineChart,
  Box,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Star,
  ChevronRight,
  MessageCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import AdminPushManager from '@/components/admin/AdminPushManager'
import { useAuth } from '@/contexts/auth-context'

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

interface NavGroup {
  name: string;
  icon?: LucideIcon;
  roles?: string[];
  items: NavItem[];
}

// Nhóm navigation theo category
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Define full navigation items
  const allGroups: NavGroup[] = [
    {
      name: 'Điều Hành',
      items: [
        { name: 'Tổng Quan', href: '/admin', icon: BarChart3 },
        { name: 'Công Việc Của Tôi', href: '/admin/my-tasks', icon: ClipboardList, roles: ['EMPLOYEE'] },
        { name: 'Tin Nhắn', href: '/admin/messages', icon: MessageCircle },
        { name: 'Hỗ Trợ Khách Hàng', href: '/admin/support', icon: Headset },
        { name: 'Quản Lý Tranh Chấp', href: '/admin/disputes', icon: ShieldAlert },
      ]
    },
    {
      name: 'Kho Hàng',
      icon: Box,
      items: [
        { name: 'Tồn Kho & Sản Phẩm', href: '/admin/inventory', icon: Package },
        { name: 'Hàng Hóa & Đại Lý', href: '/admin/products', icon: Package },
        { name: 'Quản Lý Hoàn Trả', href: '/admin/returns', icon: RotateCcw },
      ]
    },
    {
      name: 'Kinh Doanh',
      icon: ShoppingCart,
      items: [
        { name: 'Đơn Hàng & Dự Án', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Khách Hàng & Đánh Giá', href: '/admin/customers', icon: Users },
        { name: 'Quản Lý Tổ Chức (B2B)', href: '/admin/organizations', icon: Building2 },
        { name: 'Phân Tích Bán Hàng', href: '/admin/sales-management', icon: LineChart },
      ]
    },
    {
      name: 'Tài Chính & Hợp Đồng',
      icon: CreditCard,
      items: [
        { name: 'Quản Lý Công Nợ', href: '/admin/credit-management', icon: CreditCard },
        { name: 'Thu Mua & Nhập Hàng', href: '/admin/procurement-management', icon: Truck },
        { name: 'Hợp Đồng & Pháp Lý', href: '/admin/contract-management', icon: FileText },
      ]
    },
    {
      name: 'Nhân Sự',
      icon: Briefcase,
      roles: ['MANAGER'],
      items: [
        { name: 'Danh Sách Nhân Viên', href: '/admin/hr-management', icon: Users },
        { name: 'Bảng Lương & Phúc Lợi', href: '/admin/payroll', icon: CreditCard },
      ]
    },
    {
      name: 'Đối Tác',
      icon: ShieldCheck,
      items: [
        { name: 'Quản Lý Nhà Thầu', href: '/admin/contractors', icon: Users },
        { name: 'Quản Lý Nhà Cung Cấp', href: '/admin/suppliers', icon: Truck },
        { name: 'Xác Thực Đối Tác', href: '/admin/contractors/verify', icon: ShieldCheck },
      ]
    },
    {
      name: 'Hệ Thống',
      icon: Settings,
      roles: ['MANAGER'],
      items: [
        { name: 'Thông Báo Hệ Thống', href: '/admin/announcements', icon: Bell },
        { name: 'Quản Lý Banner', href: '/admin/banners', icon: Star },
        { name: 'Báo Cáo Lợi Nhuận', href: '/admin/financial-reports', icon: PieChart },
      ]
    },
  ]

  // Filter groups based on user role
  const navigationGroups = allGroups.filter(group => {
    // If group has role restriction
    if (group.roles && !group.roles.includes(user?.role as string)) return false
    return true
  }).map(group => ({
    ...group,
    items: group.items.filter(item => {
      // If item has specific role restriction
      if (item.roles && !item.roles.includes(user?.role as string)) return false
      return true
    })
  }))

  const [expandedGroups, setExpandedGroups] = useState<string[]>(navigationGroups.map(g => g.name))

  // Redirect non-admin users to homepage
  useEffect(() => {
    if (user && !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
      // User is logged in but not admin/employee - redirect to homepage
      window.location.href = '/'
    }
  }, [user])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const handleLogout = async () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout()
      router.push('/login')
    }
  }

  // Show nothing while checking auth or redirecting non-admin
  if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans">
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

      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 ${isCollapsed ? 'md:w-20 px-2' : 'md:w-72 px-4'}`}>
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-200/60 bg-white/80 backdrop-blur-2xl shadow-[x-20px_50px_rgba(0,0,0,0.05)] my-4 rounded-[32px] overflow-hidden">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {/* Logo Section */}
            <div className={`flex items-center flex-shrink-0 px-6 mb-10 transition-all duration-500 ${isCollapsed ? 'justify-center px-0' : ''}`}>
              <div className="relative group cursor-pointer" onClick={() => router.push('/admin')}>
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20 ring-1 ring-white/20 transform group-hover:scale-105 transition-transform">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="ml-4 min-w-0 flex flex-col">
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">SmartBuild</h1>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Hệ thống ERP Doanh nghiệp</span>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 space-y-8">
              {navigationGroups.map((group) => (
                <div key={group.name} className="space-y-1">
                  {/* Group Header */}
                  {group.items.length > 1 && !isCollapsed && (
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full flex items-center justify-between px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors group/header"
                    >
                      <span className="flex items-center gap-2">
                        {group.name}
                      </span>
                      <div className={`transition-transform duration-300 ${expandedGroups.includes(group.name) ? '' : '-rotate-90'}`}>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      </div>
                    </button>
                  )}
                  {isCollapsed && group.items.length > 1 && (
                    <div className="h-px bg-slate-100 mx-4 my-6 opacity-60" />
                  )}

                  {/* Group Items */}
                  <div className={`space-y-1 overflow-hidden transition-all duration-300 ${expandedGroups.includes(group.name) || isCollapsed ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          title={isCollapsed ? item.name : ''}
                          className={`${isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-600/10'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                            } group flex items-center ${isCollapsed ? 'justify-center px-0 mx-auto w-12 h-12' : 'px-4 mx-2'} py-3 text-sm font-bold rounded-2xl transition-all duration-300 group/item`}
                        >
                          <item.icon
                            className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'
                              } flex-shrink-0 h-5 w-5 transition-all duration-300 group-hover/item:scale-110 ${!isCollapsed ? 'mr-3' : ''}`}
                          />
                          {!isCollapsed && <span className="truncate tracking-tight">{item.name}</span>}
                          {isActive && !isCollapsed && (
                            <ArrowRight className="ml-auto w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* User & Settings Section */}
          <div className="p-4 border-t border-slate-100/60 bg-slate-50/50">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all group"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <div className="flex items-center gap-2">
                  <PanelLeftClose className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Thu gọn menu</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'md:pl-20' : 'md:pl-72'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex flex-shrink-0 h-20 bg-white/60 backdrop-blur-xl border-b border-white/20 px-8 items-center justify-between">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Breadcrumbs or Page Title */}
          <div className="hidden md:flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
              <Building className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SmartBuild Dashboard</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
              <AdminPushManager />
              <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
              <NotificationBell />
              <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
              <Link href="/admin/profile" className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl hover:bg-white transition-all group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-black text-slate-700">{user?.name || 'Administrator'}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</span>
                </div>
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm border border-red-100"
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 md:p-10 pt-6">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}