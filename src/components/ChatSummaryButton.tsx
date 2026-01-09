'use client'

import { useState } from 'react'
import { FileText, Loader2, CheckCircle, AlertCircle, X, Calendar, DollarSign, ClipboardList } from 'lucide-react'
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

    const fetchExistingSummaries = async () => {
        try {
            const res = await fetch(`/api/chat/summary?conversationId=${conversationId}`)
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            })

            const data = await res.json()

            if (res.ok) {
                setSummary(data.summary)
                setShowModal(true)
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
                headers: { 'Content-Type': 'application/json' },
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5" />
                                    Biên Bản Thỏa Thuận
                                </h2>
                                <p className="text-amber-100 text-xs mt-1">
                                    AI tự động trích xuất các điểm thống nhất từ cuộc hội thoại
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto max-h-[60vh]">
                            {/* Generate New Summary */}
                            {!summary && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2">Tạo biên bản mới</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        AI sẽ phân tích cuộc hội thoại và trích xuất các thỏa thuận quan trọng như giá cả, thời gian, điều khoản.
                                    </p>
                                    <button
                                        onClick={handleGenerateSummary}
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang phân tích...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4" />
                                                Tạo Biên Bản
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Display Summary */}
                            {summary && (
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${summary.isConfirmed
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {summary.isConfirmed ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Đã xác nhận bởi cả hai bên
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-3 h-3" />
                                                Đang chờ xác nhận ({summary.confirmedBy?.length || 0}/2)
                                            </>
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
                                                    <DollarSign className="w-3 h-3" />
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

                            {/* Existing Summaries */}
                            {existingSummaries.length > 0 && !summary && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        Biên bản trước đó
                                    </h4>
                                    <div className="space-y-2">
                                        {existingSummaries.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSummary(s)}
                                                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-800">{s.title}</span>
                                                    {s.isConfirmed && (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{formatDate(s.createdAt)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            {summary && (
                                <button
                                    onClick={() => setSummary(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Tạo biên bản mới
                                </button>
                            )}
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
