'use client'

/**
 * Contractor AI Estimator Page
 * Reuses the core estimator logic but lives within the contractor dashboard.
 * No public header, no login incentive - contractor is already authenticated.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2, ChevronDown, CheckCircle, FolderPlus, Sparkles, ShoppingCart, ArrowRight, Plus
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'

import { useAuth } from '@/contexts/auth-context'
import { useCartStore } from '@/stores/cartStore'
import { fetchWithAuth } from '@/lib/api-client'
import { analyzeFloorPlanImage, estimateFromText, recalculateEstimate } from '@/lib/estimator/vision-estimator'

import FormattedNumberInput from '@/components/FormattedNumberInput'

// Shared types and constants from the public estimator
import {
    RoomDimension, EstimatorResult, PROJECT_TYPES,
    LOADING_PHASES, LOADING_TIPS, formatCurrency
} from '@/app/estimator/types'

// Reuse modular components
import EstimatorHeader from '@/app/estimator/components/EstimatorHeader'
import InputPanel from '@/app/estimator/components/InputPanel'
import LoadingSection from '@/app/estimator/components/LoadingSection'
import ReviewSection from '@/app/estimator/components/ReviewSection'
import ResultDisplay from '@/app/estimator/components/ResultDisplay'
import DetailedEstimateModal from '@/app/estimator/components/DetailedEstimateModal'
import LeadCaptureSection from '@/app/estimator/components/LeadCaptureSection'

export default function ContractorEstimatorPage() {
    const { user, isAuthenticated } = useAuth()
    const { addItem } = useCartStore()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)

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
                // Contractor always goes to their own project dashboard
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Project Save Modal */}
            {showProjectModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <FolderPlus className="text-indigo-600" /> Lưu Thành Dự Án
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Tên dự án</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="VD: Công trình Quận 2 - Anh Nam"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                />
                            </div>

                            {result && (
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-2">
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
                                        <> <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo... </>
                                    ) : (
                                        <> <CheckCircle className="w-4 h-4" /> Tạo Dự Án </>
                                    )}
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

            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Bóc Tách AI</h1>
                            <p className="text-xs text-gray-500 font-medium">Ước lượng vật tư thông minh bằng trí tuệ nhân tạo</p>
                        </div>
                    </div>

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
                                // Contractor is always authenticated - just open project modal directly
                                setProjectName(`Dự án ${PROJECT_TYPES.find(t => t.id === projectType)?.name} - ${new Date().toLocaleDateString('vi-VN')}`)
                                setShowProjectModal(true)
                            }}
                            onAddAllToCart={handleAddAllToCart}
                        />
                    )}

                    {!result && <EstimatorHeader />}

                    <div className="grid lg:grid-cols-12 gap-10 items-start">
                        <div className={`lg:col-span-12 xl:col-span-5 space-y-6 ${!showInputPanel && result ? 'hidden lg:block lg:opacity-50 lg:hover:opacity-100 transition-opacity' : ''}`}>
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
                            )}
                        </div>

                        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                            {loading && <LoadingSection loadingPhase={loadingPhase} loadingTip={loadingTip} />}

                            {!loading && isReviewing && (
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
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
