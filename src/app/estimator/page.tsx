'use client'

/**
 * AI Material Estimator Page
 * Upload floor plan images or describe your project to get material estimates
 */

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
    Upload,
    Calculator,
    Image as ImageIcon,
    ArrowLeft,
    Package,
    ShoppingCart,
    Loader2,
    CheckCircle,
    AlertCircle,
    Ruler,
    PaintBucket,
    Grid3X3,
    Hammer,
    Plus,
    Camera
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useCartStore, CartItem } from '@/stores/cartStore'

interface RoomDimension {
    name: string
    length: number
    width: number
    area: number
}

interface MaterialEstimate {
    productName: string
    productId?: string
    quantity: number
    unit: string
    reason: string
    price?: number
}

interface EstimatorResult {
    success: boolean
    projectType: string
    rooms: RoomDimension[]
    totalArea: number
    materials: MaterialEstimate[]
    totalEstimatedCost: number
    confidence: number
    rawAnalysis?: string
    error?: string
}

const PROJECT_TYPES = [
    { id: 'flooring', name: 'Lát nền', icon: Grid3X3, color: 'bg-blue-500' },
    { id: 'painting', name: 'Sơn tường', icon: PaintBucket, color: 'bg-green-500' },
    { id: 'tiling', name: 'Ốp tường', icon: Grid3X3, color: 'bg-purple-500' },
    { id: 'general', name: 'Tổng quát', icon: Hammer, color: 'bg-orange-500' },
]

