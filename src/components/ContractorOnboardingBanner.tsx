'use client'

/**
 * ContractorOnboardingBanner Component
 * Displays urgent notification for contractors who haven't completed onboarding
 */

import { AlertCircle, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import ContractorOnboardingFlow from './ContractorOnboardingFlow'

interface OnboardingBannerProps {
    user: any
    profile: any
}

export default function ContractorOnboardingBanner({ user, profile }: OnboardingBannerProps) {
    const [showModal, setShowModal] = useState(false)

    // Determine priority and status
    const needsPasswordChange = user?.mustChangePassword
    const isIncomplete = profile?.onboardingStatus === 'INCOMPLETE'
    const isPendingReview = profile?.onboardingStatus === 'PENDING_REVIEW'
    const isRejected = profile?.onboardingStatus === 'REJECTED'

    if (profile?.onboardingStatus === 'VERIFIED') return null

    const getStatusConfig = () => {
        if (needsPasswordChange) {
            return {
                bg: 'bg-red-50 border-red-200',
                text: 'text-red-700',
                icon: <ShieldAlert className="w-5 h-5" />,
                title: 'Bảo mật: Yêu cầu đổi mật khẩu',
                action: 'Thiết lập ngay'
            }
        }
        if (isRejected) {
            return {
                bg: 'bg-red-50 border-red-200',
                text: 'text-red-700',
                icon: <AlertCircle className="w-5 h-5" />,
                title: 'Hồ sơ bị từ chối xác thực',
                action: 'Cập nhật lại'
            }
        }
        if (isIncomplete) {
            return {
                bg: 'bg-orange-50 border-orange-200',
                text: 'text-orange-700',
                icon: <AlertCircle className="w-5 h-5" />,
                title: 'Hồ sơ chưa hoàn thiện',
                action: 'Hoàn tất hồ sơ'
            }
        }
        if (isPendingReview) {
            return {
                bg: 'bg-blue-50 border-blue-200',
                text: 'text-blue-700',
                icon: <CheckCircle2 className="w-5 h-5" />,
                title: 'Hồ sơ đang chờ xác thực',
                action: 'Xem trạng thái'
            }
        }
        return null
    }

    const config = getStatusConfig()
    if (!config) return null

    return (
        <>
            <div className={`p-4 rounded-2xl border-2 mb-6 ${config.bg} ${config.text} transition-all`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/50 rounded-lg">
                            {config.icon}
                        </div>
                        <div>
                            <p className="font-bold text-sm md:text-base">{config.title}</p>
                            <p className="text-xs opacity-80">
                                {isPendingReview
                                    ? 'Ban quản trị đang xem xét hồ sơ của bạn. Quá trình này mất 24h.'
                                    : 'Vui lòng hoàn thiện để tăng 50% khả năng nhận dự án.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1 px-4 py-2 bg-white rounded-xl text-sm font-black shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                    >
                        {config.action}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showModal && (
                <ContractorOnboardingFlow
                    user={user}
                    onComplete={() => {
                        setShowModal(false)
                        window.location.reload()
                    }}
                />
            )}
        </>
    )
}
