'use client'

export interface User {
    id: string
    name: string
    email: string
}

export interface Employee {
    id: string
    employeeCode: string
    user: User
    department: string
    position: string
    baseSalary: number
    hireDate: string
    status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
    phone?: string
    isActive?: boolean
}

export interface WorkShift {
    id: string
    employeeId: string
    employee: { user: { name: string } }
    date: string | Date
    startTime: string
    endTime: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED'
    shiftType?: string
    notes?: string
}

export interface Task {
    id: string
    employeeId: string
    title: string
    description: string
    employee?: { user: { name: string } }
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'AWAITING_REVIEW' | 'CANCELLED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    taskType?: string
    dueDate?: string | Date
    createdAt: string
    proofUrl?: string
    proofNotes?: string
    submittedAt?: string
}

export const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
        'ACTIVE': 'bg-green-100 text-green-800',
        'INACTIVE': 'bg-yellow-100 text-yellow-800',
        'TERMINATED': 'bg-red-100 text-red-800',
        'SCHEDULED': 'bg-blue-100 text-blue-800',
        'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
        'COMPLETED': 'bg-green-100 text-green-800',
        'ABSENT': 'bg-red-100 text-red-800',
        'CANCELLED': 'bg-gray-100 text-gray-800',
        'PENDING': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}

export const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
        'ACTIVE': 'Đang Làm',
        'INACTIVE': 'Nghỉ Việc',
        'TERMINATED': 'Đã Nghỉ',
        'SCHEDULED': 'Đã Lên Lịch',
        'IN_PROGRESS': 'Đang Làm',
        'COMPLETED': 'Hoàn Thành',
        'ABSENT': 'Vắng Mặt',
        'CANCELLED': 'Đã Hủy',
        'PENDING': 'Chờ Xử Lý'
    }
    return texts[status] || status
}

export const getPriorityBadge = (priority: string) => {
    const colors: { [key: string]: string } = {
        'LOW': 'bg-gray-100 text-gray-800',
        'MEDIUM': 'bg-orange-100 text-orange-800',
        'HIGH': 'bg-red-100 text-red-800',
        'URGENT': 'bg-red-200 text-red-900'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
}

export const getPriorityText = (priority: string) => {
    const texts: { [key: string]: string } = { 'LOW': 'Thấp', 'MEDIUM': 'Trung Bình', 'HIGH': 'Cao', 'URGENT': 'Khẩn Cấp' }
    return texts[priority] || priority
}

export const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return '-'
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
        if (isNaN(date.getTime())) return '-'
        return date.toLocaleDateString('vi-VN')
    } catch {
        return '-'
    }
}
