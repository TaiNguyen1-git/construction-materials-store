'use client'

import React from 'react'
import { Calendar, Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { WorkShift, getStatusBadge, getStatusText, formatDate } from '../types'

interface ShiftSectionProps {
    shifts: WorkShift[]
    loading: boolean
    expanded: boolean
    onToggle: () => void
    onAdd: () => void
    onEdit: (shift: WorkShift) => void
    onDelete: (shift: WorkShift) => void
}

export default function ShiftSection({
    shifts,
    loading,
    expanded,
    onToggle,
    onAdd,
    onEdit,
    onDelete
}: ShiftSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow">
            <div
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            >
                <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Ca Làm Việc</h2>
                    <span className="text-sm text-gray-500">({shifts.length} ca)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAdd() }}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" /> Thêm
                    </button>
                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </div>

            {expanded && (
                <div className="border-t">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân Viên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ Bắt Đầu</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ Kết Thúc</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {shifts.map((shift) => (
                                        <tr key={shift.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift.employee?.user?.name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(shift.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shift.startTime}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shift.endTime}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(shift.status)}`}>
                                                    {getStatusText(shift.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => onEdit(shift)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => onDelete(shift)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
