'use client'

/** Shared types for the Store Operations feature */

export interface QuickQuote {
    id: string
    customerName: string
    customerPhone: string
    projectName?: string
    notes?: string
    totalAmount: number
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    staffName?: string
    createdAt: string
}

export interface DispatchOrder {
    id: string
    orderNumber: string
    customerName: string
    status: string
    totalAmount: number
    driverId: string | null
}

export interface CashItem {
    id: string
    orderNumber: string
    customerName: string
    amount: number
    cashCollectedAt?: string
    cashHandedOverAt?: string
    driverName?: string
}

export interface Expense {
    id: string
    category: string
    amount: number
    description: string
    date: string
}

export interface Driver {
    id: string
    user: { name: string }
    status: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE'
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-600' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-orange-50 text-orange-600' },
    SHIPPED: { label: 'Đang giao', color: 'bg-emerald-50 text-emerald-600' },
    DELIVERED: { label: 'Đã giao', color: 'bg-green-50 text-green-700' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-500' },
    PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-600' },
    COMPLETED: { label: 'Hoàn tất', color: 'bg-emerald-50 text-emerald-700' },
}

export const getStatusInfo = (status: string) =>
    STATUS_MAP[status] || { label: status, color: 'bg-slate-50 text-slate-600' }

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
