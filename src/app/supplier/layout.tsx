'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Building2,
    LayoutDashboard,
    Package,
    FileText,
    DollarSign,
    LogOut,
    Menu,
    X
} from 'lucide-react'

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [supplierName, setSupplierName] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('supplier_token')
        const name = localStorage.getItem('supplier_name')

        if (!token && !pathname.includes('/login')) {
            router.push('/supplier/login')
        }

        if (name) setSupplierName(name)
    }, [pathname, router])

    const handleLogout = () => {
        localStorage.removeItem('supplier_token')
        localStorage.removeItem('supplier_id')
        localStorage.removeItem('supplier_name')
        router.push('/supplier/login')
    }

    // Don't show layout on login page
    if (pathname.includes('/login')) {
        return <>{children}</>
    }

    const menuItems = [
        { name: 'Dashboard', href: '/supplier/dashboard', icon: LayoutDashboard },
        { name: 'Đơn Đặt Hàng', href: '/supplier/orders', icon: Package },
        { name: 'Hóa Đơn', href: '/supplier/invoices', icon: FileText },
        { name: 'Công Nợ', href: '/supplier/payments', icon: DollarSign },
    ]

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <div className="lg:hidden bg-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    <span className="font-bold">NCC Portal</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
                    {/* Logo */}
                    <div className="p-6 border-b hidden lg:block">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Cổng NCC</h1>
                                <p className="text-xs text-gray-500">{supplierName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu */}
                    <nav className="p-4 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
