'use client'

/**
 * Project Activity Widget
 * Shows FOMO indicators: recent views, active applicants, urgency
 */

import { useState, useEffect } from 'react'
import { Eye, Users, Clock, TrendingUp, Flame, Shield } from 'lucide-react'

interface ProjectActivityProps {
    projectId: string
    viewCount: number
    applicationCount: number
    createdAt: string
    isUrgent: boolean
    verifiedApplicants?: number
}

export default function ProjectActivityWidget({
    projectId,
    viewCount,
    applicationCount,
    createdAt,
    isUrgent,
    verifiedApplicants = 0
}: ProjectActivityProps) {
    const [recentViews, setRecentViews] = useState(0)
    const [isHot, setIsHot] = useState(false)

    useEffect(() => {
        // Simulate recent activity (in production, fetch from analytics API)
        const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)

        // Calculate recent views based on view velocity
        const viewVelocity = viewCount / Math.max(hoursAgo, 1)
        const estimatedRecentViews = Math.round(viewVelocity * 2) // Last 2 hours estimate
        setRecentViews(Math.max(1, Math.min(estimatedRecentViews, viewCount)))

        // Determine if project is "hot"
        setIsHot(viewVelocity > 5 || applicationCount >= 3 || isUrgent)
    }, [viewCount, applicationCount, createdAt, isUrgent])

    const getTimeRemaining = () => {
        // Most projects close within 48-72 hours based on urgency
        const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
        const expectedDuration = isUrgent ? 24 : 72
        const remaining = Math.max(0, expectedDuration - hoursAgo)

        if (remaining <= 0) return null
        if (remaining < 1) return 'dưới 1 giờ'
        if (remaining < 24) return `${Math.round(remaining)} giờ`
        return `${Math.round(remaining / 24)} ngày`
    }

    const timeRemaining = getTimeRemaining()

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            {/* Hot badge */}
            {isHot && (
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        <Flame className="w-3 h-3" />
                        DỰ ÁN HOT
                    </span>
                    <span className="text-xs text-gray-500">Nhiều người đang quan tâm</span>
                </div>
            )}

            {/* Activity indicators */}
            <div className="grid grid-cols-2 gap-3">
                {/* Recent views */}
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{recentViews}+ người</p>
                        <p className="text-[10px] text-gray-500">xem trong 2h qua</p>
                    </div>
                </div>

                {/* Applicants */}
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                        <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{applicationCount} hồ sơ</p>
                        <p className="text-[10px] text-gray-500">đã ứng tuyển</p>
                    </div>
                </div>

                {/* Verified applicants */}
                {verifiedApplicants > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{verifiedApplicants} Verified</p>
                            <p className="text-[10px] text-gray-500">nhà thầu xác minh</p>
                        </div>
                    </div>
                )}

                {/* Time remaining */}
                {timeRemaining && (
                    <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                        <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                            <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
                                ~{timeRemaining}
                            </p>
                            <p className="text-[10px] text-gray-500">dự kiến còn nhận</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Urgency message */}
            {applicationCount >= 3 && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                            <strong>Cạnh tranh cao!</strong> {applicationCount} nhà thầu đã ứng tuyển.
                            {verifiedApplicants > 0 && ` Trong đó ${verifiedApplicants} đã xác minh.`}
                        </span>
                    </p>
                </div>
            )}

            {isUrgent && applicationCount < 3 && (
                <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                            <strong>Cơ hội tốt!</strong> Dự án CẦN GẤP và ít cạnh tranh.
                        </span>
                    </p>
                </div>
            )}
        </div>
    )
}
