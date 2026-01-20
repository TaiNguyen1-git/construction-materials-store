'use client'

/**
 * Add to Cart from Estimate Component
 * One-click button to add all materials from an estimate to shopping cart
 */

import { useState } from 'react'
import { ShoppingCart, Loader2, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Material {
    productId?: string
    name: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
}

interface AddToCartButtonProps {
    estimateId?: string
    materials: Material[]
    projectName?: string
    customerId?: string
    onSuccess?: () => void
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

export default function AddToCartFromEstimate({
    estimateId,
    materials,
    projectName,
    customerId,
    onSuccess,
    variant = 'primary',
    size = 'lg'
}: AddToCartButtonProps) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        success: boolean
        addedCount: number
        notFoundCount: number
    } | null>(null)
    const router = useRouter()

    const handleAddToCart = async () => {
        if (!customerId) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
            router.push('/login?redirect=/estimator')
            return
        }

        if (materials.length === 0) {
            toast.error('Không có vật liệu để thêm')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/cart/add-from-estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estimateId,
                    customerId,
                    materials,
                    projectName: projectName || 'Dự toán vật liệu'
                })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
                return
            }

            setResult({
                success: true,
                addedCount: data.data.addedItems.length,
                notFoundCount: data.data.notFoundItems.length
            })

            if (data.data.notFoundItems.length > 0) {
                toast(
                    `Đã thêm ${data.data.addedItems.length} sản phẩm!\n${data.data.notFoundItems.length} sản phẩm không tìm thấy trong kho.`,
                    { icon: '⚠️', duration: 5000 }
                )
            } else {
                toast.success(`Đã thêm ${data.data.addedItems.length} sản phẩm vào giỏ hàng!`)
            }

            onSuccess?.()

        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const goToCart = () => {
        router.push('/cart')
    }

    // Size classes
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm gap-2',
        md: 'px-5 py-3 text-base gap-2',
        lg: 'px-6 py-4 text-lg gap-3'
    }

    // Variant classes
    const variantClasses = {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300',
        secondary: 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50',
        ghost: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    }

    // After successful add
    if (result?.success) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                        <p className="font-bold text-green-800">Đã thêm vào giỏ hàng!</p>
                        <p className="text-sm text-green-600">
                            {result.addedCount} sản phẩm
                            {result.notFoundCount > 0 && (
                                <span className="ml-1 text-orange-600">
                                    ({result.notFoundCount} không tìm thấy)
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <button
                    onClick={goToCart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
                >
                    <ShoppingCart className="w-5 h-5" />
                    Xem giỏ hàng
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    onClick={() => setResult(null)}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                    Thêm lại
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={handleAddToCart}
            disabled={loading || materials.length === 0}
            className={`w-full flex items-center justify-center font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]}`}
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang thêm...</span>
                </>
            ) : (
                <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Thêm tất cả vào giỏ hàng</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
                        {materials.length}
                    </span>
                </>
            )}
        </button>
    )
}
