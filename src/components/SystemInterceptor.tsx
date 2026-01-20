
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Lock, Wrench, Star, Loader2, X, ChevronRight, Bell, Info } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { getTargetLabel, getTargetPath, MAINTENANCE_TARGETS } from '@/lib/maintenance-targets'

export default function SystemInterceptor() {
    const [interceptor, setInterceptor] = useState<any>(null)
    // For showing summary of all affected items on landing page
    const [affectedSummary, setAffectedSummary] = useState<any[]>([])
    const [visible, setVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rating, setRating] = useState(5)
    const [dismissed, setDismissed] = useState(false)

    const router = useRouter()
    const pathname = usePathname()

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/interceptor/check')
            if (!res.ok) return

            const json = await res.json()

            // Handle Global Blocker (MAINTENANCE, DEBT_LOCK, etc.)
            if (json.data?.type && !json.data?.isSummary) {
                const data = json.data

                // Path/Feature Matching
                if (data.data?.targetPath) {
                    const targetKey = data.data.targetPath
                    const targetConfig = (MAINTENANCE_TARGETS as any)[targetKey]

                    if (targetConfig) {
                        const actualPath = targetConfig.path

                        // If it's a feature (starts with 'feature:'), don't auto-block pages
                        // Features are blocked when user clicks on them (handled separately)
                        if (actualPath.startsWith('feature:')) {
                            // Don't show modal for feature on page load, just save for summary
                            if (pathname === '/' || pathname === '') {
                                // Show in summary on landing page
                                setAffectedSummary(prev => [...prev, data.data])
                            }
                            return
                        }

                        // For page paths, check if current URL matches
                        if (!pathname.startsWith(actualPath)) {
                            // If on landing page, add to summary instead of blocking
                            if (pathname === '/' || pathname === '') {
                                setAffectedSummary(prev => [...prev, data.data])
                            }
                            return
                        }
                    }
                }

                setInterceptor(data)
                setVisible(true)
                return
            }

            // Handle Summary Mode (list of affected items on landing page)
            if (json.data?.isSummary && json.data?.items?.length > 0) {
                setAffectedSummary(json.data.items)
            }

        } catch (e) {
            // Silent fail
        }
    }

    useEffect(() => {
        if (!dismissed) {
            checkStatus()
            // On landing page, also fetch summary of all affected items
            if (pathname === '/' || pathname === '') {
                fetchSummary()
            }
        }
    }, [pathname, dismissed])

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/interceptor/check?summary=true')
            if (!res.ok) return
            const json = await res.json()
            if (json.data?.isSummary && json.data?.items?.length > 0) {
                setAffectedSummary(json.data.items)
            }
        } catch (e) { /* silent */ }
    }

    const handleAction = async (action: string, specificData: any = {}) => {
        if (action === 'NAVIGATE' && specificData.url) {
            router.push(specificData.url)
            setVisible(false)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/interceptor/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    announcementId: interceptor?.data?.id,
                    action: action,
                    data: {
                        ...specificData,
                        rating: action === 'FEEDBACK_SUBMIT' ? rating : undefined
                    }
                })
            })

            if (res.ok) {
                setVisible(false)
                setDismissed(true)
                if (action === 'FEEDBACK_SUBMIT') toast.success('Cảm ơn bạn đã đánh giá!')
            }
        } catch (e) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const dismissSummary = () => {
        setAffectedSummary([])
        setDismissed(true)
    }

    // ========== RENDER SUMMARY BANNER (Landing Page Early Notification) ==========
    if (affectedSummary.length > 0 && (pathname === '/' || pathname === '') && !visible) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[10000] animate-in slide-in-from-top duration-500">
                <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-black text-sm block">
                                        📢 Thông báo: Một số tính năng đang được bảo trì
                                    </span>
                                    <span className="text-xs font-medium opacity-90">
                                        {affectedSummary.map(item => getTargetLabel(item.targetPath)).join(' • ')}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={dismissSummary}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!visible || !interceptor) return null

    // ========== RENDER BANNER MODE ==========
    if (interceptor.data?.displayMode === 'BANNER') {
        return (
            <div className="fixed top-0 left-0 right-0 z-[10000] animate-in slide-in-from-top duration-500">
                <div className={`
                    w-full px-4 py-3 flex items-center justify-between text-white shadow-xl
                    ${interceptor.type === 'MAINTENANCE' ? 'bg-amber-600' :
                        interceptor.type === 'FEATURE' ? 'bg-indigo-600' : 'bg-gray-900'}
                `}>
                    <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
                        <div className="bg-white/20 p-2 rounded-lg shrink-0">
                            {interceptor.type === 'MAINTENANCE' ? <Wrench className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-grow">
                            <span className="font-bold text-sm mr-2">{interceptor.data.title}:</span>
                            <span className="text-xs md:text-sm font-medium opacity-90">{interceptor.data.content}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {interceptor.data.actionLabel && (
                                <button
                                    onClick={() => handleAction('NAVIGATE', { url: interceptor.data.actionUrl })}
                                    className="bg-white text-black text-xs font-black px-4 py-1.5 rounded-full hover:bg-gray-100 shrink-0"
                                >
                                    {interceptor.data.actionLabel}
                                </button>
                            )}
                            <button onClick={() => { setVisible(false); setDismissed(true); }} className="hover:bg-white/10 p-1 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ========== RENDER MODAL MODE ==========
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Toaster position="top-center" />
            <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-300 relative">

                {/* Image Header */}
                {interceptor.data?.imageUrl && (
                    <div className="w-full h-48 relative overflow-hidden">
                        <img src={interceptor.data.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    </div>
                )}

                {/* MAINTENANCE */}
                {interceptor.type === 'MAINTENANCE' && (
                    <div className="text-center p-8 pt-6">
                        {!interceptor.data?.imageUrl && (
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Wrench className="w-10 h-10 text-yellow-600" />
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-gray-900 mb-2">{interceptor.data.title}</h2>
                        <p className="text-gray-500 mb-6 font-medium">{interceptor.data.content}</p>
                        {interceptor.data.targetPath && (
                            <div className="bg-orange-50 text-orange-700 rounded-2xl p-3 mb-4 text-sm font-bold flex items-center justify-center gap-2">
                                <Info className="w-4 h-4" />
                                Ảnh hưởng: {getTargetLabel(interceptor.data.targetPath)}
                            </div>
                        )}
                        <div className="bg-gray-100 rounded-3xl p-5 text-sm font-bold text-gray-500">
                            Dự kiến: {interceptor.data.endTime ? new Date(interceptor.data.endTime).toLocaleString('vi-VN') : 'Sớm nhất có thể'}
                        </div>
                    </div>
                )}

                {/* DEBT LOCK */}
                {interceptor.type === 'DEBT_LOCK' && (
                    <div className="text-center p-8">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-red-600 mb-2 uppercase">Vui lòng thanh toán nợ</h2>
                        <p className="text-gray-600 font-bold mb-6 text-sm">{interceptor.data.message}</p>
                        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-8">
                            <p className="text-4xl font-black text-gray-900">
                                {interceptor.data.amount?.toLocaleString('vi-VN')}₫
                            </p>
                        </div>
                        <button
                            onClick={() => window.open('/contractor/billing', '_blank')}
                            className="w-full py-5 bg-red-600 text-white font-black rounded-3xl shadow-2xl shadow-red-200"
                        >
                            THANH TOÁN NGAY
                        </button>
                    </div>
                )}

                {/* POLICY / FEATURE / INFO */}
                {(interceptor.type === 'POLICY' || interceptor.type === 'FEATURE' || interceptor.type === 'INFO') && (
                    <div className={`p-8 ${interceptor.data?.imageUrl ? 'pt-0' : 'pt-8'} text-center`}>
                        {!interceptor.data?.imageUrl && (
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${interceptor.type === 'POLICY' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                {interceptor.type === 'POLICY' ? <Lock className="w-8 h-8" /> : <Star className="w-8 h-8 fill-indigo-600" />}
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tighter">
                            {interceptor.data.title}
                        </h2>
                        <div className="max-h-48 overflow-y-auto text-center bg-gray-50/50 p-6 rounded-3xl text-sm text-gray-600 mb-8 font-medium">
                            {interceptor.data.content}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                disabled={loading}
                                onClick={() => {
                                    if (interceptor.data.actionUrl) {
                                        handleAction('NAVIGATE', { url: interceptor.data.actionUrl })
                                    } else {
                                        handleAction(interceptor.type === 'POLICY' ? 'ACCEPTED' : 'SEEN')
                                    }
                                }}
                                className={`w-full py-5 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-2 ${interceptor.type === 'POLICY' ? 'bg-blue-600' : 'bg-indigo-600'
                                    }`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (interceptor.data.actionLabel || 'ĐÃ HIỂU')}
                                {!loading && <ChevronRight className="w-4 h-4" />}
                            </button>

                            {interceptor.type !== 'POLICY' && interceptor.type !== 'MAINTENANCE' && (
                                <button
                                    onClick={() => handleAction('DISMISSED')}
                                    className="w-full py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Bỏ qua
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* FEEDBACK */}
                {interceptor.type === 'FEEDBACK' && (
                    <div className="text-center p-8">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star className="w-10 h-10 text-yellow-600 fill-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">QUÝ KHÁCH HÀI LÒNG?</h2>
                        <p className="text-gray-500 mb-8 font-medium">{interceptor.data.message}</p>

                        <div className="flex gap-4 justify-center mb-10">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-75">
                                    <Star className={`w-11 h-11 transition-all ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={loading}
                            onClick={() => handleAction('FEEDBACK_SUBMIT', { orderId: interceptor.data.orderId })}
                            className="w-full py-5 bg-black text-white font-black rounded-3xl shadow-2xl flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />} GỬI ĐÁNH GIÁ
                        </button>
                        <button onClick={() => setVisible(false)} className="w-full mt-3 py-2 text-gray-400 text-[10px] font-black uppercase">
                            ĐỂ LÚC KHÁC
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
