'use client'

/**
 * AI Material Estimator Page
 * Upload floor plan images or describe your project to get material estimates
 */

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    Camera,
    FolderPlus,
    Sparkles
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useCartStore, CartItem } from '@/stores/cartStore'
import { useAuth } from '@/contexts/auth-context'

import LoginIncentiveModal from '@/components/LoginIncentiveModal'
import SiteHeader from '@/components/Header'

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
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const [projectType, setProjectType] = useState<string>('flooring')
    const [inputMode, setInputMode] = useState<'image' | 'text'>('text')
    const [description, setDescription] = useState('')
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageBase64, setImageBase64] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<EstimatorResult | null>(null)
    const [addingToCart, setAddingToCart] = useState(false)
    const [creatingProject, setCreatingProject] = useState(false)
    const [showProjectModal, setShowProjectModal] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [projectName, setProjectName] = useState('')
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

    const handleCreateProject = async () => {
        if (!result || !projectName.trim()) {
            toast.error('Vui lòng nhập tên dự án')
            return
        }

        setCreatingProject(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: projectName,
                    description: `Dự án ${PROJECT_TYPES.find(t => t.id === projectType)?.name || projectType}. Diện tích: ${result.totalArea}m². ${description}`,
                    startDate: new Date().toISOString(),
                    budget: result.totalEstimatedCost || 0,
                    priority: 'MEDIUM',
                    notes: `Dự toán AI: ${result.materials.map(m => `${m.productName} x${m.quantity} ${m.unit}`).join(', ')}`
                })
            })

            if (res.ok) {
                const project = await res.json()
                toast.success('Đã tạo dự án thành công!')
                setShowProjectModal(false)

                // Save estimate data to localStorage for project materials page
                localStorage.setItem('pending_estimate', JSON.stringify({
                    projectId: project.id,
                    materials: result.materials,
                    totalCost: result.totalEstimatedCost
                }))

                router.push(`/account/projects/${project.id}`)
            } else {
                const error = await res.json()
                toast.error(error.error || 'Không thể tạo dự án')
            }
        } catch (error) {
            console.error('Error creating project:', error)
            toast.error('Lỗi kết nối server')
        } finally {
            setCreatingProject(false)
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

            {/* Project Creation Modal */}
            {showProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FolderPlus className="w-6 h-6" />
                                Tạo Dự Án Mới
                            </h2>
                            <p className="text-indigo-100 text-sm mt-1">Lưu trữ dự toán và theo dõi tiến độ công trình</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên dự án *</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="VD: Xây nhà Q7, Sửa phòng khách..."
                                />
                            </div>

                            {result && (
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Diện tích:</span>
                                        <span className="font-semibold text-gray-800">{result.totalArea.toFixed(1)} m²</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Ngân sách dự kiến:</span>
                                        <span className="font-semibold text-indigo-600">{formatCurrency(result.totalEstimatedCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Số loại vật liệu:</span>
                                        <span className="font-semibold text-gray-800">{result.materials.length} sản phẩm</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowProjectModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={creatingProject || !projectName.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creatingProject ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Tạo Dự Án
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Header */}
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header - High Density */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                        <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-none mb-1">AI ESTIMATOR</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Dự toán vật liệu thông minh</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* Input Panel */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Project Type Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Loại công việc</h2>
                            <div className="grid grid-cols-4 gap-2">
                                {PROJECT_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setProjectType(type.id)}
                                        className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${projectType === type.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center`}>
                                            <type.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className={`text-[10px] font-bold ${projectType === type.id ? 'text-primary-700' : 'text-gray-500'}`}>
                                            {type.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Mode Toggle */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex gap-1.5 mb-4 bg-gray-50 p-1 rounded-lg">
                                <button
                                    onClick={() => setInputMode('text')}
                                    className={`flex-1 py-2 px-3 rounded-md text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${inputMode === 'text'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Ruler className="w-3.5 h-3.5" />
                                    KÍCH THƯỚC
                                </button>
                                <button
                                    onClick={() => setInputMode('image')}
                                    className={`flex-1 py-2 px-3 rounded-md text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${inputMode === 'image'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    MẶT BẰNG
                                </button>
                            </div>

                            {inputMode === 'text' ? (
                                <div className="animate-in fade-in duration-300">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ví dụ: Lát sân vườn 6x8m, phòng khách 5x4m..."
                                        className="w-full h-24 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none leading-relaxed"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                        💡 Mẹo: Nhập kích thước cụ thể để AI tính toán chính xác hơn
                                    </p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />

                                    {imagePreview ? (
                                        <div className="relative group">
                                            <img
                                                src={imagePreview}
                                                alt="Floor plan preview"
                                                className="w-full h-32 object-contain bg-gray-50 rounded-lg border border-gray-100"
                                            />
                                            <button
                                                onClick={() => {
                                                    setImagePreview(null)
                                                    setImageBase64(null)
                                                }}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full hover:bg-red-600 flex items-center justify-center text-xs shadow-lg transition-transform group-hover:scale-110"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-32 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Upload className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-gray-700 uppercase tracking-tighter">Click để upload</p>
                                                <p className="text-[10px] text-gray-400">Ảnh mặt bằng hoặc bản vẽ phòng</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleEstimate}
                                disabled={loading}
                                className="w-full mt-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-100"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        ĐANG PHÂN TÍCH...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="w-4 h-4" />
                                        PHÂN TÍCH VẬT LIỆU AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-7 space-y-4">
                        {result ? (
                            <>
                                {/* Summary Card - Compact */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">TỔNG QUAN DỰ TOÁN</h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${result.confidence > 0.7 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            ĐỘ TIN CẬY: {(result.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-primary-50 px-4 py-3 rounded-xl border border-primary-100">
                                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-tighter mb-1">Diện tích</p>
                                            <p className="text-xl font-black text-slate-900">{result.totalArea.toFixed(1)} <span className="text-xs">m²</span></p>
                                        </div>
                                        <div className="bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-1">Ngân sách dự kiến</p>
                                            <p className="text-xl font-black text-slate-900">
                                                {result.totalEstimatedCost > 0
                                                    ? formatCurrency(result.totalEstimatedCost).replace(/₫/g, '')
                                                    : '...'} <span className="text-xs">₫</span>
                                            </p>
                                        </div>
                                    </div>

                                    {result.rooms.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 border-t border-gray-50 pt-3">
                                            {result.rooms.map((room, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-500 font-bold border border-gray-100">
                                                    {room.name.toUpperCase()} ({room.area.toFixed(0)}M²)
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Materials Grid - Optimized */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-in slide-in-from-right-4 duration-700">
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">DANH SÁCH VẬT LIỆU</h2>

                                    <div className="grid gap-2">
                                        {result.materials.map((material, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-gray-100 group-hover:bg-primary-600 transition-colors">
                                                        <Package className="w-4 h-4 text-primary-600 group-hover:text-white" />
                                                    </div>
                                                    <div>
                                                        <Link href={material.productId ? `/products/${material.productId}` : '#'} className="font-bold text-xs text-slate-800 hover:text-primary-600 transition-colors line-clamp-1 uppercase tracking-tight">
                                                            {material.productName}
                                                        </Link>
                                                        <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{material.reason}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-xs text-slate-900">
                                                        {material.quantity} <span className="text-[10px] text-gray-400 underline">{material.unit}</span>
                                                    </p>
                                                    {material.price && (
                                                        <p className="text-[10px] font-bold text-primary-600">{formatCurrency(material.price * material.quantity)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <button
                                            onClick={handleAddAllToCart}
                                            disabled={addingToCart || !result.materials.some(m => m.productId)}
                                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-50"
                                        >
                                            {addingToCart ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4" />
                                                    VÀO GIỎ HÀNG
                                                </>
                                            )}
                                        </button>

                                        {isAuthenticated ? (
                                            <button
                                                onClick={() => {
                                                    setProjectName(`Dự án ${PROJECT_TYPES.find(t => t.id === projectType)?.name} - ${new Date().toLocaleDateString('vi-VN')}`)
                                                    setShowProjectModal(true)
                                                }}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-50"
                                            >
                                                <FolderPlus className="w-4 h-4" />
                                                LƯU DỰ ÁN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowLoginModal(true)}
                                                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                MỞ KHÓA Dự Án
                                            </button>
                                        )}
                                    </div>
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

                <LoginIncentiveModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    feature="general"
                    title="Mở khóa Dự án"
                    description="Đăng nhập để lưu trữ kết quả dự toán, theo dõi tiến trình và dễ dàng mời các nhà thầu báo giá."
                />
            </main>
        </div>
    )
}
