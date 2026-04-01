'use client'

import { useState, useEffect } from 'react'
import { Download, Clock, Banknote } from 'lucide-react'
import toast from 'react-hot-toast'
import WithdrawModal from './components/WithdrawModal'
import PaymentStatCards from './components/PaymentStatCards'
import UnpaidTransactionsTable from './components/UnpaidTransactionsTable'
import PaymentHistoryList from './components/PaymentHistoryList'

export default function SupplierPaymentsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [reconcilingId, setReconcilingId] = useState<string | null>(null)
    const [isRequesting, setIsRequesting] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawStep, setWithdrawStep] = useState(1) // 1: Confirm, 2: Processing, 3: Success

    // Developer Tool State
    const [lastPaymentId, setLastPaymentId] = useState<string | null>(null)

    useEffect(() => {
        fetchPayments()
    }, [])

    const fetchPayments = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            if (!supplierId) return;
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

    const handleReconcile = async (orderId: string, orderNumber: string) => {
        setReconcilingId(orderId)
        const loadingToast = toast.loading(`Đang xác nhận đối soát đơn #${orderNumber}...`)

        try {
            const res = await fetch('/api/supplier/orders/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: orderId,
                    status: 'CONFIRMED',
                    notes: 'Nhà cung cấp đã đối soát thành công đơn hàng.'
                })
            })

            const result = await res.json()

            if (result.success) {
                toast.success(`Đã đối soát thành công đơn #${orderNumber}`, { id: loadingToast })
                fetchPayments()
            } else {
                toast.error(result.message || 'Lỗi khi đối soát', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ', { id: loadingToast })
        } finally {
            setReconcilingId(null)
        }
    }

    const handleExport = async () => {
        const supplierId = localStorage.getItem('supplier_id')
        if (!supplierId) return;

        const loadingToast = toast.loading('Đang chuẩn bị sao kê...')
        try {
            const res = await fetch(`/api/supplier/payments/export?supplierId=${supplierId}`)
            if (!res.ok) throw new Error('Export failed')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `sao-ke-doanh-thu-${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)

            toast.success('Đã tải xuống sao kê thành công!', { id: loadingToast })
        } catch (error) {
            toast.error('Lỗi khi xuất sao kê', { id: loadingToast })
        }
    }

    const processWithdrawRequest = async () => {
        const supplierId = localStorage.getItem('supplier_id')
        if (!supplierId || !data?.summary?.currentBalance) return;

        // Validation: Check for bank account configuration
        if (!data?.summary?.bankAccountNumber || !data?.summary?.bankName) {
            toast.error('Vui lòng cập nhật thông tin ngân hàng đầy đủ trong Hồ sơ trước khi rút tiền', {
                duration: 4000,
                icon: '🏦'
            })
            return
        }

        setIsRequesting(true)
        setWithdrawStep(2)

        try {
            const res = await fetch('/api/supplier/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId,
                    amount: data.summary.currentBalance
                })
            })

            const result = await res.json()
            if (result.success) {
                setLastPaymentId(result.data.id) // Save ID for dev tool
                setWithdrawStep(3)
                fetchPayments()
            } else {
                toast.error(result.message || 'Lỗi khi gửi yêu cầu')
                setWithdrawStep(1)
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ')
            setWithdrawStep(1)
        } finally {
            setIsRequesting(false)
        }
    }



    const closeWithdrawModal = () => {
        setShowWithdrawModal(false)
        setWithdrawStep(1)
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
    const filteredTransactions = transactions.filter((tx: any) =>
        tx.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Check if there are any pending withdrawals
    const pendingWithdrawals = data?.paymentHistory?.filter((pm: any) => pm.status === 'PENDING') || []
    const hasPending = pendingWithdrawals.length > 0

    // Bank configured check
    const hasBankConfig = summary.bankAccountNumber && summary.bankName

    return (
        <div className="space-y-10 pb-20 relative">
            {/* Withdraw Modal Overlay */}
            <WithdrawModal 
                show={showWithdrawModal}
                step={withdrawStep}
                summary={summary}
                hasBankConfig={hasBankConfig}
                lastPaymentId={lastPaymentId}
                formatCurrency={formatCurrency}
                onClose={closeWithdrawModal}
                onProcess={processWithdrawRequest}
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản Lý Doanh Thu</h1>
                    <p className="text-slate-500 font-medium italic">Theo dõi tài chính, công nợ và lịch sử nhận tiền thanh toán từ hệ thống.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Tải sao kê
                    </button>
                    <button
                        onClick={() => {
                            if (hasPending) {
                                toast.error('Bạn đang có yêu cầu rút tiền chờ duyệt. Vui lòng đợi.')
                            } else if (summary.currentBalance > 0) {
                                setShowWithdrawModal(true)
                            } else {
                                toast.success('Bạn không có doanh thu chờ quyết toán')
                            }
                        }}
                        disabled={loading || summary.currentBalance === 0}
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${hasPending ? 'bg-amber-100 text-amber-700 shadow-amber-100 hover:bg-amber-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                    >
                        {hasPending ? <Clock className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                        {hasPending ? 'Đang chờ duyệt...' : 'Yêu cầu nhận tiền'}
                    </button>
                </div>
            </div>

            {/* Premium Stat Bento Grid */}
            <PaymentStatCards summary={summary} hasPending={hasPending} formatCurrency={formatCurrency} />

            {/* Detailed Tables Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <UnpaidTransactionsTable 
                    filteredTransactions={filteredTransactions}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isFilterOpen={isFilterOpen}
                    setIsFilterOpen={setIsFilterOpen}
                    reconcilingId={reconcilingId}
                    handleReconcile={handleReconcile}
                    formatCurrency={formatCurrency}
                />

                {/* Right: Payment History */}
                <PaymentHistoryList paymentHistory={data?.paymentHistory} formatCurrency={formatCurrency} />
            </div>
        </div>
    )
}
