'use client'

/**
 * AI Material Estimator Page
 * Refactored to use modular components and shared estimator logic.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2, ChevronDown, CheckCircle, FolderPlus, Sparkles, ShoppingCart, ArrowRight, Plus
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useAuth } from '@/contexts/auth-context'
import { useCartStore } from '@/stores/cartStore'
import { fetchWithAuth } from '@/lib/api-client'
import { analyzeFloorPlanImage, estimateFromText, recalculateEstimate } from '@/lib/estimator/vision-estimator'

import LoginIncentiveModal from '@/components/LoginIncentiveModal'
import SiteHeader from '@/components/Header'
import FormattedNumberInput from '@/components/FormattedNumberInput'

// Shared types and constants
import {
    RoomDimension, EstimatorResult, PROJECT_TYPES,
    LOADING_PHASES, LOADING_TIPS, formatCurrency
} from './types'

// Modular components
import EstimatorHeader from './components/EstimatorHeader'
import InputPanel from './components/InputPanel'
import LoadingSection from './components/LoadingSection'
import ReviewSection from './components/ReviewSection'
import ResultDisplay from './components/ResultDisplay'
import DetailedEstimateModal from './components/DetailedEstimateModal'
import LeadCaptureSection from './components/LeadCaptureSection'

export default function EstimatorPage() {
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

    // Review Temp State (Draft measurements)
    const [reviewArea, setReviewArea] = useState(100)
    const [reviewStyle, setReviewStyle] = useState<'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự'>('nhà_phố')
    const [reviewRoofType, setReviewRoofType] = useState('bê_tông')
    const [reviewRooms, setReviewRooms] = useState<RoomDimension[]>([])

    // Modals
    const [showDetailedModal, setShowDetailedModal] = useState(false)
    const [showProjectModal, setShowProjectModal] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)

    // Lead Capture
    const [leadName, setLeadName] = useState('')
    const [leadPhone, setLeadPhone] = useState('')
    const [leadEmail, setLeadEmail] = useState('')
    const [submittingLead, setSubmittingLead] = useState(false)

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

    useEffect(() => {
        if (user) {
            setLeadName(user.name || '')
            setLeadEmail(user.email || '')
        }
    }, [user])

    // --- Handlers ---
    const handleLeadSubmit = async () => {
        if (!leadName || !leadPhone) {
            toast.error('Vui lòng nhập tên và số điện thoại')
            return
        }
        setSubmittingLead(true)
        try {
            const res = await fetchWithAuth('/api/leads', {
                method: 'POST',
                body: JSON.stringify({
                    name: leadName,
                    phone: leadPhone,
                    email: leadEmail,
                    source: 'ESTIMATOR',
                    notes: `Dự án: ${projectType} | Diện tích: ${result?.totalArea}m2 | Ngân sách: ${result?.totalEstimatedCost}`,
                })
            })
            if (res.ok) {
                toast.success('Đã gửi yêu cầu tư vấn thành công!')
                setLeadPhone('')
            } else {
                toast.error('Không thể gửi yêu cầu, vui lòng thử lại sau.')
            }
        } catch {
            toast.error('Có lỗi xảy ra khi kết nối máy chủ.')
        } finally {
            setSubmittingLead(false)
        }
    }

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
                reviewArea * 1.5, // Default wall perimeter approximation
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
                    id: m.productId, // Still provide id just in case
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
                router.push(`/contractor/projects/${data.data.id}`)
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
        <div className="min-h-screen bg-[#FDFDFD]">
            {/* --- Modals --- */}
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
                                    placeholder="VD: Nhà anh Nam - Quận 2"
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

            <LoginIncentiveModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                title="Mở khóa tính năng lưu dự án & Giảm giá 5%"
                description="Đăng nhập để lưu lại kết quả phân tích AI này và nhận được mức giá ưu đãi dành riêng cho thành viên SmartBuild."
            />

            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 py-8">
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
                        onShowLoginModal={() => setShowLoginModal(true)}
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

                {result && !isReviewing && (
                    <div className="mt-12">
                        <LeadCaptureSection
                            leadName={leadName}
                            setLeadName={setLeadName}
                            leadPhone={leadPhone}
                            setLeadPhone={setLeadPhone}
                            leadEmail={leadEmail}
                            setLeadEmail={setLeadEmail}
                            onSubmit={handleLeadSubmit}
                            submitting={submittingLead}
                        />
                    </div>
                )}
            </main>
        </div>
    )
}
