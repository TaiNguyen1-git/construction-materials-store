'use client'

/**
 * Contractor Debt Management Page - Light Theme
 * Debt/Credit management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import QRPayment from '@/components/QRPayment'
import ContractorHeader from '../components/ContractorHeader'
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
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
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
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
        fetchContractorProfile()
    }, [])

    const fetchContractorProfile = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Header - Compact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quản lý Công nợ</h1>
                            <p className="text-xs text-gray-500 font-medium mt-1">Theo dõi hạn mức và thanh toán hóa đơn</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all no-print shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Xuất sao kê
                            </button>
                        </div>
                    </div>

                    {/* Stats Dashboard - High Density Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-primary-200 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tổng công nợ</p>
                                <p className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors">{formatCurrency(stats.totalDebt)}</p>
                            </div>
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-red-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Hạn mức còn lại</p>
                                <p className="text-lg font-black text-emerald-600">{formatCurrency(stats.creditLimit - stats.totalDebt)}</p>
                            </div>
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Đến hạn tuần này</p>
                                <p className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">{formatCurrency(stats.dueThisWeek)}</p>
                            </div>
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-orange-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-purple-200 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Đã quá hạn</p>
                                <p className="text-lg font-black text-gray-900 group-hover:text-purple-600 transition-colors">{formatCurrency(stats.overdue)}</p>
                            </div>
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Credit Usage Bar - Compact */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wide">Sử dụng Tín dụng</h2>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Hạn mức tối đa: <span className="text-gray-700">{formatCurrency(stats.creditLimit)}</span>
                                </p>
                            </div>
                            <span className={`text-xs font-black ${creditUsage > 80 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {creditUsage.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${creditUsage > 80 ? 'bg-red-500' :
                                    creditUsage > 60 ? 'bg-orange-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${creditUsage}%` }}
                            />
                        </div>
                    </div>

                    {/* Invoices Table - High Density */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wide">Danh sách Hóa đơn</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Số HĐ</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Ngày lập</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Hạn thanh toán</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Số tiền</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Đã trả</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Trạng thái</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-primary-50/10 transition-colors group">
                                            <td className="px-4 py-2.5">
                                                <span className="font-bold text-xs text-primary-600 group-hover:underline cursor-pointer">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">{invoice.date}</td>
                                            <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">{invoice.dueDate}</td>
                                            <td className="px-4 py-2.5 text-right font-black text-xs text-gray-900">
                                                {formatCurrency(invoice.amount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-xs text-emerald-600">
                                                {formatCurrency(invoice.paid)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
                                                    {getStatusText(invoice.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Download Invoice Button */}
                                                    <button
                                                        onClick={() => handleDownloadInvoice(invoice)}
                                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Tải hóa đơn"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>

                                                    {/* QR Payment Button */}
                                                    {invoice.status !== 'PAID' && (
                                                        <button
                                                            onClick={() => handlePayment(invoice)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm shadow-emerald-100"
                                                        >
                                                            <QrCode className="w-3 h-3" />
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
