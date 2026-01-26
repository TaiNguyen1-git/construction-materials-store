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
    ArrowRight,
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
    Sparkles,
    Info
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
    isInStore?: boolean
}

interface EstimatorResult {
    success: boolean
    projectType: string
    buildingStyle?: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự'
    rooms: RoomDimension[]
    totalArea: number
    materials: MaterialEstimate[]
    totalEstimatedCost: number
    confidence: number
    rawAnalysis?: string
    error?: string
    fengShuiAdvice?: string
    wallPerimeter?: number
    roofType?: string
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
    const [imagesPreview, setImagesPreview] = useState<string[]>([])
    const [imagesBase64, setImagesBase64] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<EstimatorResult | null>(null)
    const [isReviewing, setIsReviewing] = useState(false)

    // Editable data for confirmation
    const [reviewArea, setReviewArea] = useState<number>(0)
    const [reviewRooms, setReviewRooms] = useState<RoomDimension[]>([])
    const [reviewStyle, setReviewStyle] = useState<string>('nhà_phố')
    const [reviewWallPerimeter, setReviewWallPerimeter] = useState<number>(0)
    const [reviewRoofType, setReviewRoofType] = useState<string>('bê_tông')
    const [reviewFengShui, setReviewFengShui] = useState<string>('')

