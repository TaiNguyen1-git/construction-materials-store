'use client'

/**
 * AI Insights Widget
 * Shows AI-powered analysis and recommendations for project applications
 */

import { useState, useEffect } from 'react'
import {
    Sparkles, TrendingUp, DollarSign, Clock, Shield, Star,
    ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle,
    ArrowRight, Zap
} from 'lucide-react'

interface AIInsight {
    summary: {
        total: number
        verified: number
        guests: number
        avgBudget: number
        avgDays: number
    }
    highlights: {
        bestPrice: { id: string; name: string; budget: number } | null
        fastest: { id: string; name: string; days: number } | null
        mostTrusted: { id: string; name: string; trustScore: number } | null
        highestRated: { id: string; name: string; rating: number } | null
    }
    recommendations: string[]
    top3: {
        id: string
        name: string
        score: number
        highlights: string[]
        isVerified: boolean
        isGuest: boolean
        budget: number | null
        days: number | null
    }[]
}

interface AIInsightsWidgetProps {
    projectId: string
    onSelectApplication?: (id: string) => void
}

export default function AIInsightsWidget({ projectId, onSelectApplication }: AIInsightsWidgetProps) {
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)
    const [insights, setInsights] = useState<AIInsight | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchInsights()
    }, [projectId])

    const fetchInsights = async () => {
        try {
            const res = await fetch(`/api/marketplace/projects/${projectId}/analyze`, {
                method: 'POST'
            })
            const data = await res.json()

            if (data.success && data.data.analysis) {
                setInsights(data.data.analysis)
            } else {
                setInsights(null)
            }
        } catch (err) {
            setError('Không thể tải phân tích')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount)
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    <span className="text-purple-700 font-medium">AI đang phân tích hồ sơ...</span>
                </div>
            </div>
        )
    }

    if (!insights || insights.summary.total === 0) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-100/50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-purple-900">AI Gợi ý lựa chọn</h3>
                        <p className="text-xs text-purple-600">
                            Phân tích {insights.summary.total} hồ sơ • {insights.summary.verified} Verified
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                )}
            </div>

            {/* Content */}
            {expanded && (
                <div className="p-4 pt-0 space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {insights.highlights.bestPrice && (
                            <div className="p-3 bg-white/70 rounded-lg border border-green-200">
                                <div className="flex items-center gap-1.5 text-green-600 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs font-medium">Giá tốt nhất</span>
                                </div>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                    {insights.highlights.bestPrice.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatCurrency(insights.highlights.bestPrice.budget)}đ
                                </p>
                            </div>
                        )}

                        {insights.highlights.fastest && (
                            <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-medium">Nhanh nhất</span>
                                </div>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                    {insights.highlights.fastest.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {insights.highlights.fastest.days} ngày
                                </p>
                            </div>
                        )}

                        {insights.highlights.mostTrusted && (
                            <div className="p-3 bg-white/70 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-xs font-medium">Tin cậy nhất</span>
                                </div>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                    {insights.highlights.mostTrusted.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {insights.highlights.mostTrusted.trustScore}%
                                </p>
                            </div>
                        )}

                        {insights.highlights.highestRated && (
                            <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                                    <Star className="w-4 h-4" />
                                    <span className="text-xs font-medium">Đánh giá cao</span>
                                </div>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                    {insights.highlights.highestRated.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {insights.highlights.highestRated.rating.toFixed(1)} ⭐
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Recommendations */}
                    {insights.recommendations.length > 0 && (
                        <div className="space-y-1.5">
                            {insights.recommendations.map((rec, i) => (
                                <p key={i} className="text-sm text-gray-700">{rec}</p>
                            ))}
                        </div>
                    )}

                    {/* Top 3 */}
                    {insights.top3.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-purple-700 mb-2">
                                🏆 TOP 3 GỢI Ý:
                            </p>
                            <div className="space-y-2">
                                {insights.top3.map((app, index) => (
                                    <div
                                        key={app.id}
                                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors"
                                        onClick={() => onSelectApplication?.(app.id)}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900 truncate">{app.name}</p>
                                                {app.isVerified && (
                                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                )}
                                                {app.isGuest && (
                                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        Khách
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {app.highlights.map((h, hi) => (
                                                    <span key={hi} className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                                        {h}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {app.budget && (
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(app.budget)}đ
                                                </p>
                                            )}
                                            {app.days && (
                                                <p className="text-xs text-gray-500">{app.days} ngày</p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Average info */}
                    <div className="text-xs text-gray-500 text-center pt-2 border-t border-purple-200">
                        Trung bình: {formatCurrency(insights.summary.avgBudget)}đ • {insights.summary.avgDays} ngày
                    </div>
                </div>
            )}
        </div>
    )
}
