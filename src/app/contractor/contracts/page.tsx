'use client'

/**
 * Contractor Contracts Page - Light Theme
 * Contract management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import FormModal from '@/components/FormModal'
import { Toaster } from 'react-hot-toast'
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
    Eye,
    Calendar,
    CheckCircle,
    Clock,
    TrendingDown
} from 'lucide-react'

interface Contract {
    id: string
    contractNumber: string
    name: string
    type: string
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
    validFrom: string
    validTo: string
    creditLimit: number
    discountPercent: number
}

export default function ContractorContractsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [contracts, setContracts] = useState<Contract[]>([])
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
        setContracts([
            {
                id: '1',
                contractNumber: 'HD-CONTRACTOR-001',
                name: 'Hợp đồng Giá ưu đãi 2025',
                type: 'DISCOUNT',
                status: 'ACTIVE',
                validFrom: '2025-01-01',
                validTo: '2025-12-31',
                creditLimit: 150000000,
                discountPercent: 15
            },
        ])
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700'
            case 'EXPIRED': return 'bg-gray-100 text-gray-700'
            case 'PENDING': return 'bg-orange-100 text-orange-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Đang hiệu lực'
            case 'EXPIRED': return 'Hết hạn'
            case 'PENDING': return 'Chờ ký'
            default: return status
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Hợp đồng</h1>
                            <p className="text-gray-600">Xem các hợp đồng và ưu đãi của bạn</p>
                        </div>
                    </div>

                    {/* Contracts Grid */}
                    <div className="grid gap-6">
                        {contracts.map((contract) => (
                            <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">{contract.name}</h3>
                                                <p className="text-gray-500 text-sm">{contract.contractNumber}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                                            {contract.status === 'ACTIVE' && <CheckCircle className="w-4 h-4" />}
                                            {contract.status === 'PENDING' && <Clock className="w-4 h-4" />}
                                            {getStatusText(contract.status)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <Calendar className="w-4 h-4" />
                                                Hiệu lực từ
                                            </div>
                                            <p className="font-semibold text-gray-900">{contract.validFrom}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <Calendar className="w-4 h-4" />
                                                Đến ngày
                                            </div>
                                            <p className="font-semibold text-gray-900">{contract.validTo}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <TrendingDown className="w-4 h-4" />
                                                Chiết khấu
                                            </div>
                                            <p className="font-semibold text-green-600 text-xl">{contract.discountPercent}%</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <CreditCard className="w-4 h-4" />
                                                Hạn mức tín dụng
                                            </div>
                                            <p className="font-semibold text-blue-600">{formatCurrency(contract.creditLimit)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Liên hệ <span className="text-blue-600 font-medium">0909 123 456</span> để gia hạn hoặc nâng cấp hợp đồng
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedContract(contract)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Xem chi tiết
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors no-print"
                                        >
                                            <Download className="w-4 h-4" />
                                            Tải hợp đồng PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {contracts.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có hợp đồng</h3>
                            <p className="text-gray-500 mb-6">Liên hệ với chúng tôi để được tư vấn và ký hợp đồng ưu đãi</p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                Liên hệ tư vấn
                            </Link>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-2">Lợi ích khi có Hợp đồng</h3>
                        <ul className="space-y-2 text-blue-800 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                Giá cố định không bị ảnh hưởng bởi biến động thị trường
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                Hạn mức công nợ linh hoạt, thanh toán sau 30-60 ngày
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                Ưu tiên giao hàng và hỗ trợ chuyên viên riêng
                            </li>
                        </ul>
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
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs">Công nợ</span>
                    </Link>
                </div>
            </nav>

            <FormModal
                isOpen={!!selectedContract}
                onClose={() => setSelectedContract(null)}
                title="Chi tiết hợp đồng"
                size="lg"
            >
                {selectedContract && (
                    <div className="p-6 space-y-6">
                        {/* Header Info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-blue-900">{selectedContract.name}</h3>
                                <p className="text-blue-700">{selectedContract.contractNumber}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedContract.status)}`}>
                                {getStatusText(selectedContract.status)}
                            </span>
                        </div>

                        {/* Detailed Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Thông tin chung</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-gray-500">Ngày hiệu lực:</div>
                                    <div className="font-medium">{selectedContract.validFrom}</div>
                                    <div className="text-gray-500">Ngày hết hạn:</div>
                                    <div className="font-medium">{selectedContract.validTo}</div>
                                    <div className="text-gray-500">Người phụ trách:</div>
                                    <div className="font-medium">Nguyễn Văn A (Sale Admin)</div>
                                    <div className="text-gray-500">Phương thức thanh toán:</div>
                                    <div className="font-medium">Công nợ 30 ngày</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b pb-2">Chính sách ưu đãi</h4>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-green-800 font-medium">Chiết khấu thương mại</span>
                                        <span className="text-xl font-bold text-green-600">{selectedContract.discountPercent}%</span>
                                    </div>
                                    <p className="text-xs text-green-700">
                                        Áp dụng cho tất cả đơn hàng phát sinh trong thời gian hiệu lực của hợp đồng.
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-blue-800 font-medium">Hạn mức tín dụng</span>
                                        <span className="text-xl font-bold text-blue-600">{formatCurrency(selectedContract.creditLimit)}</span>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                        Hạn mức quay vòng, được reset sau khi thanh toán công nợ.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Điều khoản & Điều kiện</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2 max-h-48 overflow-y-auto">
                                <p>1. <strong>Phạm vi cung cấp:</strong> SmartBuild cam kết cung cấp vật liệu xây dựng theo yêu cầu của Bên B với chất lượng đúng tiêu chuẩn nhà sản xuất.</p>
                                <p>2. <strong>Giá cả:</strong> Đơn giá được tính theo bảng giá niêm yết tại thời điểm đặt hàng, đã trừ đi chiết khấu {selectedContract.discountPercent}%.</p>
                                <p>3. <strong>Giao hàng:</strong> Hàng hóa được giao tận công trình theo yêu cầu của Bên B. Phí vận chuyển được miễn phí cho đơn hàng trên 50 triệu đồng.</p>
                                <p>4. <strong>Thanh toán:</strong> Bên B có trách nhiệm thanh toán công nợ phát sinh trong tháng trước ngày 05 của tháng tiếp theo. Quá hạn thanh toán sẽ chịu lãi suất 1.5%/tháng.</p>
                                <p>5. <strong>Bảo hành:</strong> Sản phẩm được bảo hành theo chính sách của nhà sản xuất.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={() => setSelectedContract(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Đóng
                            </button>
                            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                                <Download className="w-4 h-4" />
                                Tải bản đầy đủ (PDF)
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>
        </div>
    )
}
