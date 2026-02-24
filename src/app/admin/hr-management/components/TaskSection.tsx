'use client'

import React from 'react'
import { ClipboardList, Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Task, getStatusBadge, getStatusText, getPriorityBadge, getPriorityText, formatDate } from '../types'

interface TaskSectionProps {
    tasks: Task[]
    loading: boolean
    expanded: boolean
    onToggle: () => void
    onAdd: () => void
    onEdit: (task: Task) => void
    onDelete: (task: Task) => void
}

export default function TaskSection({
    tasks,
    loading,
    expanded,
    onToggle,
    onAdd,
    onEdit,
    onDelete
}: TaskSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow">
            <div
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            >
                <div className="flex items-center space-x-3">
                    <ClipboardList className="h-5 w-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Công Việc</h2>
                    <span className="text-sm text-gray-500">({tasks.length} công việc)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAdd() }}
                        className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1"
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu Đề</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người Thực Hiện</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu Tiên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.employee?.user?.name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(task.priority)}`}>
                                                    {getPriorityText(task.priority)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                                                    {getStatusText(task.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(task.dueDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => onEdit(task)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => onDelete(task)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
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
