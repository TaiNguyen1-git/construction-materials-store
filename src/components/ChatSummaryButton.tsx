'use client'

import { useState, useEffect } from 'react'

import { FileText, Loader2, CheckCircle, AlertCircle, X, Calendar, Coins, ClipboardList, Sparkles } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ChatSummary {
    id: string
    title: string
    summary: string
    agreedPrice?: number
    priceUnit?: string
    agreedDate?: string
    keyTerms?: Array<{ term: string; value: string; confidence: number }>
    participant1Name: string
    participant2Name: string
    messageCount: number
    isConfirmed: boolean
    confirmedBy: string[]
    createdAt: string
}

interface ChatSummaryButtonProps {
    conversationId: string
    currentUserId: string
    onSummaryCreated?: (summary: ChatSummary) => void
}

export default function ChatSummaryButton({
    conversationId,
    currentUserId,
    onSummaryCreated
}: ChatSummaryButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [summary, setSummary] = useState<ChatSummary | null>(null)
    const [existingSummaries, setExistingSummaries] = useState<ChatSummary[]>([])
    const [isConfirming, setIsConfirming] = useState(false)
    const [step, setStep] = useState<'prompt' | 'summary'>('summary')

    // Handle step transition for guests
    useEffect(() => {
        if (showModal && currentUserId.startsWith('guest_') && !summary) {
            setStep('prompt')
        } else {
            setStep('summary')
        }
    }, [showModal, currentUserId, summary])

    const fetchExistingSummaries = async () => {
        try {
            const res = await fetch(`/api/chat/summary?conversationId=${conversationId}`, {
                headers: { 'x-guest-id': currentUserId }
            })
            if (res.ok) {
                const data = await res.json()
                setExistingSummaries(data.summaries || [])
            }
        } catch (error) {
            console.error('Error fetching summaries:', error)
        }
    }

    const handleGenerateSummary = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/chat/summary', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-guest-id': currentUserId
                },
                body: JSON.stringify({ conversationId })
            })

            const data = await res.json()

            if (res.ok) {
                setSummary(data.summary)
                setStep('summary')
                toast.success('Đã tạo biên bản tóm tắt!')
                onSummaryCreated?.(data.summary)
                fetchExistingSummaries()
            } else {
                toast.error(data.error || 'Không thể tạo tóm tắt')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!summary) return

        setIsConfirming(true)
        try {
            const res = await fetch('/api/chat/summary', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-guest-id': currentUserId
                },
                body: JSON.stringify({
                    summaryId: summary.id,
                    userId: currentUserId
                })
            })

            const data = await res.json()

            if (res.ok) {
                setSummary(data.summary)
                toast.success(data.message)
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setIsConfirming(false)
        }
    }

    const handleOpenModal = () => {
        fetchExistingSummaries()
        setShowModal(true)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const hasUserConfirmed = summary?.confirmedBy?.includes(currentUserId)

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpenModal}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50"
                title="Tạo biên bản thỏa thuận"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <FileText className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Biên bản</span>
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 ${step === 'prompt' ? 'max-w-sm' : 'max-w-md'}`}>
                        {/* HEADER: Dynamic based on step */}
                        {step === 'prompt' ? (
                            <div className="bg-white p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                    <Sparkles className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lưu trữ vĩnh viễn</h2>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5" />
                                        Biên Bản Thỏa Thuận
                                    </h2>
                                    <p className="text-amber-100 text-[10px] mt-1">AI tự động trích xuất các thỏa thuận</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <div className="p-6">
                            {/* STEP 1: REGISTRATION PROMPT (Separate "Form") */}
                            {step === 'prompt' && (
                                <div className="space-y-6">
                                    <p className="text-sm text-slate-500 text-center leading-relaxed font-medium">
                                        Biên bản của bạn sẽ bị xóa khi trình duyệt đóng lại. Hãy đăng ký để bảo vệ và quản lý thỏa thuận tốt hơn.
                                    </p>
                                    
                                    <div className="space-y-3">
                                        <Link 
                                            href={`/login?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/messages')}`} 
                                            className="flex items-center justify-center w-full py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                        >
                                            Đăng ký / Đăng nhập ngay
                                        </Link>
                                        
                                        <button 
                                            onClick={() => setStep('summary')}
                                            className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                                        >
                                            Bỏ qua & Tiếp tục
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => setShowModal(false)}
                                        className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
                                    >
                                        Để sau
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: SUMMARY FORM */}
                            {step === 'summary' && (
                                <div className="space-y-4">
                                    {!summary ? (
                                        <div className="text-center py-6">
                                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                                <FileText className="w-8 h-8 text-amber-500" />
                                            </div>
                                            <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Bắt đầu phân tích</h3>
                                            <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                                                AI sẽ đọc lịch sử trò chuyện và tóm tắt các điểm thống nhất quan trọng nhất.
                                            </p>
                                            <button
                                                onClick={handleGenerateSummary}
                                                disabled={isLoading}
                                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                                                ) : (
                                                    <><FileText className="w-4 h-4" /> Tạo biên bản ngay</>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Status Badge & Final Seal */}
                                            <div className="flex items-center justify-between gap-4">
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${summary.isConfirmed
                                                        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {summary.isConfirmed ? (
                                                        <>
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Đã kết luận & xác nhận
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            Đang chờ xác nhận ({summary.confirmedBy?.length || 0}/2)
                                                        </>
                                                    )}
                                                </div>

                                                {summary.isConfirmed && (
                                                    <div className="flex flex-col items-end">
                                                        <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-lg transform rotate-[-5deg] shadow-sm">
                                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Official</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-bold text-gray-800">{summary.title}</h3>

                                            {/* Summary Text */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-sm text-gray-700 leading-relaxed">{summary.summary}</p>
                                            </div>

                                            {/* Key Extracted Data */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {summary.agreedPrice && (
                                                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold mb-1">
                                                            <Coins className="w-3 h-3" />
                                                            Giá thỏa thuận
                                                        </div>
                                                        <p className="text-green-800 font-bold">
                                                            {formatCurrency(summary.agreedPrice)}
                                                            {summary.priceUnit && <span className="text-xs font-normal">/{summary.priceUnit}</span>}
                                                        </p>
                                                    </div>
                                                )}

                                                {summary.agreedDate && (
                                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                                        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold mb-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Ngày thỏa thuận
                                                        </div>
                                                        <p className="text-blue-800 font-bold text-sm">
                                                            {formatDate(summary.agreedDate)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Key Terms */}
                                            {summary.keyTerms && summary.keyTerms.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Các điều khoản
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {summary.keyTerms.map((term, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                            >
                                                                <span className="text-sm text-gray-600">{term.term}</span>
                                                                <span className="text-sm font-bold text-gray-800">{term.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Participants */}
                                            <div className="text-xs text-gray-400 pt-4 border-t">
                                                Giữa <span className="font-medium text-gray-600">{summary.participant1Name}</span> và <span className="font-medium text-gray-600">{summary.participant2Name}</span> • {summary.messageCount} tin nhắn • {formatDate(summary.createdAt)}
                                            </div>

                                            {/* Confirm Button */}
                                            {!hasUserConfirmed && !summary.isConfirmed && (
                                                <button
                                                    onClick={handleConfirm}
                                                    disabled={isConfirming}
                                                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {isConfirming ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Xác nhận biên bản này
                                                </button>
                                            )}

                                            {hasUserConfirmed && !summary.isConfirmed && (
                                                <div className="text-center text-sm text-gray-500 py-2">
                                                    ✓ Bạn đã xác nhận. Đang chờ bên còn lại.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer (Only for Summary step) */}
                        {step === 'summary' && (
                            <div className="p-4 border-t bg-slate-50 flex justify-between items-center px-6">
                                {summary && (
                                    <button onClick={() => setSummary(null)} className="text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest">Tạo lại</button>
                                )}
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-8 py-2.5 text-[11px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all uppercase tracking-widest border border-amber-200/50"
                                >
                                    Đóng
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
