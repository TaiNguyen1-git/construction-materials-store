'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CreditCard, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierPaymentsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPayments()
    }, [])

    const fetchPayments = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/payments?supplierId=${supplierId}`)
            const result = await res.json()

            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            toast.error('Không thể tải thông tin công nợ')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const summary = data?.summary || {}
    const transactions = data?.unpaidTransactions || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản Lý Công Nợ</h1>
                <p className="text-gray-500">Theo dõi dư nợ và lịch sử thanh toán.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Dư Nợ Hiện Tại (Phải Trả)</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">
                                {formatCurrency(summary.currentBalance)}
                            </h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Cập nhật theo thời gian thực</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Hạn Mức Tín Dụng</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">
                                {formatCurrency(summary.creditLimit)}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Khả Dụng</p>
                            <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                                {formatCurrency((summary.creditLimit || 0) - (summary.currentBalance || 0))}
                            </h3>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-yellow-500" />
                        </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Trạng thái tốt
                    </p>
                </div>
            </div>

            {/* Unpaid Transactions */}
            <div className="bg-white rounded-xl shadow">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Các Khoản Chưa Thanh Toán</h2>
                    <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Chứng Từ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn TT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transactions.length > 0 ? (
                                transactions.map((tx: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{tx.orderNumber}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Đơn Hàng (PO)</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-600">
                                            {formatCurrency(tx.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {/* Dummy due date logic: +30 days */}
                                            {new Date(new Date(tx.createdAt).setDate(new Date(tx.createdAt).getDate() + 30)).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Không có khoản nợ nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
