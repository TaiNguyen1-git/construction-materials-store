'use client'

/**
 * AI Material Standards Widget for Project Owners
 * Helps owners set quality standards for their project
 */

import { useState, useEffect } from 'react'
import { Sparkles, ShieldCheck, Check, ShoppingBag, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AISuggestionProps {
    projectId: string
    projectTitle: string
    onApplyStandards: (materials: string) => void
}

export default function AIMaterialStandards({ projectId, projectTitle, onApplyStandards }: AISuggestionProps) {
    const [loading, setLoading] = useState(false)
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [applied, setApplied] = useState(false)

    const fetchSuggestion = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'OWNER_MATERIAL_STANDARDS',
                    projectId,
                    prompt: 'Hãy tư vấn tiêu chuẩn vật tư cho dự án tôi vừa đăng.'
                })
            })
            const data = await res.json()
            if (data.success) {
                setSuggestion(data.data.text)
            }
        } catch (err) {
            console.error('AI Failure')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuggestion()
    }, [projectId])

    const handleApply = () => {
        if (!suggestion) return
        onApplyStandards(suggestion)
        setApplied(true)
        toast.success('Đã áp dụng vật tư tiêu chuẩn vào dự án!')
    }

    if (!suggestion && !loading) return null

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-600 rounded-xl">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 text-lg">SmartBuild AI Tư vấn</h3>
                        <p className="text-xs text-blue-600 font-medium tracking-wide border-b border-blue-200 inline-block">TIÊU CHUẨN VẬT TƯ CHỐT CHẶN</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-blue-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm font-medium animate-pulse">AI đang phân tích dự án của bạn...</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white mb-4 shadow-sm shadow-blue-100">
                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                "{suggestion}"
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                                <ShieldCheck className="w-4 h-4" />
                                Bảo vệ chất lượng công trình
                            </div>
                            <button
                                onClick={handleApply}
                                disabled={applied}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${applied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    }`}
                            >
                                {applied ? (
                                    <><Check className="w-4 h-4" /> Đã áp dụng</>
                                ) : (
                                    <><ShoppingBag className="w-4 h-4" /> Đặt làm tiêu chuẩn vật tư</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Decor Decoration */}
            <div className="absolute -right-8 -bottom-8 opacity-10">
                <Sparkles className="w-48 h-48 text-blue-900" />
            </div>
        </div>
    )
}
