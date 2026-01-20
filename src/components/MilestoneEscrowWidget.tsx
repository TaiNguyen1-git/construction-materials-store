'use client'

/**
 * MilestoneEscrowWidget Component
 * Visual widget for milestone payment with escrow status
 */

import { useState, useEffect } from 'react'
import {
    Wallet, Lock, Unlock, CheckCircle2, Clock, AlertTriangle,
    Loader2, ChevronRight, Shield, Camera, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface EscrowData {
    milestoneId: string
    milestoneName: string
    amount: number
    percentage: number
    status: 'PENDING' | 'ESCROW_PAID' | 'COMPLETED' | 'RELEASED'
    paidAt?: string
    escrow: {
        isDeposited: boolean
        isReleased: boolean
        canRelease: boolean
    }
    verification: {
        totalReports: number
        approvedReports: number
        pendingReports: number
        hasEvidence: boolean
    }
    customer: string
    contractor: string
}

interface MilestoneEscrowWidgetProps {
    milestoneId: string
    isCustomer?: boolean // true = customer view, false = contractor view
    onStatusChange?: () => void
}

export default function MilestoneEscrowWidget({
    milestoneId,
    isCustomer = true,
    onStatusChange
}: MilestoneEscrowWidgetProps) {
    const [data, setData] = useState<EscrowData | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [confirmAction, setConfirmAction] = useState<'DEPOSIT' | 'RELEASE' | null>(null)

    useEffect(() => {
        fetchEscrowStatus()
    }, [milestoneId])

    const fetchEscrowStatus = async () => {
        try {
            const res = await fetch(`/api/milestones/${milestoneId}/escrow`)
            if (!res.ok) throw new Error('Failed to fetch')
            const json = await res.json()
            setData(json.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (action: 'DEPOSIT' | 'RELEASE') => {
        try {
            setActionLoading(true)
            const res = await fetch(`/api/milestones/${milestoneId}/escrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            const json = await res.json()

            if (!res.ok) {
                toast.error(json.error?.message || 'Có lỗi xảy ra')
                return
            }

            toast.success(json.message)
            fetchEscrowStatus()
            onStatusChange?.()
            setShowConfirmModal(false)

        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setActionLoading(false)
        }
    }

    const openConfirmModal = (action: 'DEPOSIT' | 'RELEASE') => {
        setConfirmAction(action)
        setShowConfirmModal(true)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
        )
    }

    if (!data) return null

    const getStatusConfig = () => {
        if (data.escrow.isReleased) {
            return {
                bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                icon: <CheckCircle2 className="w-8 h-8" />,
                label: 'ĐÃ GIẢI NGÂN',
                description: 'Công việc đã hoàn thành và thanh toán xong'
            }
        }
        if (data.escrow.isDeposited) {
            return {
                bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                icon: <Lock className="w-8 h-8" />,
                label: 'ESCROW - ĐÃ NỘP',
                description: 'Tiền đang được giữ an toàn, chờ xác nhận công việc'
            }
        }
        return {
            bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
            icon: <Clock className="w-8 h-8" />,
            label: 'CHỜ THANH TOÁN',
            description: 'Milestone này chưa được thanh toán'
        }
    }

    const config = getStatusConfig()

    return (
        <>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header with status */}
                <div className={`${config.bg} text-white p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                {config.icon}
                            </div>
                            <div>
                                <span className="text-xs font-bold opacity-80 uppercase tracking-wider">
                                    {config.label}
                                </span>
                                <h3 className="text-xl font-black mt-1">{data.milestoneName}</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-80">Giá trị</p>
                            <p className="text-2xl font-black">{data.amount.toLocaleString('vi-VN')}đ</p>
                            <p className="text-xs opacity-80">{data.percentage}% tổng giá trị</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Trust badge */}
                    <div className="flex items-center gap-3 bg-blue-50 text-blue-700 p-4 rounded-xl">
                        <Shield className="w-5 h-5" />
                        <div className="flex-1">
                            <p className="font-bold text-sm">Bảo vệ bởi SmartBuild Escrow</p>
                            <p className="text-xs opacity-75">{config.description}</p>
                        </div>
                    </div>

                    {/* Work verification status */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Camera className="w-4 h-4 text-gray-500" />
                            Xác minh công việc
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                                <p className="text-2xl font-black text-gray-900">{data.verification.totalReports}</p>
                                <p className="text-xs text-gray-500">Tổng báo cáo</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                                <p className="text-2xl font-black text-green-600">{data.verification.approvedReports}</p>
                                <p className="text-xs text-gray-500">Đã duyệt</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-orange-100">
                                <p className="text-2xl font-black text-orange-600">{data.verification.pendingReports}</p>
                                <p className="text-xs text-gray-500">Chờ duyệt</p>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>👤 Khách: {data.customer}</span>
                        <span>🔧 Thầu: {data.contractor}</span>
                    </div>

                    {/* Actions */}
                    {isCustomer && !data.escrow.isReleased && (
                        <div className="pt-4 border-t border-gray-100 space-y-3">
                            {!data.escrow.isDeposited && (
                                <button
                                    onClick={() => openConfirmModal('DEPOSIT')}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:shadow-xl transition-shadow"
                                >
                                    <Wallet className="w-5 h-5" />
                                    NỘP TIỀN VÀO ESCROW
                                </button>
                            )}

                            {data.escrow.isDeposited && data.escrow.canRelease && (
                                <button
                                    onClick={() => openConfirmModal('RELEASE')}
                                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 hover:shadow-xl transition-shadow"
                                >
                                    <Unlock className="w-5 h-5" />
                                    XÁC NHẬN & GIẢI NGÂN
                                </button>
                            )}

                            {data.escrow.isDeposited && !data.escrow.canRelease && (
                                <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-center">
                                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                                    <p className="font-bold text-sm">Chưa thể giải ngân</p>
                                    <p className="text-xs">Cần có ít nhất 1 báo cáo công việc được duyệt</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contractor view */}
                    {!isCustomer && (
                        <div className="pt-4 border-t border-gray-100">
                            {data.escrow.isDeposited && !data.escrow.isReleased && (
                                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-center">
                                    <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                                    <p className="font-bold text-sm">Tiền đang trong Escrow</p>
                                    <p className="text-xs">Hoàn thành công việc và gửi báo cáo để khách hàng giải ngân</p>
                                </div>
                            )}

                            {data.escrow.isReleased && (
                                <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center">
                                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                                    <p className="font-bold text-sm">Đã nhận thanh toán</p>
                                    <p className="text-xs">{data.amount.toLocaleString('vi-VN')}đ đã được chuyển vào tài khoản</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="text-center mb-6">
                            {confirmAction === 'DEPOSIT' ? (
                                <>
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Lock className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">Xác nhận nộp Escrow</h3>
                                    <p className="text-gray-500 mt-2">
                                        Bạn sẽ nộp <span className="font-bold text-blue-600">{data.amount.toLocaleString('vi-VN')}đ</span> vào
                                        hệ thống escrow. Tiền sẽ được giữ an toàn cho đến khi bạn xác nhận hoàn thành công việc.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Unlock className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">Xác nhận giải ngân</h3>
                                    <p className="text-gray-500 mt-2">
                                        Bạn xác nhận công việc milestone "{data.milestoneName}" đã hoàn thành.
                                        <span className="font-bold text-green-600"> {data.amount.toLocaleString('vi-VN')}đ</span> sẽ được
                                        chuyển cho nhà thầu.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => confirmAction && handleAction(confirmAction)}
                                disabled={actionLoading}
                                className={`flex-1 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 ${confirmAction === 'DEPOSIT'
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Xác nhận
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
