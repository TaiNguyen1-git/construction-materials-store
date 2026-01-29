'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, DollarSign, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoices()
    }, [])

    const fetchInvoices = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/invoices?supplierId=${supplierId}`)
            const data = await res.json()

            if (data.success) {
                setInvoices(data.data || [])
            }
        } catch (error) {
            toast.error('Không thể tải danh sách hóa đơn')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản Lý Hóa Đơn</h1>
                <p className="text-gray-500">Danh sách các hóa đơn từ nhà cung cấp.</p>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Hóa Đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Phát Hành</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn Thanh Toán</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng Tiền</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn Nợ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invoices.length > 0 ? (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(inv.issueDate).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-6 py-4 text-red-600 font-medium">{formatCurrency(inv.balanceAmount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                inv.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Chưa có hóa đơn nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
