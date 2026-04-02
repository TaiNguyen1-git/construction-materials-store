'use client'

/**
 * Contractor AI Estimator Page
 * Reuses the core estimator logic but lives within the contractor dashboard.
 * No public header, no login incentive - contractor is already authenticated.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2, ChevronDown, CheckCircle, FolderPlus, Sparkles, ShoppingCart, ArrowRight, Plus, Activity
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useAuth } from '@/contexts/auth-context'
import { useCartStore } from '@/stores/cartStore'
import { fetchWithAuth } from '@/lib/api-client'
import { analyzeFloorPlanImage, estimateFromText, recalculateEstimate } from '@/lib/estimator/vision-estimator'

// Shared types and constants from the public estimator
import {
    RoomDimension, EstimatorResult, PROJECT_TYPES,
    LOADING_PHASES, LOADING_TIPS, formatCurrency
} from '@/app/estimator/types'

// Reuse modular components
import InputPanel from '@/app/estimator/components/InputPanel'
import LoadingSection from '@/app/estimator/components/LoadingSection'
import ReviewSection from '@/app/estimator/components/ReviewSection'
import ResultDisplay from '@/app/estimator/components/ResultDisplay'
import DetailedEstimateModal from '@/app/estimator/components/DetailedEstimateModal'

export default function ContractorEstimatorPage() {
    const { user, isAuthenticated } = useAuth()
    const { addItem } = useCartStore()
    const router = useRouter()

    // --- State ---
    const [projectType, setProjectType] = useState<'general' | 'flooring' | 'painting' | 'tiling'>('general')
    const [inputMode, setInputMode] = useState<'text' | 'image'>('text')
    const [description, setDescription] = useState('')
    const [imagesPreview, setImagesPreview] = useState<string[]>([])
    const [imagesBase64, setImagesBase64] = useState<string[]>([])

    const [birthYear, setBirthYear] = useState('')
    const [houseDirection, setHouseDirection] = useState('')

    const [loading, setLoading] = useState(false)
    const [loadingPhase, setLoadingPhase] = useState(0)
    const [loadingTip, setLoadingTip] = useState(0)

    // Result & Review State
    const [result, setResult] = useState<EstimatorResult | null>(null)
    const [isReviewing, setIsReviewing] = useState(false)
    const [showInputPanel, setShowInputPanel] = useState(true)

    // Review Temp State
    const [reviewArea, setReviewArea] = useState(100)
    const [reviewStyle, setReviewStyle] = useState<'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự'>('nhà_phố')
    const [reviewRoofType, setReviewRoofType] = useState('bê_tông')
    const [reviewRooms, setReviewRooms] = useState<RoomDimension[]>([])

    // Modals
    const [showDetailedModal, setShowDetailedModal] = useState(false)
    const [showProjectModal, setShowProjectModal] = useState(false)

    // Actions
    const [addingToCart, setAddingToCart] = useState(false)
    const [creatingProject, setCreatingProject] = useState(false)
    const [projectName, setProjectName] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- Effects ---
    useEffect(() => {
        if (loading) {
            const phaseInterval = setInterval(() => {
                setLoadingPhase(prev => (prev + 1) % LOADING_PHASES.length)
            }, 3000)
            const tipInterval = setInterval(() => {
                setLoadingTip(prev => (prev + 1) % LOADING_TIPS.length)
            }, 4500)
            return () => {
                clearInterval(phaseInterval)
                clearInterval(tipInterval)
            }
        }
    }, [loading])

    // --- Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        Array.from(files).forEach(file => {
            const reader = new FileReader()
            reader.onload = (event) => {
                const base64 = event.target?.result as string
                setImagesPreview(prev => [...prev, base64])
                setImagesBase64(prev => [...prev, base64.split(',')[1]])
            }
            reader.readAsDataURL(file)
        })
    }

    const handleEstimate = async () => {
        if (inputMode === 'text' && !description) {
            toast.error('Vui lòng mô tả dự án của bạn')
            return
        }
        if (inputMode === 'image' && imagesBase64.length === 0) {
            toast.error('Vui lòng tải ít nhất một ảnh bản vẽ')
            return
        }

        setLoading(true)
        setLoadingPhase(0)
        setResult(null)
        setIsReviewing(false)

        try {
            let res: EstimatorResult
            if (inputMode === 'image') {
                res = await analyzeFloorPlanImage(imagesBase64, projectType, birthYear, houseDirection)
            } else {
                res = await estimateFromText(description, projectType, birthYear, houseDirection)
            }

            if (res.success) {
                setResult(res)
                setReviewArea(res.totalArea)
                setReviewRooms(res.rooms)
                setReviewStyle(res.buildingStyle || 'nhà_phố')
                setReviewRoofType(res.roofType || 'bê_tông')
                setIsReviewing(true)
                setShowInputPanel(false)
            } else {
                toast.error(res.error || 'Có lỗi xảy ra khi phân tích')
            }
        } catch (error) {
            console.error(error)
            toast.error('Lỗi hệ thống AI, vui lòng thử lại sau')
        } finally {
            setLoading(false)
        }
    }

    const handleFinalRecalculate = async () => {
        if (!result) return
        setLoading(true)
        try {
            const res = await recalculateEstimate(
                reviewArea,
                result.projectType,
                reviewRooms,
                reviewStyle,
                reviewArea * 1.5,
                reviewRoofType,
                result.fengShuiAdvice
            )
            if (res.success) {
                setResult(res)
                setIsReviewing(false)
                toast.success('Đã cập nhật dự toán chi tiết!')
            }
        } catch {
            toast.error('Không thể tính toán lại, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    const handleAddAllToCart = async () => {
        if (!result) return
        setAddingToCart(true)
        let addedCount = 0
        for (const m of result.materials) {
            if (m.productId) {
                addItem({
                    productId: m.productId,
                    id: m.productId,
                    name: m.productName,
                    price: m.price || 0,
                    image: '',
                    quantity: m.quantity,
                    unit: m.unit,
                    sku: m.sku || 'N/A'
                })
                addedCount++
            }
        }
        setAddingToCart(false)
        toast.success(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`)
    }

    const handleCreateProject = async () => {
        if (!result || !projectName.trim()) return
        setCreatingProject(true)
        try {
            const res = await fetchWithAuth('/api/projects', {
                method: 'POST',
                body: JSON.stringify({
                    name: projectName,
                    type: projectType,
                    description: `Dự toán AI cho ${result.totalArea}m2.`,
                    metadata: result,
                    totalEstimatedBudget: result.totalEstimatedCost
                })
            })
            if (res.ok) {
                const data = await res.json()
                toast.success('Đã lưu dự án thành công!')
                setShowProjectModal(false)
                router.push(`/contractor/projects/${data.data?.id || data.id}`)
            } else {
                toast.error('Không thể lưu dự án')
            }
        } catch {
            toast.error('Lỗi khi lưu dự án')
        } finally {
            setCreatingProject(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Sparkles className="w-10 h-10 text-indigo-600" />
                        AI Estimator
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Hệ thống bóc tách vật tư & dự toán chi phí AI</p>
                </div>
            </div>

            {/* Project Save Modal */}
            {showProjectModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 w-full max-w-md animate-in zoom-in duration-300 border border-white/20">
                        <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter italic flex items-center gap-4">
                            <FolderPlus className="text-indigo-600 w-8 h-8" /> 
                            Save Project
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tên dự án</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="VD: Công trình Quận 2 - Anh Nam"
                                    className="w-full px-8 py-5 bg-slate-50 rounded-[1.8rem] font-black text-slate-900 outline-none border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-sm"
                                />
                            </div>

                            {result && (
                                <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100/50 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diện tích</span>
                                        <span className="text-sm font-black text-slate-800">{(result.totalArea || 0).toFixed(1)} m²</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dự toán</span>
                                        <span className="text-sm font-black text-indigo-600 italic underline decoration-2">{formatCurrency(result.totalEstimatedCost)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowProjectModal(false)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={creatingProject || !projectName.trim()}
                                    className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {creatingProject ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={18} />}
                                    Lưu Dự Án
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDetailedModal && result && (
                <DetailedEstimateModal
                    result={result}
                    onClose={() => setShowDetailedModal(false)}
                    onAddToCart={handleAddAllToCart}
                />
            )}

            <div className="space-y-10">
                {result && !isReviewing && (
                    <ResultDisplay
                        result={result}
                        projectType={projectType}
                        isAuthenticated={isAuthenticated}
                        addingToCart={addingToCart}
                        onShowDetailedModal={() => setShowDetailedModal(true)}
                        onShowProjectModal={() => {
                            setProjectName(`Dự án ${PROJECT_TYPES.find(t => t.id === projectType)?.name} - ${new Date().toLocaleDateString('vi-VN')}`)
                            setShowProjectModal(true)
                        }}
                        onShowLoginModal={() => {
                            setProjectName(`Dự án ${PROJECT_TYPES.find(t => t.id === projectType)?.name} - ${new Date().toLocaleDateString('vi-VN')}`)
                            setShowProjectModal(true)
                        }}
                        onAddAllToCart={handleAddAllToCart}
                    />
                )}

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    <div className={`lg:col-span-12 xl:col-span-5 space-y-8 ${!showInputPanel && result ? 'hidden lg:block lg:opacity-50 lg:hover:opacity-100 transition-all' : ''}`}>
                        {result && (
                            <button
                                onClick={() => setShowInputPanel(!showInputPanel)}
                                className="w-full flex items-center justify-between px-10 py-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-100 transition-all group"
                            >
                                {showInputPanel ? 'Ẩn bảng nhập liệu' : 'Kích hoạt lại bảng nhập liệu'}
                                <ChevronDown className={`w-5 h-5 transition-transform group-hover:translate-y-0.5 ${showInputPanel ? 'rotate-180' : ''}`} />
                            </button>
                        )}

                        {showInputPanel && (
                            <div className="bg-white rounded-[3.5rem] p-4 shadow-sm border border-slate-100">
                                <InputPanel
                                    projectType={projectType}
                                    setProjectType={setProjectType}
                                    inputMode={inputMode}
                                    setInputMode={setInputMode}
                                    description={description}
                                    setDescription={setDescription}
                                    imagesPreview={imagesPreview}
                                    onImageUpload={handleImageUpload}
                                    onRemoveImage={(idx) => {
                                        setImagesPreview(prev => prev.filter((_, i) => i !== idx))
                                        setImagesBase64(prev => prev.filter((_, i) => i !== idx))
                                    }}
                                    birthYear={birthYear}
                                    setBirthYear={setBirthYear}
                                    houseDirection={houseDirection}
                                    setHouseDirection={setHouseDirection}
                                    onEstimate={handleEstimate}
                                    loading={loading}
                                    fileInputRef={fileInputRef}
                                />
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-12 xl:col-span-7 space-y-10">
                        {loading && (
                            <div className="bg-white rounded-[3.5rem] p-2 overflow-hidden border border-slate-100 shadow-sm">
                                <LoadingSection loadingPhase={loadingPhase} loadingTip={loadingTip} />
                            </div>
                        )}

                        {!loading && isReviewing && (
                            <div className="animate-in slide-in-from-right-10 duration-500">
                                <ReviewSection
                                    imagesPreview={imagesPreview}
                                    reviewStyle={reviewStyle}
                                    setReviewStyle={setReviewStyle}
                                    reviewRoofType={reviewRoofType}
                                    setReviewRoofType={setReviewRoofType}
                                    reviewArea={reviewArea}
                                    setReviewArea={setReviewArea}
                                    reviewRooms={reviewRooms}
                                    setReviewRooms={setReviewRooms}
                                    onRecalculate={handleFinalRecalculate}
                                    onBack={() => setIsReviewing(false)}
                                    loading={loading}
                                />
                            </div>
                        )}

                        {!loading && !isReviewing && !result && (
                            <div className="bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-center space-y-8 group">
                                <div className="w-40 h-40 bg-white rounded-[3rem] shadow-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                    <Sparkles size={64} className="animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Ready for AI Analysis</h2>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-sm">Nhập mô tả hoặc tải lên bản vẽ để AI bắt đầu quá trình bóc tách vật tư tự động</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
