'use client'

/**
 * BoQ to Cart Button
 * One-click conversion of BoQ materials to shopping cart
 */

import { useState } from 'react'
import { ShoppingCart, Check, Loader2, Gift, ArrowRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Material {
    productId: string
    name: string
    quantity: number
    unit: string
    price: number
}

interface BoQToCartButtonProps {
    applicationId: string
    materials: Material[]
    isVerified?: boolean
    onSuccess?: () => void
}

export default function BoQToCartButton({
    applicationId,
    materials,
    isVerified = false,
    onSuccess
}: BoQToCartButtonProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [result, setResult] = useState<{
        addedCount: number
        cartTotal: number
        discountApplied: number
    } | null>(null)

    const totalValue = materials.reduce((sum, m) => sum + (m.price * m.quantity), 0)
    const discountedValue = isVerified ? totalValue * 0.95 : totalValue

    const handleAddToCart = async () => {
        setLoading(true)

        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/applications/${applicationId}/to-cart`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
                setResult(data.data)
                toast.success(data.message || 'Đã thêm vào giỏ hàng!')
                onSuccess?.()
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount)
    }

    if (!materials || materials.length === 0) {
        return null
    }

    // Success state
    if (success && result) {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-full">
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800">
                            Đã thêm {result.addedCount} sản phẩm vào giỏ
                        </p>
                        {result.discountApplied > 0 && (
                            <p className="text-sm text-green-600">
                                🎉 Đã áp dụng giảm {result.discountApplied}% Verified Partner
                            </p>
                        )}
                    </div>
                </div>
                <Link
                    href="/cart"
                    className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Xem giỏ hàng ({formatCurrency(result.cartTotal)}đ)
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        )
    }

    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Vật tư từ SmartBuild</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {materials.length} sản phẩm
                </span>
            </div>

            {/* Materials preview */}
            <div className="space-y-1 mb-3 text-sm text-gray-600">
                {materials.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex justify-between">
                        <span className="truncate">{m.name}</span>
                        <span className="text-gray-500 whitespace-nowrap ml-2">
                            x{m.quantity} {m.unit}
                        </span>
                    </div>
                ))}
                {materials.length > 3 && (
                    <p className="text-blue-600 text-xs">+{materials.length - 3} sản phẩm khác</p>
                )}
            </div>

            {/* Price summary */}
            <div className="flex items-center justify-between py-2 border-t border-blue-200 mb-3">
                <span className="text-sm text-gray-600">Tổng giá trị:</span>
                <div className="text-right">
                    {isVerified && (
                        <span className="text-xs text-gray-400 line-through mr-2">
                            {formatCurrency(totalValue)}đ
                        </span>
                    )}
                    <span className="font-bold text-blue-700">
                        {formatCurrency(discountedValue)}đ
                    </span>
                </div>
            </div>

            {/* Discount badge */}
            {isVerified && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-700 font-medium">
                        Giảm 5% vì bạn là Verified Partner! Tiết kiệm {formatCurrency(totalValue * 0.05)}đ
                    </span>
                </div>
            )}

            {/* Action button */}
            <button
                onClick={handleAddToCart}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang thêm...
                    </>
                ) : (
                    <>
                        <ShoppingCart className="w-5 h-5" />
                        Mua toàn bộ vật tư này
                    </>
                )}
            </button>
        </div>
    )
}
