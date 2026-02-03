'use client'

/**
 * AI Material Estimator Page
 * Upload floor plan images or describe your project to get material estimates
 */

import { useState, useRef, useEffect } from 'react'
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
    Info,
    ChevronDown,
    X
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
    const [showInputPanel, setShowInputPanel] = useState(true)

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
    const [showDetailedModal, setShowDetailedModal] = useState(false)
    const [loadingPhase, setLoadingPhase] = useState(0)
    const [loadingTip, setLoadingTip] = useState(0)

    const LOADING_PHASES = [
        "Đang nhận diện sơ đồ mặt bằng...",
        "Đang hệ thống hóa thông số kỹ thuật...",
        "Đang bóc tách khối lượng vật liệu...",
        "Đang tính toán đơn giá theo thị trường...",
        "Đang hoàn tất bảng dự toán chi tiết..."
    ]

    const LOADING_TIPS = [
        "Nên đặt dư 5-7% vật liệu để dự phòng hao hụt trong quá trình thi công thực tế.",
        "Sử dụng màu sơn sáng có thể giúp không gian trông rộng hơn 20% so với thực tế.",
        "Bố trí cửa sổ đối diện giúp lưu thông khí tự nhiên tốt nhất cho căn nhà.",
        "SmartBuild hỗ trợ kết nối trực tiếp với nhà thầu để tối ưu chi phí thi công.",
        "Gạch khổ lớn 80x80cm đang là xu hướng giúp mặt sàn sang trọng và ít mạch nối."
    ]

    // Effect for Cinematic Loader
    useEffect(() => {
        let phaseInterval: any;
        let tipInterval: any;

        if (loading) {
            phaseInterval = setInterval(() => {
                setLoadingPhase(prev => (prev + 1) % LOADING_PHASES.length);
            }, 2500);

            tipInterval = setInterval(() => {
                setLoadingTip(prev => (prev + 1) % LOADING_TIPS.length);
            }, 4500);
        } else {
            setLoadingPhase(0);
            setLoadingTip(0);
        }

        return () => {
            clearInterval(phaseInterval);
            clearInterval(tipInterval);
        };
    }, [loading]);
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
                    setShowInputPanel(false) // Automatically hide input panel on success
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
                setShowInputPanel(false) // Automatically hide input panel on success
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 text-white relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <h2 className="text-2xl font-black flex items-center gap-3 relative z-10 uppercase tracking-tight">
                                <FolderPlus className="w-8 h-8 text-blue-200" />
                                Tạo Dự Án Mới
                            </h2>
                            <p className="text-blue-100 text-xs mt-2 font-medium opacity-80 relative z-10 uppercase tracking-widest">Lưu trữ dự toán & quản lý tiến độ</p>
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

            {/* Detailed Estimate Modal */}
            {showDetailedModal && result && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500 flex flex-col">
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                            <div className="relative z-10 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <Package className="w-6 h-6 text-indigo-300" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Bảng Khối Lượng Chi Tiết</h2>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">AI-Generated Material Breakdown #EST-{(result as any).id || 'PRO'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailedModal(false)}
                                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors group relative z-10"
                            >
                                <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Left Side: Summary info */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thông tin dự án</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Diện tích sàn:</span>
                                                <span className="font-bold text-slate-900">{result.totalArea.toFixed(1)} m²</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Dự toán ngân sách:</span>
                                                <span className="font-black text-indigo-600">{formatCurrency(result.totalEstimatedCost)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Số loại vật phẩm:</span>
                                                <span className="font-bold text-slate-900">{result.materials.length} mục</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/30 rounded-[2rem] p-6 border border-indigo-100">
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Mẹo chuyên gia</h3>
                                        <p className="text-xs text-indigo-900/70 leading-relaxed italic">
                                            "Kết quả bóc tách dựa trên trung bình thị trường. Bạn nên đặt dư ra khoảng 5-7% so với con số này để trừ hao lãng phí trong quá trình thi công."
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Table */}
                                <div className="lg:col-span-8">
                                    <div className="rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm bg-white">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng mục</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Khối lượng</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {result.materials.map((m, i) => (
                                                    <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="font-black text-slate-800 uppercase text-xs tracking-tight group-hover:text-indigo-600 transition-colors">{m.productName}</div>
                                                            <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">{m.reason}</div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="font-black text-slate-900 text-sm">{m.quantity.toLocaleString('vi-VN')}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{m.unit}</div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            {m.price ? (
                                                                <div className="font-black text-indigo-600 text-sm">{formatCurrency(m.price * m.quantity)}</div>
                                                            ) : (
                                                                <div className="text-[10px] font-black text-slate-300 uppercase italic">Liên Hệ</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6 flex-shrink-0">
                            <div className="text-slate-400 text-xs italic font-medium">Báo giá mang tính chất tham khảo, chưa bao gồm phí vận chuyển và nhân công.</div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={handleAddAllToCart}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                                >
                                    <ShoppingCart className="w-5 h-5" /> THÊM TẤT CẢ VÀO GIỎ
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center justify-center gap-3"
                                >
                                    <Upload className="w-5 h-5 rotate-180" /> TẢI PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Header */}
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Result Section (MOVED TO TOP) */}
                {result && (
                    <div className="mb-12 space-y-8 animate-in slide-in-from-top-4 duration-700">
                        {/* Summary Header */}
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100/50">
                                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em] mb-1">Kết quả phân tích</p>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">DỰ TOÁN ĐÃ SẴN SÀNG</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Độ tin cậy AI</p>
                                    <div className="flex gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <div key={star} className={`w-3.5 h-3.5 rounded-sm ${star <= (result.confidence * 5) ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-slate-100'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA: View Details Modal - Elite Redesign */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-indigo-100/50 transition-colors duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -ml-32 -mb-32"></div>

                            <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                                {/* Left Side: Information */}
                                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                                    <div className="inline-flex items-center gap-2.5 bg-indigo-50 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100/50">
                                        <Sparkles className="w-3.5 h-3.5" /> Phân tích AI hoàn tất
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black leading-[1.4] tracking-tighter text-slate-900">
                                        Bảng Phân Tích <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 italic py-2 pr-6 inline-block">Khối Lượng Chi Tiết</span>
                                    </h3>
                                    <p className="text-slate-500 text-lg max-w-md leading-relaxed font-medium">
                                        Hệ thống đã đề xuất <span className="text-indigo-600 font-bold">{result.materials.length} loại vật tư</span> tối ưu cho dự án của bạn.
                                        Tất cả số liệu đã sẵn sàng để quý khách kiểm tra.
                                    </p>

                                    {/* Quick Stats Inline */}
                                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <Ruler className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{result.totalArea.toFixed(1)} m² Sàn</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{result.materials.length} Vật tư</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Actions */}
                                <div className="lg:col-span-5 flex flex-col gap-5 w-full">
                                    <button
                                        onClick={() => setShowDetailedModal(true)}
                                        className="w-full px-12 py-7 bg-white text-indigo-600 border-2 border-indigo-600/20 hover:border-indigo-600 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_-15px_rgba(79,70,229,0.15)] hover:shadow-indigo-200/50 flex items-center justify-center gap-4 group/btn active:scale-95"
                                    >
                                        XEM CHI TIẾT DỰ TOÁN
                                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center group-hover/btn:translate-x-1 group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </button>

                                    <div className="grid grid-cols-2 gap-4">
                                        {isAuthenticated ? (
                                            <button
                                                onClick={() => {
                                                    setProjectName(`Dự án ${PROJECT_TYPES.find(t => t.id === projectType)?.name} - ${new Date().toLocaleDateString('vi-VN')}`)
                                                    setShowProjectModal(true)
                                                }}
                                                className="px-6 py-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-200 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                                            >
                                                <FolderPlus className="w-6 h-6 mb-1 opacity-70" /> LƯU DỰ ÁN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowLoginModal(true)}
                                                className="px-6 py-4 bg-indigo-50/50 hover:bg-white border border-indigo-100 hover:border-indigo-400 rounded-3xl text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                                            >
                                                <Sparkles className="w-6 h-6 mb-1" /> MỞ KHÓA DỰ ÁN
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAddAllToCart}
                                            disabled={addingToCart || !result.materials.some(m => m.productId)}
                                            className="px-6 py-4 bg-emerald-50/50 hover:bg-white border border-emerald-100 hover:border-emerald-400 rounded-3xl text-[10px] font-black uppercase tracking-widest text-emerald-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm disabled:opacity-30"
                                        >
                                            <ShoppingCart className="w-6 h-6 mb-1" /> GIỎ HÀNG
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Decoration */}
                            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent"></div>
                        </div>
                    </div>
                )}

                {/* Page Header (Hides when results are prominent if desired, but here we keep it) */}
                {!result && (
                    <div className="mb-12 flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                            <Calculator className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 leading-none mb-2 tracking-tighter uppercase">AI Material Estimator</h1>
                            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">Bóc tách khối lượng tự động bằng trí tuệ nhân tạo</p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    {/* Input Panel (Collapsible/Hidden when used) */}
                    <div className={`lg:col-span-12 xl:col-span-5 space-y-6 ${!showInputPanel && result ? 'hidden lg:block lg:opacity-50 lg:hover:opacity-100 transition-opacity' : ''}`}>
                        {/* Toggle to show/hide input panel if result exists */}
                        {result && (
                            <button
                                onClick={() => setShowInputPanel(!showInputPanel)}
                                className="w-full flex items-center justify-between px-8 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                            >
                                {showInputPanel ? 'Ẩn bảng nhập liệu' : 'Hiện bảng nhập liệu để tính lại'}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showInputPanel ? 'rotate-180' : ''}`} />
                            </button>
                        )}

                        {showInputPanel && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {/* Project Type Selection */}
                                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-8">
                                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Bước 1: Chọn quy mô công việc</h2>
                                    <div className="grid grid-cols-4 gap-3">
                                        {PROJECT_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setProjectType(type.id)}
                                                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2.5 ${projectType === type.id
                                                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100/50'
                                                    : 'border-slate-50 hover:border-indigo-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center shadow-md`}>
                                                    <type.icon className="w-5 h-5 text-white" />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${projectType === type.id ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                    {type.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Input Mode Toggle */}
                                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-8">
                                    <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                        <button
                                            onClick={() => setInputMode('text')}
                                            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${inputMode === 'text'
                                                ? 'bg-white text-indigo-600 shadow-xl'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <Ruler className="w-4 h-4" />
                                            MÔ TẢ DỰ ÁN
                                        </button>
                                        <button
                                            onClick={() => setInputMode('image')}
                                            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${inputMode === 'image'
                                                ? 'bg-white text-indigo-600 shadow-xl'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            TẢI BẢN VẼ
                                        </button>
                                    </div>

                                    {inputMode === 'text' ? (
                                        <div className="animate-in fade-in duration-500">
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Mô tả dự án của bạn (VD: Lát sân vườn 6x8m, xây tường rào dài 20m cao 2.5m...)"
                                                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none leading-relaxed font-medium"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest flex items-center gap-2">
                                                <Sparkles className="w-3 h-3 text-indigo-400" /> 💡 Mẹo: Mô tả chi tiết diện tích để AI tính chính xác hơn.
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
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="aspect-square border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-all font-black text-slate-300"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full h-48 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group overflow-hidden relative"
                                                >
                                                    <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg border border-indigo-100 group-hover:border-indigo-600">
                                                        <Upload className="w-7 h-7" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Bấm để tải bản vẽ lên</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-1">Hệ thống nhận diện mặt bằng & ảnh chụp</p>
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
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                ĐANG PHÂN TÍCH...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Calculator className="w-4 h-4" />
                                                PHÂN TÍCH VẬT LIỆU AI
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Secondary Results / Details Panel */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                        {loading && (
                            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 p-12 text-center h-[500px] flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
                                {/* Cinematic Background Scan Effect */}
                                <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
                                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent absolute top-0 animate-[scan_3s_ease-in-out_infinite]"></div>
                                    <div className="w-full h-[1px] bg-slate-200 absolute top-1/4"></div>
                                    <div className="w-full h-[1px] bg-slate-200 absolute top-1/2"></div>
                                    <div className="w-full h-[1px] bg-slate-200 absolute top-3/4"></div>
                                    <div className="h-full w-[1px] bg-slate-200 absolute left-1/4"></div>
                                    <div className="h-full w-[1px] bg-slate-200 absolute left-1/2"></div>
                                    <div className="h-full w-[1px] bg-slate-200 absolute left-3/4"></div>
                                </div>

                                <div className="relative z-10 w-full space-y-12">
                                    {/* Phase Text */}
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase animate-pulse">
                                            {LOADING_PHASES[loadingPhase]}
                                        </h3>
                                        <div className="w-48 h-1 bg-slate-100 mx-auto rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Expert Tip Section */}
                                    <div className="max-w-md mx-auto space-y-3">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] opacity-60">Có thể bạn chưa biết</p>
                                        <div className="h-20 flex items-center justify-center">
                                            <p
                                                key={loadingTip}
                                                className="text-slate-500 text-sm font-medium italic leading-relaxed animate-in slide-in-from-bottom-2 duration-1000"
                                            >
                                                "{LOADING_TIPS[loadingTip]}"
                                            </p>
                                        </div>
                                    </div>

                                    <style jsx>{`
                                        @keyframes scan {
                                            0% { top: -10%; }
                                            100% { top: 110%; }
                                        }
                                    `}</style>
                                </div>
                            </div>
                        )}

                        {!loading && isReviewing && (
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
                                                    <div className="text-[8px] bg-black/50 text-white text-center py-0.5 mt-[-16px] relative z-10 font-bold uppercase">Bản vẽ gốc</div>
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
                                        className="flex-grow bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                Xác nhận & Tính toán vật liệu
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {result ? (
                            <div className="animate-in slide-in-from-right-4 duration-500 space-y-4">
                                {/* Details Overview Card */}
                                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-8 bg-indigo-600 rounded-full"></div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-tight">Cơ sở bốc tách</h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm group">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform">Diện tích sàn xây dựng</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-indigo-950">{(result.totalArea || 0).toFixed(1)}</span>
                                                <span className="text-sm font-black text-indigo-400 uppercase">m² sàn</span>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-sm group">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform">Ngân sách dự kiến</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-emerald-950">
                                                    {result.totalEstimatedCost > 0
                                                        ? formatCurrency(result.totalEstimatedCost).replace(/₫/g, '')
                                                        : '...'}
                                                </span>
                                                <span className="text-sm font-black text-emerald-400 uppercase">VND</span>
                                            </div>
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
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-50 p-12 text-center h-full flex flex-col items-center justify-center border-dashed">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calculator className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">Chờ phân tích</h3>
                                <p className="text-slate-400 text-xs font-medium max-w-[200px] leading-relaxed italic">
                                    Quý khách vui lòng chọn loại hình & tải thông tin ở bảng bên trái.
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
