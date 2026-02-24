'use client'

import React from 'react'
import { Users, Plus, Edit, Trash2, XCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { Employee, getStatusBadge, getStatusText } from '../types'

interface EmployeeSectionProps {
    employees: Employee[]
    loading: boolean
    expanded: boolean
    onToggle: () => void
    onAdd: () => void
    onEdit: (emp: Employee) => void
    onDelete: (emp: Employee) => void
    onPermanentDelete: (emp: Employee) => void
}

export default function EmployeeSection({
    employees,
    loading,
    expanded,
    onToggle,
    onAdd,
    onEdit,
    onDelete,
    onPermanentDelete
}: EmployeeSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow">
            <div
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
            >
                <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Nhân Viên</h2>
                    <span className="text-sm text-gray-500">({employees.length} người)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAdd() }}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ Tên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng Ban</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chức Vụ</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lương</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.employeeCode}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(employee.baseSalary || 0).toLocaleString('vi-VN')}đ</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(employee.isActive !== false ? 'ACTIVE' : 'INACTIVE')}`}>
                                                    {getStatusText(employee.isActive !== false ? 'ACTIVE' : 'INACTIVE')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => onEdit(employee)} className="text-blue-600 hover:text-blue-900" title="Sửa"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => onDelete(employee)} className="text-orange-600 hover:text-orange-900" title="Vô hiệu hóa"><Trash2 className="h-4 w-4" /></button>
                                                <button onClick={() => onPermanentDelete(employee)} className="text-red-600 hover:text-red-900" title="Xóa vĩnh viễn"><XCircle className="h-4 w-4" /></button>
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