export default function EstimatorPage() {
    const [projectType, setProjectType] = useState<string>('flooring')
    const [inputMode, setInputMode] = useState<'image' | 'text'>('text')
    const [description, setDescription] = useState('')
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageBase64, setImageBase64] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<EstimatorResult | null>(null)
    const [addingToCart, setAddingToCart] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cart store for adding estimated materials (regular user cart)
    const { addItem: addToCart, openCart } = useCartStore()

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Ảnh quá lớn (tối đa 10MB)')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target?.result as string
            setImagePreview(base64)
            setImageBase64(base64)
        }
        reader.readAsDataURL(file)
    }

    const handleEstimate = async () => {
        if (inputMode === 'text' && !description.trim()) {
            toast.error('Vui lòng mô tả dự án của bạn')
            return
        }
        if (inputMode === 'image' && !imageBase64) {
            toast.error('Vui lòng upload ảnh bản vẽ')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const payload: any = { projectType }
            if (inputMode === 'image') {
                payload.image = imageBase64
            } else {
                payload.description = description
            }

            const res = await fetch('/api/estimator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (data.success) {
                setResult(data.data)
                toast.success('Đã phân tích xong!')
            } else {
                toast.error(data.error || 'Có lỗi xảy ra')
            }

        } catch (error: any) {
            toast.error('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddAllToCart = async () => {
        if (!result?.materials?.length) return

        setAddingToCart(true)
        let addedCount = 0

        try {
            for (const material of result.materials) {
                if (material.productId) {
                    // Fetch product details to get all required info for cart
                    const productRes = await fetch(`/api/products/${material.productId}`)
                    if (productRes.ok) {
                        const productData = await productRes.json()
                        const product = productData.data || productData

                        // Add to local cart store
                        addToCart({
                            id: `est-${Date.now()}-${material.productId}`,
                            productId: material.productId,
                            name: product.name || material.productName,
                            price: product.price || material.price || 0,
                            quantity: material.quantity,
                            image: product.image || product.images?.[0],
                            sku: product.sku || 'N/A',
                            unit: product.unit || material.unit,
                            maxStock: product.availableQuantity
                        })
                        addedCount++
                    }
                }
            }

            if (addedCount > 0) {
                toast.success(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`)
                openCart() // Open cart drawer to show added items
            } else {
                toast.error('Không có sản phẩm nào có sẵn trong hệ thống')
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
            toast.error('Có lỗi khi thêm vào giỏ hàng')
        } finally {
            setAddingToCart(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Calculator className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">AI Dự Toán Vật Liệu</h1>
                                    <p className="text-sm text-gray-500">Upload ảnh hoặc mô tả dự án</p>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/cart"
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="hidden sm:inline">Giỏ hàng</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Input Panel */}
                    <div className="space-y-6">
                        {/* Project Type Selection */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Loại công việc</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {PROJECT_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setProjectType(type.id)}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${projectType === type.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center`}>
                                            <type.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className={`font-medium ${projectType === type.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {type.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Mode Toggle */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setInputMode('text')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${inputMode === 'text'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Ruler className="w-4 h-4" />
                                    Nhập kích thước
                                </button>
                                <button
                                    onClick={() => setInputMode('image')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${inputMode === 'image'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Camera className="w-4 h-4" />
                                    Upload ảnh
                                </button>
                            </div>

                            {inputMode === 'text' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả dự án của bạn
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ví dụ: Lát sân vườn 6x8m, phòng khách 5x4m..."
                                        className="w-full h-32 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 Gợi ý: Nhập kích thước cụ thể để có kết quả chính xác hơn
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />

                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Floor plan preview"
                                                className="w-full h-48 object-contain bg-gray-50 rounded-xl"
                                            />
                                            <button
                                                onClick={() => {
                                                    setImagePreview(null)
                                                    setImageBase64(null)
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                                        >
                                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                                                <Upload className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-gray-700">Click để upload ảnh</p>
                                                <p className="text-sm text-gray-500">Bản vẽ mặt bằng hoặc ảnh phòng</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleEstimate}
                                disabled={loading}
                                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Đang phân tích...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="w-5 h-5" />
                                        Tính toán Vật liệu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="space-y-6">
                        {result ? (
                            <>
                                {/* Summary */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Kết quả Dự toán</h2>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${result.confidence > 0.7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            Độ tin cậy: {(result.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-600">{result.totalArea.toFixed(1)} m²</p>
                                            <p className="text-sm text-gray-600">Tổng diện tích</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {result.totalEstimatedCost > 0
                                                    ? formatCurrency(result.totalEstimatedCost)
                                                    : 'Liên hệ'
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">Ước tính chi phí</p>
                                        </div>
                                    </div>

                                    {result.rooms.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Các phòng/khu vực:</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {result.rooms.map((room, i) => (
                                                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                                                        {room.name}: {room.length}×{room.width}m ({room.area.toFixed(1)}m²)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Materials List */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách Vật liệu</h2>

                                    <div className="space-y-3">
                                        {result.materials.map((material, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{material.productName}</p>
                                                        <p className="text-sm text-gray-500">{material.reason}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        {material.quantity} {material.unit}
                                                    </p>
                                                    {material.price && (
                                                        <p className="text-sm text-blue-600">{formatCurrency(material.price * material.quantity)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddAllToCart}
                                        disabled={addingToCart || !result.materials.some(m => m.productId)}
                                        className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        {addingToCart ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Đang thêm...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Thêm tất cả vào Giỏ hàng
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calculator className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có kết quả</h3>
                                <p className="text-gray-500">
                                    Nhập mô tả hoặc upload ảnh bản vẽ để bắt đầu dự toán vật liệu
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tips Section */}
                <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                    <h3 className="font-semibold mb-3">💡 Mẹo để có kết quả chính xác hơn</h3>
                    <ul className="grid md:grid-cols-2 gap-2 text-sm text-blue-100">
                        <li>• Nhập đầy đủ kích thước (dài × rộng)</li>
                        <li>• Với ảnh, chụp rõ có thước đo nếu được</li>
                        <li>• Phân chia theo từng phòng/khu vực</li>
                        <li>• Liên hệ tư vấn để được hỗ trợ chi tiết hơn</li>
                    </ul>
                </div>
            </main>
        </div>
    )
}
