
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Lock, Wrench, Star, Loader2, X, ChevronRight, Bell, Info } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { getTargetLabel, getTargetPath, MAINTENANCE_TARGETS } from '@/lib/maintenance-targets'


interface InterceptorData {
    type: 'MAINTENANCE' | 'FEATURE' | 'POLICY' | 'DEBT_LOCK' | 'FEEDBACK' | 'INFO';
    data: {
        id?: string;
        title: string;
        content: string;
        imageUrl?: string;
        actionLabel?: string;
        actionUrl?: string;
        endTime?: string;
        targetPath?: string;
        message?: string;
        amount?: number;
        orderId?: string;
        displayMode?: 'BANNER' | 'MODAL';
    };
}

export default function SystemInterceptor() {
    const [interceptor, setInterceptor] = useState<InterceptorData | null>(null)
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

            if (json.data?.type) {
                const data = json.data as InterceptorData

                // Path/Feature Matching
                if (data.data?.targetPath) {
                    const targetKey = data.data.targetPath
                    const targetConfig = MAINTENANCE_TARGETS[targetKey]

                    if (targetConfig) {
                        const actualPath = targetConfig.path

                        // If it's a feature (starts with 'feature:'), don't auto-block pages
                        // Features are blocked when user clicks on them (handled separately)
                        if (actualPath.startsWith('feature:')) {
                            return
                        }

                        if (!pathname.startsWith(actualPath)) {
                            return
                        }
                    }
                }

                // Prevent Debt Lock from blocking the Payment Page
                if (data.type === 'DEBT_LOCK' && pathname.startsWith('/contractor/debt')) {
                    return
                }

                setInterceptor(data)
                setVisible(true)
                return
            }


        } catch (e) {
            // Silent fail
        }
    }

    useEffect(() => {
        if (!dismissed) {
            checkStatus()
        }
    }, [pathname, dismissed])


    const handleAction = async (action: string, specificData: Record<string, unknown> = {}) => {
        // Immediate UI feedback
        if (action === 'DISMISSED' || action === 'SEEN' || action === 'NAVIGATE') {
            setVisible(false)
            setDismissed(true)
        }

        if (action === 'NAVIGATE' && specificData.url) {
            router.push(specificData.url as string)
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

            // If action was already handled UI-wise, just finish loading
            if (action === 'FEEDBACK_SUBMIT' && res.ok) {
                setVisible(false)
                setDismissed(true)
                toast.success('Cảm ơn bạn đã đánh giá!')
            }
        } catch (e) {
            // Silently ignore submission errors for guests/network issues
            if (action === 'FEEDBACK_SUBMIT') toast.error('Lỗi gửi đánh giá')
        } finally {
            setLoading(false)
        }
    }

    const dismissSummary = () => {
        setDismissed(true)
    }


    if (!visible || !interceptor) return null


    // ========== RENDER BANNER MODE ==========
    if (interceptor.data?.displayMode === 'BANNER') {
        const bgGradient =
            interceptor.type === 'MAINTENANCE' ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600' :
                interceptor.type === 'FEATURE' ? 'bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-700' :
                    'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900';

        return (
            <div className="fixed top-0 left-0 right-0 z-[10000] animate-in slide-in-from-top duration-700 ease-in-out">
                {/* Visual Ribbon */}
                <div className={`
                    relative w-full overflow-hidden border-b border-white/10 shadow-lg
                    ${bgGradient}
                `}>
                    {/* Animated Mesh Effect */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute -inset-[100%] animate-[spin_20s_linear_infinite] bg-[conic-gradient(from_0deg,transparent,white,transparent)]" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 h-12 md:h-14 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {/* Image Thumbnail or Icon */}
                            {interceptor.data?.imageUrl ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden border border-white/30 shadow-sm shrink-0">
                                    <img src={interceptor.data.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="bg-white/20 p-1.5 rounded-lg border border-white/20 text-white shrink-0">
                                    {interceptor.type === 'MAINTENANCE' ? <Wrench className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3 overflow-hidden">
                                <span className="font-black text-white tracking-[0.2em] uppercase text-[9px] md:text-[10px] opacity-70">
                                    {interceptor.type === 'MAINTENANCE' ? 'Bảo trì hệ thống' : 'Thông báo hệ thống'}
                                </span>
                                <div className="hidden md:block w-px h-4 bg-white/20" />
                                <span className="text-xs md:text-sm font-medium text-white/95 truncate">
                                    <strong className="text-white mr-1.5 font-bold italic">{interceptor.data.title}:</strong>
                                    {interceptor.data.content}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {interceptor.data.actionLabel && (
                                <button
                                    onClick={() => handleAction('NAVIGATE', { url: interceptor.data.actionUrl })}
                                    className="bg-white text-black text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-all hover:shadow-xl active:scale-95 whitespace-nowrap"
                                >
                                    {interceptor.data.actionLabel}
                                </button>
                            )}
                            <button
                                onClick={() => handleAction('DISMISSED')}
                                className="group hover:bg-white/10 p-2 rounded-full transition-all text-white/70 hover:text-white"
                            >
                                <X className="w-4 h-4 group-hover:rotate-90 duration-300" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ========== RENDER MODAL MODE ==========
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => handleAction('DISMISSED')}
            />

            <Toaster position="top-center" />

            {/* Close Button (Top right of screen) */}
            <button
                onClick={() => handleAction('DISMISSED')}
                className="absolute top-6 right-6 z-[10001] bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all hover:scale-110 active:scale-90"
            >
                <X className="w-8 h-8" />
            </button>

            <div className={`
                bg-white rounded-[24px] shadow-[0_32px_128px_rgba(0,0,0,0.18)] w-full overflow-hidden 
                scale-100 animate-in zoom-in-95 fade-in duration-500 relative z-[10000] border border-gray-100
                ${interceptor.type === 'DEBT_LOCK' || interceptor.type === 'FEEDBACK' ? 'max-w-md' : (interceptor.data?.imageUrl ? 'max-w-5xl' : 'max-w-3xl')}
            `}>


                {/* MAINTENANCE - Premium Pro Style */}
                {interceptor.type === 'MAINTENANCE' && (
                    <div className="text-center px-10 py-12 md:py-16">
                        {!interceptor.data?.imageUrl && (
                            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-amber-100 shadow-xl shadow-amber-100/20 transition-transform hover:rotate-6">
                                <Wrench className="w-8 h-8 text-amber-600" />
                            </div>
                        )}
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-tight italic">
                            {interceptor.data.title}
                        </h2>
                        <p className="text-slate-500 mb-10 text-sm md:text-lg leading-relaxed font-medium max-w-md mx-auto">{interceptor.data.content}</p>

                        {interceptor.data.targetPath && (
                            <div className="bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl p-4 mb-8 text-xs font-bold flex items-center justify-center gap-3">
                                <Info className="w-4 h-4 text-slate-400" />
                                <span>Khu vực ảnh hưởng: <span className="text-slate-900">{getTargetLabel(interceptor.data.targetPath)}</span></span>
                            </div>
                        )}

                        <div className="bg-slate-900 text-white rounded-[28px] p-8 text-center shadow-2xl shadow-slate-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="opacity-50 block text-[10px] uppercase font-black tracking-[0.3em] mb-2 text-indigo-200">Dự kiến hoàn thành</span>
                            <div className="text-xl md:text-2xl font-bold tracking-tight">
                                {interceptor.data.endTime ? new Date(interceptor.data.endTime).toLocaleString('vi-VN') : 'Sớm nhất có thể'}
                            </div>
                        </div>
                    </div>
                )}

                {/* DEBT LOCK - Premium Pro Style */}
                {interceptor.type === 'DEBT_LOCK' && (
                    <div className="text-center px-10 py-12 md:py-16">
                        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-rose-100 shadow-xl shadow-rose-100/20 transition-transform hover:scale-110">
                            <Lock className="w-8 h-8 text-rose-600" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-tight italic">Tạm khóa do nợ phí</h2>
                        <p className="text-slate-500 font-medium mb-12 text-sm md:text-lg leading-relaxed max-w-sm mx-auto">{interceptor.data.message}</p>

                        <div className="bg-rose-50/50 border border-rose-100 rounded-[32px] p-10 mb-12 shadow-inner">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] block mb-3">Số dư nợ hiện tại</span>
                            <p className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                                {interceptor.data.amount?.toLocaleString('vi-VN')}₫
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/contractor/debt')}
                            className="w-full py-5 bg-rose-600 text-white text-sm font-black rounded-[22px] shadow-2xl shadow-rose-200 transition-all hover:bg-rose-700 active:scale-[0.98] uppercase tracking-[0.2em]"
                        >
                            Thanh toán ngay
                        </button>
                    </div>
                )}

                {/* POLICY / FEATURE / INFO - Elite Split Layout (Text First) */}
                {(interceptor.type === 'POLICY' || interceptor.type === 'FEATURE' || interceptor.type === 'INFO') && (
                    <div className="flex flex-col md:flex-row w-full min-h-[500px]">
                        {/* 1. Text Content Side (Left / Top) */}
                        <div className="flex-[1.2] px-8 md:px-16 py-12 md:py-20 flex flex-col justify-center text-left">
                            {!interceptor.data?.imageUrl && (
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-slate-100 ${interceptor.type === 'POLICY' ? 'bg-white text-blue-600' : 'bg-white text-indigo-600'}`}>
                                    {interceptor.type === 'POLICY' ? <Lock className="w-8 h-8" /> : <Star className="w-8 h-8 fill-indigo-600" />}
                                </div>
                            )}

                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 w-fit">
                                <Bell className="w-3 h-3 text-indigo-500" />
                                {interceptor.type === 'POLICY' ? 'Cập nhật hệ thống' : 'Thông báo quan trọng'}
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.05] italic">
                                {interceptor.data.title}
                            </h2>

                            <div className="relative mb-14">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full" />
                                <p className="text-slate-500 text-sm md:text-lg leading-relaxed font-semibold pl-6 whitespace-pre-wrap">
                                    {interceptor.data.content}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <button
                                    disabled={loading}
                                    onClick={() => {
                                        if (interceptor.data.actionUrl) {
                                            handleAction('NAVIGATE', { url: interceptor.data.actionUrl })
                                        } else {
                                            handleAction(interceptor.type === 'POLICY' ? 'ACCEPTED' : 'SEEN')
                                        }
                                    }}
                                    className="w-full sm:w-auto min-w-[240px] bg-slate-900 text-white text-sm font-black py-5 px-10 rounded-[22px] hover:bg-black transition-all active:scale-[0.97] shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 group uppercase tracking-widest"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
                                    {!loading && (interceptor.data.actionLabel || (interceptor.type === 'POLICY' ? 'Xác nhận ngay' : 'Khám phá ngay'))}
                                    {!loading && <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-2 transition-transform" />}
                                </button>

                                <button
                                    onClick={() => handleAction('DISMISSED')}
                                    className="w-full sm:w-auto text-slate-400 hover:text-slate-900 text-[11px] font-black py-4 px-10 transition-all uppercase tracking-[0.3em]"
                                >
                                    Để sau
                                </button>
                            </div>
                        </div>

                        {/* 2. Visual Side (Right / Bottom) */}
                        {interceptor.data?.imageUrl && (
                            <div className="flex-1 relative bg-slate-50 border-l border-slate-100 min-h-[300px] md:min-h-full overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-indigo-500/10 to-blue-500/5 blur-[100px] rounded-full" />

                                <div className="absolute inset-8 md:inset-14">
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.18)] border-4 border-white group">
                                        <img
                                            src={interceptor.data.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* FEEDBACK - Premium Pro Style */}
                {interceptor.type === 'FEEDBACK' && (
                    <div className="text-center px-10 py-12 md:py-16">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-indigo-100 shadow-xl transition-transform hover:rotate-12">
                            <Star className="w-10 h-10 text-indigo-600 fill-indigo-600" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter italic">Chia sẻ trải nghiệm</h2>
                        <p className="text-slate-500 mb-12 text-sm md:text-lg leading-relaxed font-medium max-w-sm mx-auto">Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn.</p>

                        <div className="flex gap-5 justify-center mb-16">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="transition-all hover:scale-125 active:scale-90 p-1"
                                >
                                    <Star className={`w-12 h-12 transition-all ${rating >= star ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'text-slate-100'}`} />
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-5">
                            <button
                                disabled={loading}
                                onClick={() => handleAction('FEEDBACK_SUBMIT', { orderId: interceptor.data.orderId })}
                                className="w-full py-5 bg-slate-900 text-white text-sm font-black rounded-[22px] shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] uppercase tracking-[0.2em]"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin text-white/50" />} Gửi đánh giá ngay
                            </button>
                            <button
                                onClick={() => setVisible(false)}
                                className="w-full py-4 text-slate-400 text-xs font-black uppercase tracking-[0.3em] hover:text-slate-900 transition-colors"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
