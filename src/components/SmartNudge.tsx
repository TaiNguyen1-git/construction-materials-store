'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Sparkles, ArrowRight, HardHat, Calculator } from 'lucide-react'
import Link from 'next/link'

interface SmartNudgeProps {
    pageType: 'contractors' | 'products' | 'estimator'
    contextData?: {
        category?: string
        location?: string
        searchQuery?: string
    }
}

export default function SmartNudge({ pageType, contextData }: SmartNudgeProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)
    const [nudgeMessage, setNudgeMessage] = useState('')
    const [nudgeAction, setNudgeAction] = useState<{ label: string; href: string } | null>(null)
    const dwellTimeRef = useRef(0)
    const scrollDepthRef = useRef(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Check if user dismissed recently (store in sessionStorage)
        const dismissed = sessionStorage.getItem('smart_nudge_dismissed')
        if (dismissed && Date.now() - parseInt(dismissed) < 300000) { // 5 minutes cool-down
            setIsDismissed(true)
            return
        }

        // Track time spent on page
        timerRef.current = setInterval(() => {
            dwellTimeRef.current += 1

            // Trigger nudge after 45 seconds of browsing
            if (dwellTimeRef.current >= 45 && !isDismissed && !isVisible) {
                triggerNudge()
            }
        }, 1000)

        // Track scroll depth
        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            scrollDepthRef.current = Math.round((scrollTop / docHeight) * 100)

            // Trigger nudge if user scrolled 80% without action
            if (scrollDepthRef.current > 80 && dwellTimeRef.current > 20 && !isDismissed && !isVisible) {
                triggerNudge()
            }
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [isDismissed, isVisible])

    const triggerNudge = () => {
        // Generate contextual message based on page type
        switch (pageType) {
            case 'contractors':
                setNudgeMessage(
                    contextData?.location
                        ? `Bạn đang tìm nhà thầu tại ${contextData.location}? Để tôi so sánh 3 thầu uy tín nhất cho bạn!`
                        : 'Bạn cần tư vấn chọn nhà thầu phù hợp? Chat với AI để được gợi ý dựa trên nhu cầu cụ thể.'
                )
                setNudgeAction({ label: 'Chat với AI ngay', href: '/chat' })
                break

            case 'products':
                setNudgeMessage(
                    contextData?.category
                        ? `Bạn đang xem ${contextData.category}. Bạn có muốn tính toán chi phí vật liệu cho dự án không?`
                        : 'Không biết chọn vật liệu nào? Thử công cụ AI Dự toán để được gợi ý chính xác!'
                )
                setNudgeAction({ label: 'Thử AI Dự toán', href: '/estimator' })
                break

            case 'estimator':
                setNudgeMessage('Bạn cần hỗ trợ nhập liệu? Mô tả ngắn gọn dự án và AI sẽ giúp bạn tính toán.')
                setNudgeAction(null) // No redirect, just encouragement
                break

            default:
                setNudgeMessage('Cần giúp đỡ? Chat with AI to get free advice!')
                setNudgeAction({ label: 'Bắt đầu chat', href: '/chat' })
        }

        setIsVisible(true)
    }

    const handleDismiss = () => {
        setIsVisible(false)
        setIsDismissed(true)
        sessionStorage.setItem('smart_nudge_dismissed', Date.now().toString())
    }

    if (!isVisible || isDismissed) return null

    return (
        <div className="fixed bottom-32 right-6 z-[60] max-w-sm animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm">Trợ lý AI</span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                        {nudgeMessage}
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Để sau
                        </button>
                        {nudgeAction ? (
                            <Link
                                href={nudgeAction.href}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-1"
                            >
                                {nudgeAction.label}
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        ) : (
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Đã hiểu!
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
