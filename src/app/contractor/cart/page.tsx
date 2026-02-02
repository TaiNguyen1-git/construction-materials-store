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
import ContractorHeader from '../components/ContractorHeader'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function ContractorCartPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)
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


    // Fetch profile
    useEffect(() => {
        if (user) {
            fetchContractorProfile()
        }
    }, [user])

    const fetchContractorProfile = async () => {
        try {
            const response = await fetchWithAuth('/api/contractors/profile')

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
            const response = await fetchWithAuth('/api/contractors/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Header - Compact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/contractor/quick-order"
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-500" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary-600" />
                                    Giỏ Hàng Đối Tác
                                </h1>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{totalItems} sản phẩm trong giỏ</p>
                            </div>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-900 uppercase mb-1">Giỏ hàng trống</h2>
                            <p className="text-xs text-gray-400 mb-6">Thêm sản phẩm từ trang Đặt Hàng Nhanh để bắt đầu</p>
                            <Link
                                href="/contractor/quick-order"
                                className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-xs font-black uppercase tracking-wider shadow-lg shadow-primary-200"
                            >
                                <Plus className="w-4 h-4" />
                                Đặt hàng nhanh
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Cart Items Area */}
                            <div className="xl:col-span-2 space-y-4">
                                {/* Project Info Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2 border-b border-gray-50 pb-2">
                                        <FileText className="w-4 h-4 text-primary-600" />
                                        Thông Tin Đơn Hàng
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                Tên Dự Án <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                placeholder="VD: Dự án Biên Hòa"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                Mã tham chiếu (PO)
                                            </label>
                                            <input
                                                type="text"
                                                value={poNumber}
                                                onChange={(e) => setPoNumber(e.target.value)}
                                                placeholder="Mã nội bộ..."
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Ghi Chú
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Ghi chú giao hàng..."
                                            rows={2}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all resize-none placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>

                                {/* Products List */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">Sản Phẩm ({items.length})</h3>
                                        <button
                                            onClick={clearCart}
                                            className="text-red-600 text-[10px] font-bold uppercase tracking-wider hover:text-red-700 flex items-center gap-1 group"
                                        >
                                            <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                            Xóa tất cả
                                        </button>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {items.map((item) => (
                                            <div key={item.productId} className="p-3 flex gap-3 hover:bg-gray-50/50 transition-colors">
                                                {/* Image */}
                                                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={56}
                                                            height={56}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h4 className="font-bold text-xs text-gray-900 truncate mb-0.5">{item.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">SKU: {item.sku}</span>
                                                        <span className="text-[10px] font-bold text-primary-600">
                                                            {formatCurrency(item.price)}/{item.unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity & Subtotal */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                            className="w-10 text-center text-xs font-bold border-y border-gray-200 py-1 focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-black text-xs text-gray-900">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </p>
                                                        <button
                                                            onClick={() => removeItem(item.productId)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary Sidebar */}
                            <div className="space-y-4">
                                {/* Credit Info Card */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                                    <h3 className="text-xs font-black text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Hạn Mức Tín Dụng
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-blue-700 font-medium">Hạn mức tối đa</span>
                                            <span className="font-bold text-blue-900">{formatCurrency(contractorInfo.creditLimit)}</span>
                                        </div>
                                        <div className="w-full bg-blue-200/50 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full"
                                                style={{ width: `${Math.min((contractorInfo.currentDebt / contractorInfo.creditLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                                            <span className="text-blue-700 font-bold text-xs">Khả dụng</span>
                                            <span className="font-black text-emerald-600 text-sm">{formatCurrency(availableCredit)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide mb-4">Chi tiết thanh toán</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 font-medium">Tạm tính</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-emerald-600">
                                            <span className="font-medium">Chiết khấu ({contractorInfo.discountPercent}%)</span>
                                            <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Truck className="w-3.5 h-3.5" />
                                                Vận chuyển
                                            </span>
                                            <span className="text-emerald-600 font-bold text-[10px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded">Miễn phí</span>
                                        </div>
                                        <div className="border-t border-dashed border-gray-200 pt-3 mt-2 flex justify-between items-end">
                                            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Tổng cộng</span>
                                            <span className="text-xl font-black text-primary-600 leading-none">{formatCurrency(finalTotal)}</span>
                                        </div>
                                    </div>

                                    {finalTotal > availableCredit && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 text-red-700 text-xs">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span className="font-medium">Đơn hàng vượt quá hạn mức tín dụng khả dụng. Vui lòng thanh toán bớt công nợ.</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing || finalTotal > availableCredit}
                                        className="w-full mt-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:from-primary-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-4 h-4" />
                                                Xác nhận đặt hàng
                                            </>
                                        )}
                                    </button>

                                    <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">
                                        Bằng việc đặt hàng, bạn đồng ý với chính sách công nợ 30 ngày.
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