    const [addingToCart, setAddingToCart] = useState(false)
    const [creatingProject, setCreatingProject] = useState(false)
    const [showProjectModal, setShowProjectModal] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [birthYear, setBirthYear] = useState('')
    const [houseDirection, setHouseDirection] = useState('Đông Nam')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cart store for adding estimated materials (regular user cart)
    const { addItem: addToCart, openCart } = useCartStore()

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Ảnh ${file.name} quá lớn (tối đa 10MB)`)
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                const base64 = event.target?.result as string
                setImagesPreview(prev => [...prev, base64])
                setImagesBase64(prev => [...prev, base64])
            }
            reader.readAsDataURL(file)
        })
    }

    const handleEstimate = async () => {
        if (inputMode === 'text' && !description.trim()) {
            toast.error('Vui lòng mô tả dự án của bạn')
            return
        }
        if (inputMode === 'image' && imagesBase64.length === 0) {
            toast.error('Vui lòng upload ít nhất một ảnh bản vẽ')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const payload: any = {
                projectType,
                birthYear: birthYear || undefined,
                houseDirection: houseDirection || undefined
            }
            if (inputMode === 'image') {
                payload.images = imagesBase64
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
                // If it's an image upload, go to review step first
                if (inputMode === 'image') {
                    const resData = data.data as EstimatorResult
                    setReviewArea(resData.totalArea)
                    setReviewRooms(resData.rooms)
                    setReviewStyle(resData.buildingStyle || 'nhà_phố')
                    setReviewWallPerimeter(resData.wallPerimeter || (resData.totalArea * 0.8))
                    setReviewRoofType(resData.roofType || 'bê_tông')
                    setReviewFengShui(resData.fengShuiAdvice || '')
                    setIsReviewing(true)
                    setResult(null) // Don't show results yet
                    toast.success('Đã bóc tách xong bản vẽ, vui lòng xác nhận lại diện tích!')
                } else {
                    setResult(data.data)
                    toast.success('Đã phân tích xong!')
                }
            } else {
                toast.error(data.error || 'Có lỗi xảy ra')
            }

        } catch (error: any) {
            toast.error('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    const handleFinalRecalculate = async () => {
        setLoading(true)
        try {
            const payload = {
                isRecalculation: true,
                projectType,
                totalArea: reviewArea,
                rooms: reviewRooms,
                buildingStyle: reviewStyle,
                wallPerimeter: reviewWallPerimeter,
                roofType: reviewRoofType,
                fengShuiAdvice: reviewFengShui
            }

            const res = await fetch('/api/estimator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (data.success) {
                setResult(data.data)
                setIsReviewing(false)
                toast.success('Dự toán vật liệu đã được cập nhật chính xác!')
            } else {
                toast.error(data.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Recalculation error:', error)
            toast.error('Không thể cập nhật dự toán')
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
                                        <span className="font-semibold text-gray-800">{(result.totalArea || 0).toFixed(1)} m²</span>
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
                                    MÔ TẢ DỰ ÁN
                                </button>
                                <button
                                    onClick={() => setInputMode('image')}
                                    className={`flex-1 py-2 px-3 rounded-md text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${inputMode === 'image'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    TẢI BẢN VẼ
                                </button>
                            </div>

                            {inputMode === 'text' ? (
                                <div className="animate-in fade-in duration-300">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Mô tả dự án của bạn (VD: Lát sân vườn 6x8m, xây tường rào dài 20m cao 2.5m...)"
                                        className="w-full h-24 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none leading-relaxed"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                        💡 Mẹo: Mô tả càng chi tiết về diện tích và chiều cao, AI tính toán càng chính xác.
                                    </p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />

                                    {imagesPreview.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                                {imagesPreview.map((src, idx) => (
                                                    <div key={idx} className="relative group aspect-square">
                                                        <img
                                                            src={src}
                                                            alt={`Preview ${idx + 1}`}
                                                            className="w-full h-full object-cover bg-gray-50 rounded-lg border border-gray-100"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                setImagesPreview(prev => prev.filter((_, i) => i !== idx))
                                                                setImagesBase64(prev => prev.filter((_, i) => i !== idx))
                                                            }}
                                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full hover:bg-red-600 flex items-center justify-center text-xs shadow-lg transition-transform group-hover:scale-110"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-all"
                                                >
                                                    <Plus className="w-5 h-5 text-gray-400" />
                                                </button>
                                            </div>
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
                                                <p className="text-xs font-black text-gray-700 uppercase tracking-tighter">Bấm để tải bản vẽ lên</p>
                                                <p className="text-[10px] text-gray-400">Hệ thống chấp nhận file ảnh mặt bằng hoặc ảnh chụp thực tế</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Feng Shui Input Section (Optional) */}
                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <details className="group">
                                    <summary className="list-none cursor-pointer flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-primary-600 transition-colors">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>TƯ VẤN PHONG THỦY (TÙY CHỌN)</span>
                                        <Plus className="w-3 h-3 group-open:rotate-45 transition-transform ml-auto" />
                                    </summary>

                                    <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-1">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 mb-1 block">Năm sinh khách hàng</label>
                                            <input
                                                type="number"
                                                value={birthYear}
                                                onChange={(e) => setBirthYear(e.target.value)}
                                                placeholder="VD: 1988"
                                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 mb-1 block">Hướng công trình</label>
                                            <select
                                                value={houseDirection}
                                                onChange={(e) => setHouseDirection(e.target.value)}
                                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                                            >
                                                <option value="">-- Chọn hướng --</option>
                                                <option value="Đông">Đông</option>
                                                <option value="Tây">Tây</option>
                                                <option value="Nam">Nam</option>
                                                <option value="Bắc">Bắc</option>
                                                <option value="Đông Nam">Đông Nam</option>
                                                <option value="Đông Bắc">Đông Bắc</option>
                                                <option value="Tây Nam">Tây Nam</option>
                                                <option value="Tây Bắc">Tây Bắc</option>
                                            </select>
                                        </div>
                                    </div>
                                </details>
                            </div>

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
                            <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Hoặc đăng tin tìm nhà thầu ngay</p>
                                <Link
                                    href="/projects/post"
                                    className="inline-flex items-center gap-2 text-xs font-black text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                    ĐIỀN THÔNG TIN THỦ CÔNG <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-7 space-y-4">
                        {isReviewing && (
                            <div className="bg-white rounded-xl shadow-xl border-2 border-primary-100 p-6 animate-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Xác nhận thông số bản vẽ</h2>
                                        <p className="text-xs text-slate-500">AI đã bóc tách xong, quý khách vui lòng kiểm tra và sửa lại con số nếu cần để dự toán chính xác nhất.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Building Info */}
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            {imagesPreview.length > 0 && (
                                                <div className="w-1/3 aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex-shrink-0">
                                                    <img src={imagesPreview[0]} className="w-full h-full object-cover" alt="Floor plan reference" />
                                                    <div className="text-[8px] bg-black/50 text-white text-center py-0.5 mt-[-16px] relative z-10 font-bold">BẢN VẼ GỐC</div>
                                                </div>
                                            )}
                                            <div className={imagesPreview.length > 0 ? "w-2/3" : "w-full"}>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loại hình công trình</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { id: 'nhà_cấp_4', label: 'Nhà cấp 4' },
                                                        { id: 'nhà_phố', label: 'Nhà phố' },
                                                        { id: 'biệt_thự', label: 'Biệt thự' }
                                                    ].map((style) => (
                                                        <button
                                                            key={style.id}
                                                            onClick={() => setReviewStyle(style.id)}
                                                            className={`text-left px-4 py-2 rounded-xl border text-xs font-bold transition-all ${reviewStyle === style.id
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                                                : 'border-gray-100 hover:border-gray-200 text-slate-500'
                                                                }`}
                                                        >
                                                            {style.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loại mái & Kết cấu</label>
                                            <select
                                                value={reviewRoofType}
                                                onChange={(e) => setReviewRoofType(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold text-slate-700 bg-white"
                                            >
                                                <option value="mái_tôn">Mái tôn (Tiết kiệm)</option>
                                                <option value="bê_tông">Mái bê tông phẳng (Sân thượng)</option>
                                                <option value="mái_thái">Mái Thái / Mái ngói (Sang trọng)</option>
                                            </select>
                                        </div>
                                        <div className="bg-primary-600 p-5 rounded-2xl shadow-xl shadow-primary-100">
                                            <label className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1">Tổng diện tích xây dựng (m²)</label>
                                            <div className="flex items-baseline gap-2">
                                                <input
                                                    type="number"
                                                    value={reviewArea}
                                                    onChange={(e) => setReviewArea(Number(e.target.value))}
                                                    className="w-full bg-transparent text-4xl font-black text-white outline-none border-none focus:ring-0 p-0"
                                                />
                                                <span className="text-white/50 font-black text-xl">m²</span>
                                            </div>
                                            <p className="text-[9px] text-white/60 mt-2 font-medium italic">* Diện tích bao gồm tất cả các mặt sàn và ban công.</p>
                                        </div>
                                    </div>

                                    {/* Rooms List */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chi tiết các phòng detected</label>
                                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                            {reviewRooms.map((room, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                                                    <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}.</span>
                                                    <input
                                                        className="flex-grow bg-transparent text-xs font-bold text-slate-700 outline-none"
                                                        value={room.name}
                                                        onChange={(e) => {
                                                            const newRooms = [...reviewRooms]
                                                            newRooms[idx].name = e.target.value
                                                            setReviewRooms(newRooms)
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            className="w-12 bg-white border border-gray-200 rounded px-1 py-0.5 text-xs font-black text-right outline-none"
                                                            value={room.area}
                                                            onChange={(e) => {
                                                                const newRooms = [...reviewRooms]
                                                                newRooms[idx].area = Number(e.target.value)
                                                                setReviewRooms(newRooms)
                                                            }}
                                                        />
                                                        <span className="text-[9px] font-bold text-gray-400">m²</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setReviewRooms([...reviewRooms, { name: 'Phòng mới', area: 15, length: 0, width: 0 }])}
                                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-3 h-3" /> THÊM PHÒNG
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex gap-3">
                                    <button
                                        onClick={() => setIsReviewing(false)}
                                        className="flex-shrink-0 px-6 py-3 rounded-xl border border-gray-200 text-[11px] font-black text-gray-400 hover:bg-gray-50 uppercase tracking-tight"
                                    >
                                        Quay lại
                                    </button>
                                    <button
                                        onClick={handleFinalRecalculate}
                                        disabled={loading}
                                        className="flex-grow bg-slate-900 hover:bg-black text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                Xác nhận & Tính toán vật liệu
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {result ? (
                            <>
                                {/* Prediction & Confidence */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-6 bg-primary-600 rounded-full"></div>
                                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Tổng quan Dự toán AI</h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Độ tin cậy</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <div key={star} className={`w-3 h-3 rounded-sm ${star <= (result.confidence * 5) ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-primary-50 px-4 py-3 rounded-xl border border-primary-100">
                                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-tighter mb-1">Tổng diện tích xây dựng</p>
                                            <p className="text-xl font-black text-slate-900">{(result.totalArea || 0).toFixed(1)} <span className="text-xs">m²</span></p>
                                        </div>
                                        <div className="bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-1">Ngân sách dự kiến (Vật tư tại kho)</p>
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
                                                    tầng {room.name?.toUpperCase().includes('TẦNG') ? '' : ''}{room.name?.toUpperCase()} ({room.area ? room.area.toFixed(0) : '?'}M²)
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Feng Shui Advice Display */}
                                    {result.fengShuiAdvice && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-start gap-3 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div className="prose prose-sm prose-amber max-w-none">
                                                    <p className="font-bold text-amber-900 text-[10px] uppercase tracking-wider mb-1">Góc Tư Vấn Phong Thủy</p>
                                                    <div className="text-xs leading-relaxed text-amber-800/90 whitespace-pre-wrap">{result.fengShuiAdvice}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* BẢN TỔNG HỢP CHI TIẾT (New Section requested by user) */}
                                <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600"></div>

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">BẢN TỔNG HỢP DỰ TOÁN</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hệ thống bóc tách tự động SmartBuild v2.0</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-500 mb-1">Mã dự toán: #EST-{Math.random().toString(36).substring(7).toUpperCase()}</div>
                                            <div className="text-xs font-bold text-slate-500">Ngày tạo: {new Date().toLocaleDateString('vi-VN')}</div>
                                        </div>
                                    </div>

                                    {/* 1. Giả định chung */}
                                    <section className="space-y-2">
                                        <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-tighter">1. GIẢ ĐỊNH CHUNG</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-600">
                                            <div className="flex justify-between border-b border-slate-50 py-1">
                                                <span>Diện tích xây dựng:</span>
                                                <span className="font-bold text-slate-800">{(result.totalArea || 0).toFixed(1)} m²</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 py-1">
                                                <span>Kết cấu dự kiến:</span>
                                                <span className="font-bold text-slate-800">{result.buildingStyle === 'biệt_thự' ? 'BTCT Khung chịu lực' : 'BTCT / Tường gạch'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 py-1">
                                                <span>Quy mô:</span>
                                                <span className="font-bold text-slate-800">{result.rooms.length} phòng chức năng</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 py-1">
                                                <span>Chất lượng vật liệu:</span>
                                                <span className="font-bold text-slate-800">Mức phổ thông - Trung bình</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] italic text-slate-400 mt-2">
                                            * Ghi chú: Nếu thực tế thi công khác với bản vẽ (về phần mái, móng cọc hoặc lệch tầng), khối lượng vật tư sẽ có sự thay đổi tương ứng.
                                        </p>
                                    </section>

                                    {/* 2. Dự toán vật liệu chính */}
                                    <section className="space-y-2">
                                        <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-tighter">2. DỰ TOÁN VẬT LIỆU CHÍNH (PHẦN THÔ)</h3>
                                        <div className="overflow-hidden rounded-lg border border-gray-100">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                                    <tr>
                                                        <th className="px-4 py-2">Loại vật tư</th>
                                                        <th className="px-4 py-2">Khối lượng ước tính</th>
                                                        <th className="px-4 py-2">Ghi chú kỹ thuật</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {['Xi măng', 'Cát', 'Đá', 'Thép', 'Gạch'].map((itemName) => {
                                                        const item = result.materials.find(m => m.productName.toLowerCase().includes(itemName.toLowerCase()))
                                                        if (!item) return null
                                                        return (
                                                            <tr key={itemName} className="hover:bg-gray-50/50">
                                                                <td className="px-4 py-2 font-bold text-slate-700">{itemName}</td>
                                                                <td className="px-4 py-2 text-slate-900 font-bold">{item.quantity} {item.unit}</td>
                                                                <td className="px-4 py-2 text-slate-500 text-[10px]">{item.reason}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>

                                    {/* 3. Vật liệu hoàn thiện (Tham khảo) */}
                                    <section className="space-y-2">
                                        <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-tighter">3. VẬT LIỆU HOÀN THIỆN CƠ BẢN (THAM KHẢO)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Hệ thống điện: ~{Math.ceil(result.totalArea * 3)}m dây & ống</li>
                                                <li>Hệ thống nước: ~{Math.ceil(result.totalArea * 2)}m ống các loại</li>
                                            </ul>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Gạch lát sàn: ~{result.totalArea.toFixed(0)} m²</li>
                                                <li>Gạch ốp tường: ~{(result.totalArea * 0.7).toFixed(0)} m²</li>
                                            </ul>
                                        </div>
                                    </section>

                                    {/* 4. Tổng kết chi phí */}
                                    <section className="space-y-4 pt-4">
                                        <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-widest border-l-4 border-primary-600 pl-3">4. ƯỚC TÍNH NGÂN SÁCH VẬT LIỆU</h3>
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-center opacity-60 mb-6">
                                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Hạng mục thi công</span>
                                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Dự thảo ngân sách</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-white/70">Vật tư phần thô:</span>
                                                        <span className="font-bold">{formatCurrency(result.totalEstimatedCost * 0.7)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-white/70">Vật tư hoàn thiện & Phụ trợ:</span>
                                                        <span className="font-bold">{formatCurrency(result.totalEstimatedCost * 0.3)}</span>
                                                    </div>
                                                    <div className="h-px bg-white/10 my-6"></div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Tổng cộng ước tính (+/- 10%)</p>
                                                            <h4 className="text-3xl font-black tracking-tighter">
                                                                {formatCurrency(result.totalEstimatedCost)}
                                                            </h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold">
                                                                <CheckCircle className="w-3 h-3 text-emerald-400" /> CHƯA BAO GỒM NHÂN CÔNG
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                                        </div>
                                    </section>
                                </div>

                                {/* Materials Grid - Optimized */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-in slide-in-from-right-4 duration-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">DANH SÁCH VẬT LIỆU</h2>
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 italic">Bấm vào mục (i) để xem chi tiết kỹ thuật</span>
                                    </div>

                                    <div className="grid gap-2">
                                        {(result as any).materials.map((material: any, i: number) => (
                                            <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${material.isInStore ? 'bg-white border-slate-100 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/20' : 'bg-slate-50 border-slate-100 opacity-80'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${material.isInStore ? 'bg-primary-50 border-primary-100 group-hover:bg-primary-600 group-hover:scale-110' : 'bg-slate-100 border-slate-200'}`}>
                                                        <Package className={`w-6 h-6 ${material.isInStore ? 'text-primary-600 group-hover:text-white' : 'text-slate-400'}`} />
                                                    </div>
                                                    <div>
                                                        {material.isInStore ? (
                                                            <div className="flex items-center gap-2 mb-0.5 relative group/info">
                                                                <Link href={`/products/${material.productId}`} className="font-black text-sm text-slate-800 hover:text-primary-600 transition-colors line-clamp-1 uppercase tracking-tight">
                                                                    {material.productName}
                                                                </Link>
                                                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-primary-500 cursor-help" />

                                                                {/* Tooltip */}
                                                                <div className="absolute left-0 bottom-full mb-3 hidden group-hover/info:block z-50 w-72 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
                                                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                                                        <Sparkles className="w-4 h-4 text-primary-400" />
                                                                        <span className="font-black text-primary-400 uppercase tracking-widest">Cơ sở tính toán</span>
                                                                    </div>
                                                                    <p className="leading-relaxed opacity-90 font-medium">{material.reason}</p>
                                                                    <div className="absolute left-6 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900"></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 mb-0.5 relative group/info">
                                                                <span className="font-black text-sm text-slate-400 line-clamp-1 uppercase tracking-tight italic">
                                                                    {material.productName}
                                                                </span>
                                                                <Info className="w-3.5 h-3.5 text-slate-200 cursor-help" />

                                                                {/* Tooltip for non-store items */}
                                                                <div className="absolute left-0 bottom-full mb-3 hidden group-hover/info:block z-50 w-72 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
                                                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                                                        <span className="font-black text-amber-400 uppercase tracking-widest">Thông tin thị trường</span>
                                                                    </div>
                                                                    <p className="leading-relaxed opacity-90 font-medium">{material.reason}</p>
                                                                    <p className="mt-3 text-[10px] text-gray-500 italic border-t border-white/5 pt-2">* Sản phẩm đang được cập nhật vào kho.</p>
                                                                    <div className="absolute left-6 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900"></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${material.isInStore ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {material.isInStore ? 'CÓ TRONG KHO' : 'LIÊN HỆ BÁO GIÁ'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">| {material.unit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-black text-slate-900 leading-none">
                                                            {material.quantity.toLocaleString('vi-VN')}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{material.unit}</span>
                                                    </div>
                                                    {material.isInStore && (
                                                        <div className="mt-2 text-primary-600 font-black text-xs md:text-sm">
                                                            {formatCurrency(material.price * material.quantity)}
                                                        </div>
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
