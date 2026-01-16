'use client'

/**
 * Contractor Debt Management Page - Light Theme
 * Debt/Credit management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import QRPayment from '@/components/QRPayment'
import {
    Building2,
    Package,
    FileText,
    CreditCard,
    ShoppingCart,
    LogOut,
    Bell,
    Plus,
    Menu,
    X,
    Home,
    Download,
    DollarSign,
    Clock,
    AlertCircle,
    CheckCircle,
    Calendar,
    QrCode,
    Printer
} from 'lucide-react'

interface Invoice {
    id: string
    invoiceNumber: string
    date: string
    dueDate: string
    amount: number
    paid: number
    status: 'PAID' | 'PENDING' | 'OVERDUE'
}

export default function ContractorDebtPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalDebt: 0,
        creditLimit: 0,
        overdue: 0,
        dueThisWeek: 0
    })

    // QR Payment Modal State
    const [showQRModal, setShowQRModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    useEffect(() => {
        fetchContractorProfile()
    }, [])

    const fetchContractorProfile = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const user = localStorage.getItem('user')
            const userId = user ? JSON.parse(user).id : null

            const response = await fetch('/api/contractors/profile', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...(userId && { 'x-user-id': userId })
                }
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    const profile = data.data

                    // Set stats from debtSummary
                    setStats({
                        totalDebt: profile.debtSummary?.totalDebt || 0,
                        creditLimit: profile.creditLimit || 0,
                        overdue: profile.debtSummary?.overdueAmount || 0,
                        dueThisWeek: profile.debtSummary?.dueThisWeek || 0
                    })

                    // Set invoices from unpaidInvoices
                    if (profile.unpaidInvoices && Array.isArray(profile.unpaidInvoices)) {
                        setInvoices(profile.unpaidInvoices.map((inv: any) => ({
                            id: inv.id,
                            invoiceNumber: inv.invoiceNumber,
                            date: new Date(inv.date).toISOString().split('T')[0],
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
                            amount: inv.amount,
                            paid: inv.paid || 0,
                            status: inv.status
                        })))
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching contractor profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700'
            case 'PENDING': return 'bg-orange-100 text-orange-700'
            case 'OVERDUE': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PAID': return 'Đã thanh toán'
            case 'PENDING': return 'Chờ thanh toán'
            case 'OVERDUE': return 'Quá hạn'
            default: return status
        }
    }

    const creditUsage = (stats.totalDebt / stats.creditLimit) * 100

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/contractor'
    }

    // Handle payment button click
    const handlePayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setShowQRModal(true)
    }

    // Handle invoice PDF download
    const handleDownloadInvoice = (invoice: Invoice) => {
        // Load contractor profile from localStorage
        const profileData = localStorage.getItem('contractor-profile')
        const profile = profileData ? JSON.parse(profileData) : {}

        // Create invoice HTML content
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Hóa đơn ${invoice.invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #2563eb; margin: 0; }
                    .header p { color: #666; margin: 5px 0; }
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .info-box { width: 45%; }
                    .info-box h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    .info-box p { margin: 5px 0; color: #555; }
                    .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                    .invoice-details h2 { margin-top: 0; color: #2563eb; }
                    .amount-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .amount-row:last-child { border-bottom: none; font-weight: bold; font-size: 1.2em; color: #2563eb; }
                    .footer { text-align: center; margin-top: 50px; color: #888; font-size: 0.9em; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SmartBuild PRO</h1>
                    <p>Cửa hàng Vật liệu Xây dựng</p>
                    <p>Địa chỉ: 123 Đường Nguyễn Văn Linh, Biên Hòa, Đồng Nai</p>
                    <p>Hotline: 0909 123 456 | Email: sales@smartbuild.vn</p>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h3>Thông tin Khách hàng</h3>
                        <p><strong>Công ty:</strong> ${profile.companyName || 'N/A'}</p>
                        <p><strong>MST:</strong> ${profile.taxId || 'N/A'}</p>
                        <p><strong>Địa chỉ:</strong> ${profile.address || 'N/A'}</p>
                        <p><strong>Điện thoại:</strong> ${profile.phone || 'N/A'}</p>
                    </div>
                    <div class="info-box">
                        <h3>Thông tin Hóa đơn</h3>
                        <p><strong>Số HĐ:</strong> ${invoice.invoiceNumber}</p>
                        <p><strong>Ngày lập:</strong> ${invoice.date}</p>
                        <p><strong>Hạn thanh toán:</strong> ${invoice.dueDate}</p>
                        <p><strong>Trạng thái:</strong> ${getStatusText(invoice.status)}</p>
                    </div>
                </div>
                
                <div class="invoice-details">
                    <h2>Chi tiết Thanh toán</h2>
                    <div class="amount-row">
                        <span>Tổng giá trị hóa đơn:</span>
                        <span>${formatCurrency(invoice.amount)}</span>
                    </div>
                    <div class="amount-row">
                        <span>Đã thanh toán:</span>
                        <span>${formatCurrency(invoice.paid)}</span>
                    </div>
                    <div class="amount-row">
                        <span>Còn lại:</span>
                        <span>${formatCurrency(invoice.amount - invoice.paid)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Cảm ơn quý khách đã tin tưởng SmartBuild PRO!</p>
                    <p>Hóa đơn này được tạo tự động và có giá trị pháp lý.</p>
                </div>
            </body>
            </html>
        `

        // Open print window
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(invoiceHTML)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link href="/contractor/dashboard" className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                    <span className="text-blue-600 font-semibold ml-1">PRO</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý Công nợ</h1>
                            <p className="text-gray-600">Theo dõi và thanh toán hóa đơn</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium">
                                <Download className="w-5 h-5" />
                                Xuất sao kê
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Tổng công nợ</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalDebt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Hạn mức còn lại</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.creditLimit - stats.totalDebt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Đến hạn tuần này</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.dueThisWeek)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Quá hạn</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.overdue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credit Usage */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Hạn mức Tín dụng</h2>
                            <span className="text-sm text-gray-500">
                                {formatCurrency(stats.totalDebt)} / {formatCurrency(stats.creditLimit)}
                            </span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${creditUsage > 80 ? 'bg-red-500' :
                                    creditUsage > 60 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${creditUsage}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className="text-gray-500">Đã sử dụng: {creditUsage.toFixed(1)}%</span>
                            <span className="text-gray-500">Còn lại: {(100 - creditUsage).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách Hóa đơn</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Số HĐ</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ngày lập</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Hạn thanh toán</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Số tiền</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Đã thanh toán</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-blue-600">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                                            <td className="px-6 py-4 text-gray-600">{invoice.dueDate}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {formatCurrency(invoice.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600">
                                                {formatCurrency(invoice.paid)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                    {getStatusText(invoice.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Download Invoice Button */}
                                                    <button
                                                        onClick={() => handleDownloadInvoice(invoice)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Tải hóa đơn"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </button>

                                                    {/* QR Payment Button */}
                                                    {invoice.status !== 'PAID' && (
                                                        <button
                                                            onClick={() => handlePayment(invoice)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                                                        >
                                                            <QrCode className="w-4 h-4" />
                                                            Thanh toán
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
                <div className="flex items-center justify-around py-2">
                    <Link href="/contractor/dashboard" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Home className="w-6 h-6" />
                        <span className="text-xs">Tổng quan</span>
                    </Link>
                    <Link href="/contractor/orders" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs">Đơn hàng</span>
                    </Link>
                    <Link href="/products" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Package className="w-6 h-6" />
                        <span className="text-xs">Sản phẩm</span>
                    </Link>
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs font-medium">Công nợ</span>
                    </Link>
                </div>
            </nav>

            {/* QR Payment Modal */}
            {showQRModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Thanh toán QR
                                </h3>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Hóa đơn: {selectedInvoice.invoiceNumber}
                            </p>
                        </div>

                        <div className="p-6">
                            <QRPayment
                                amount={selectedInvoice.amount - selectedInvoice.paid}
                                orderId={selectedInvoice.invoiceNumber}
                                description={`Thanh toan hoa don ${selectedInvoice.invoiceNumber}`}
                            />
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
