'use client'

/**
 * Verified Benefits Banner
 * Shows benefits of being a verified contractor to encourage registration/verification
 */

import { useState } from 'react'
import { X, Shield, Gift, Star, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface VerifiedBenefitsBannerProps {
    variant?: 'inline' | 'modal' | 'card'
    isLoggedIn: boolean
    isVerified?: boolean
    onClose?: () => void
}

export default function VerifiedBenefitsBanner({
    variant = 'inline',
    isLoggedIn,
    isVerified = false,
    onClose
}: VerifiedBenefitsBannerProps) {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed || isVerified) return null

    const benefits = [
        {
            icon: Gift,
            title: 'Giảm 5% vật tư',
            desc: 'Khi mua từ BoQ bạn đã gửi'
        },
        {
            icon: Star,
            title: 'Hiển thị ưu tiên',
            desc: 'Hồ sơ lên đầu danh sách'
        },
        {
            icon: Shield,
            title: 'Badge Xác minh',
            desc: 'Tăng độ tin cậy với chủ nhà'
        },
        {
            icon: TrendingUp,
            title: 'Thông báo dự án',
            desc: 'Nhận ngay khi có việc mới'
        }
    ]

    const handleDismiss = () => {
        setDismissed(true)
        onClose?.()
    }

    // Inline variant - smaller, for embedding in forms
    if (variant === 'inline') {
        return (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                        <Gift className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-900 text-sm">
                            {isLoggedIn ? 'Xác minh hồ sơ để nhận ưu đãi!' : 'Đăng nhập để nhận ưu đãi vật tư!'}
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Giảm 5% khi mua vật tư + Hiển thị ưu tiên với chủ nhà
                        </p>
                        <Link
                            href={isLoggedIn ? '/contractor/profile' : '/login?redirect=/projects'}
                            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800"
                        >
                            {isLoggedIn ? 'Xác minh ngay' : 'Đăng nhập ngay'}
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <button onClick={handleDismiss} className="p-1 text-amber-400 hover:text-amber-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    // Card variant - for dashboard or sidebar
    if (variant === 'card') {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6" />
                            <h3 className="font-bold">Trở thành Đối tác Xác minh</h3>
                        </div>
                        <button onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <b.icon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{b.title}</p>
                                    <p className="text-xs text-gray-500">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        href={isLoggedIn ? '/contractor/profile' : '/login'}
                        className="mt-4 w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {isLoggedIn ? 'Hoàn tất xác minh' : 'Đăng ký & Xác minh'}
                    </Link>
                </div>
            </div>
        )
    }

    // Modal variant - full overlay
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3" />
                    <h2 className="text-xl font-bold">Nâng cấp lên Đối tác Xác minh</h2>
                    <p className="text-green-100 text-sm mt-1">Mở khóa toàn bộ quyền lợi dành riêng cho nhà thầu</p>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <b.icon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{b.title}</p>
                                    <p className="text-sm text-gray-500">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                        >
                            Để sau
                        </button>
                        <Link
                            href={isLoggedIn ? '/contractor/profile' : '/login'}
                            className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {isLoggedIn ? 'Xác minh ngay' : 'Đăng ký ngay'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
