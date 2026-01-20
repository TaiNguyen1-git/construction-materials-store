'use client'

/**
 * Create Contract Modal
 * Allows project owner to set up payment milestones when selecting a contractor
 */

import { useState } from 'react'
import { X, Plus, Trash2, DollarSign, CheckCircle, AlertTriangle, Percent } from 'lucide-react'
import toast from 'react-hot-toast'

interface Milestone {
    id: string
    name: string
    percentage: number
}

interface CreateContractModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectTitle: string
    applicationId: string
    contractorName: string
    proposedBudget: number | null
    onSuccess: () => void
}

const DEFAULT_MILESTONES: Milestone[] = [
    { id: '1', name: 'Tạm ứng khởi công', percentage: 30 },
    { id: '2', name: 'Hoàn thành phần thô', percentage: 40 },
    { id: '3', name: 'Nghiệm thu hoàn thiện', percentage: 30 }
]

export default function CreateContractModal({
    isOpen,
    onClose,
    projectId,
    projectTitle,
    applicationId,
    contractorName,
    proposedBudget,
    onSuccess
}: CreateContractModalProps) {
    const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES)
    const [totalAmount, setTotalAmount] = useState(proposedBudget || 0)
    const [submitting, setSubmitting] = useState(false)

    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)
    const isValid = Math.abs(totalPercentage - 100) < 0.01

    const addMilestone = () => {
        setMilestones([
            ...milestones,
            { id: Date.now().toString(), name: '', percentage: 0 }
        ])
    }

    const removeMilestone = (id: string) => {
        if (milestones.length <= 1) return
        setMilestones(milestones.filter(m => m.id !== id))
    }

    const updateMilestone = (id: string, field: 'name' | 'percentage', value: string | number) => {
        setMilestones(milestones.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ))
    }

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error('Tổng % các giai đoạn phải bằng 100%')
            return
        }

        const emptyNames = milestones.filter(m => !m.name.trim())
        if (emptyNames.length > 0) {
            toast.error('Vui lòng đặt tên cho tất cả giai đoạn')
            return
        }

        setSubmitting(true)

        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/marketplace/projects/${projectId}/contract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    applicationId,
                    totalAmount,
                    milestones: milestones.map(m => ({
                        name: m.name,
                        percentage: m.percentage
                    }))
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Đã tạo hợp đồng thành công!')
                onSuccess()
                onClose()
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Tạo hợp đồng & Lịch thanh toán</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{projectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Contractor Info */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-800">Nhà thầu được chọn</p>
                                <p className="text-sm text-green-600">{contractorName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tổng giá trị hợp đồng (VNĐ)
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            = {formatCurrency(totalAmount)} VNĐ
                        </p>
                    </div>

                    {/* Milestones */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">
                                Các giai đoạn thanh toán
                            </label>
                            <div className={`text-sm font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                Tổng: {totalPercentage}%
                                {isValid ? ' ✓' : ' (cần = 100%)'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {milestones.map((milestone, index) => (
                                <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={milestone.name}
                                        onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                                        placeholder="Tên giai đoạn..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="relative w-24">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={milestone.percentage}
                                            onChange={(e) => updateMilestone(milestone.id, 'percentage', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                                        />
                                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="w-28 text-right text-sm font-semibold text-gray-700">
                                        {formatCurrency(Math.round(totalAmount * milestone.percentage / 100))}đ
                                    </span>
                                    {milestones.length > 1 && (
                                        <button
                                            onClick={() => removeMilestone(milestone.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addMilestone}
                            className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm giai đoạn
                        </button>
                    </div>

                    {/* Escrow Notice */}
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold">Về thanh toán qua SmartBuild Escrow:</p>
                                <ul className="mt-1 space-y-1 list-disc list-inside text-amber-700">
                                    <li>Tiền được giữ an toàn bởi SmartBuild</li>
                                    <li>Nhà thầu nhận tiền khi hoàn thành và được bạn xác nhận</li>
                                    <li>Bảo vệ cả hai bên khỏi rủi ro</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !isValid}
                        className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Chọn thầu & Tạo hợp đồng
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
