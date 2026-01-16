'use client'

/**
 * Contractor Cart Page
 * Dedicated cart for B2B contractors with project info and bulk ordering
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    Package,
    ArrowLeft,
    FileText,
    Building2,
    CreditCard,
    Truck,
    AlertCircle
} from 'lucide-react'
import { useContractorCartStore } from '@/stores/contractorCartStore'
import Sidebar from '../components/Sidebar'
import toast, { Toaster } from 'react-hot-toast'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function ContractorCartPage() {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [contractorInfo, setContractorInfo] = useState({
        creditLimit: 0,
        currentDebt: 0,
        discountPercent: 0,
        availableCredit: 0
    })

    const {
        items,
        projectName,
        poNumber,
        notes,
        updateQuantity,
        removeItem,
        clearCart,
        setProjectName,
        setPoNumber,
        setNotes,
        getTotalPrice,
        getTotalItems
    } = useContractorCartStore()

    const totalPrice = getTotalPrice()
    const totalItems = getTotalItems()

    // Fetch contractor profile with credit info
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
                    setContractorInfo({
                        creditLimit: profile.creditLimit || 0,
                        currentDebt: profile.debtSummary?.totalDebt || 0,
                        discountPercent: profile.discountPercent || 0,
                        availableCredit: profile.availableCredit || 0
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching contractor profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const availableCredit = contractorInfo.availableCredit
    const discountAmount = totalPrice * (contractorInfo.discountPercent / 100)
    const finalTotal = totalPrice - discountAmount

    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error('Giỏ hàng trống!')
            return
        }

        if (finalTotal > availableCredit) {
            toast.error('Vượt quá hạn mức tín dụng!')
            return
        }

        setIsProcessing(true)
        try {
            const token = localStorage.getItem('access_token')
            const user = localStorage.getItem('user')
            const userId = user ? JSON.parse(user).id : null

            const response = await fetch('/api/contractors/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...(userId && { 'x-user-id': userId })
                },
                body: JSON.stringify({
                    items: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    })),
                    projectName,
                    poNumber,
                    notes
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                toast.success('Đặt hàng thành công!')
                clearCart()
                router.push('/contractor/orders')
            } else {
                toast.error(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* Top Nav */}
            <nav className="fixed top-0 left-0 right-0 h-[73px] bg-white border-b border-gray-200 z-30 px-6">
                <div className="h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Building2 className="w-6 h-6 text-gray-600" />
                        </button>
                        <Link href="/contractor/dashboard" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                            <span className="text-blue-600 font-semibold">PRO</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/contractor/quick-order"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <ShoppingCart className="w-7 h-7 text-blue-600" />
                                Giỏ Hàng Đối Tác
                            </h1>
                            <p className="text-gray-500">{totalItems} sản phẩm</p>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-600 mb-2">Giỏ hàng trống</h2>
                            <p className="text-gray-400 mb-6">Thêm sản phẩm từ trang Đặt Hàng Nhanh</p>
                            <Link
                                href="/contractor/quick-order"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Thêm Sản Phẩm
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Project Info */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Thông Tin Đơn Hàng
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên Dự Án
                                            </label>
                                            <input
                                                type="text"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                placeholder="VD: Dự án Biên Hòa"
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mã tham chiếu (tùy chọn)
                                            </label>
                                            <input
                                                type="text"
                                                value={poNumber}
                                                onChange={(e) => setPoNumber(e.target.value)}
                                                placeholder="Ghi chú nội bộ của bạn..."
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ghi Chú
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Ghi chú thêm cho đơn hàng..."
                                            rows={2}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Products List */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-900">Sản Phẩm ({items.length})</h3>
                                        <button
                                            onClick={clearCart}
                                            className="text-red-600 text-sm hover:underline"
                                        >
                                            Xóa tất cả
                                        </button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {items.map((item) => (
                                            <div key={item.productId} className="p-4 flex gap-4">
                                                {/* Image */}
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={64}
                                                            height={64}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                                                    <p className="text-sm text-blue-600 font-medium">
                                                        {formatCurrency(item.price)}/{item.unit}
                                                    </p>
                                                </div>

                                                {/* Quantity */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="p-1 border border-gray-200 rounded hover:bg-gray-50"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                        className="w-16 text-center border border-gray-200 rounded py-1"
                                                        min="1"
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="p-1 border border-gray-200 rounded hover:bg-gray-50"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Subtotal & Remove */}
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </p>
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="text-red-500 hover:text-red-700 mt-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-4">
                                {/* Credit Info */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Hạn Mức Tín Dụng
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Hạn mức:</span>
                                            <span className="font-medium">{formatCurrency(contractorInfo.creditLimit)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Đã sử dụng:</span>
                                            <span className="font-medium text-red-600">{formatCurrency(contractorInfo.currentDebt)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-blue-200 pt-2">
                                            <span className="text-blue-700 font-medium">Còn lại:</span>
                                            <span className="font-bold text-green-600">{formatCurrency(availableCredit)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Tổng Đơn Hàng</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tạm tính:</span>
                                            <span className="font-medium">{formatCurrency(totalPrice)}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                            <span>Chiết khấu ({contractorInfo.discountPercent}%):</span>
                                            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Truck className="w-4 h-4" />
                                                Phí vận chuyển:
                                            </span>
                                            <span className="text-green-600 font-medium">Miễn phí</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3 flex justify-between">
                                            <span className="font-semibold text-gray-900">Tổng cộng:</span>
                                            <span className="text-xl font-bold text-blue-600">{formatCurrency(finalTotal)}</span>
                                        </div>
                                    </div>

                                    {finalTotal > availableCredit && (
                                        <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>Đơn hàng vượt quá hạn mức tín dụng còn lại</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing || finalTotal > availableCredit}
                                        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Đặt Hàng (Ghi Nợ)
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        Thanh toán trong vòng 30 ngày
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
