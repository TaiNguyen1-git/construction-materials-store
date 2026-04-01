'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, FileText, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'

import { Invoice } from './types'
import { fmt, fmtShort, getStatus, typeMap } from './utils'
import KpiCard from './components/KpiCard'
import InvoiceDetailModal from './components/InvoiceDetailModal'
import CancelInvoiceModal from './components/CancelInvoiceModal'
import InvoiceTable from './components/InvoiceTable'
import RecordPaymentModal from './components/RecordPaymentModal'

// ── Main Component ──────────────────────────────────────────────────────────────
export default function SupplierInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [paymentModal, setPaymentModal] = useState<Invoice | null>(null)
    const [cancelModal, setCancelModal] = useState<Invoice | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })

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
        } catch {
            toast.error('Không thể tải danh sách hóa đơn')
        } finally {
            setLoading(false)
        }
    }

    // ── Filtered invoices ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return invoices.filter(inv => {
            if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false
            if (typeFilter !== 'ALL' && inv.invoiceType !== typeFilter) return false
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const matchNumber = inv.invoiceNumber?.toLowerCase().includes(q)
                const matchOrder = inv.order?.orderNumber?.toLowerCase().includes(q)
                const matchCustomer = (inv.customer?.user?.name?.toLowerCase().includes(q) || inv.customer?.companyName?.toLowerCase().includes(q))
                if (!matchNumber && !matchOrder && !matchCustomer) return false
            }
            if (dateRange.from) {
                const from = new Date(dateRange.from)
                if (new Date(inv.issueDate) < from) return false
            }
            if (dateRange.to) {
                const to = new Date(dateRange.to)
                to.setHours(23, 59, 59)
                if (new Date(inv.issueDate) > to) return false
            }
            return true
        })
    }, [invoices, searchQuery, statusFilter, typeFilter, dateRange])

    // ── KPI calculations ─────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const total = invoices.reduce((s, i) => s + i.totalAmount, 0)
        const outstanding = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s, i) => s + i.balanceAmount, 0)
        const overdue = invoices.filter(i => i.status === 'OVERDUE').length
        const paid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0)
        return { total, outstanding, overdue, paid }
    }, [invoices])

    // ── VAT Upload ───────────────────────────────────────────────────────────────
    const handleUploadVAT = async (id: string, file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
            const uploadData = await uploadRes.json()

            if (uploadData.success) {
                const patchRes = await fetch('/api/supplier/invoices/vat-attachment', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, vatInvoiceUrl: uploadData.fileUrl })
                })
                const patchData = await patchRes.json()
                if (patchData.success) {
                    toast.success('Đã tải lên hóa đơn VAT')
                    fetchInvoices()
                    if (selectedInvoice?.id === id) {
                        setSelectedInvoice({ ...selectedInvoice, vatInvoiceUrl: uploadData.fileUrl })
                    }
                }
            }
        } catch {
            toast.error('Lỗi khi tải lên file')
        }
    }

    // ── Skeleton ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-8 pb-20">
                <div className="h-10 w-64 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />
                    ))}
                </div>
                <div className="h-96 bg-white rounded-3xl animate-pulse border border-slate-100" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản Lý Hóa Đơn</h1>
                    <p className="text-slate-500 font-medium mt-1">Theo dõi hóa đơn, công nợ và thanh toán từ đối tác.</p>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {filtered.length} / {invoices.length} hóa đơn
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <KpiCard
                    label="Tổng giá trị"
                    value={fmtShort(kpis.total)}
                    sub={`${invoices.length} hóa đơn`}
                    accent="blue"
                />
                <KpiCard
                    label="Đã thu"
                    value={fmtShort(kpis.paid)}
                    sub="Thanh toán hoàn tất"
                    accent="emerald"
                />
                <KpiCard
                    label="Chưa thu"
                    value={fmtShort(kpis.outstanding)}
                    sub="Đang chờ thanh toán"
                    accent="amber"
                />
                <KpiCard
                    label="Quá hạn"
                    value={kpis.overdue.toString()}
                    sub="Cần xử lý ngay"
                    accent="rose"
                />
            </div>

            {/* ── Filters ────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="Số hóa đơn, mã đơn, khách hàng..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="DRAFT">Nháp</option>
                            <option value="SENT">Đã gửi</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="OVERDUE">Quá hạn</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Loại</label>
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="SALES">Bán hàng</option>
                            <option value="PURCHASE">Mua hàng</option>
                            <option value="RETURN">Trả hàng</option>
                            <option value="CREDIT_NOTE">Ghi có</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Từ ngày</label>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Đến ngày</label>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                </div>
                {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateRange.from || dateRange.to) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setTypeFilter('ALL'); setDateRange({ from: '', to: '' }) }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>

            {/* ── Table ──────────────────────────────────────────────────────────── */}
            <InvoiceTable 
                filtered={filtered}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                setSelectedInvoice={setSelectedInvoice}
                handleUploadVAT={handleUploadVAT}
                setPaymentModal={setPaymentModal}
            />

            {/* ── Detail Modal ────────────────────────────────────────────────────── */}
            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onRecordPayment={() => { setPaymentModal(selectedInvoice); setSelectedInvoice(null) }}
                    onCancel={() => { setCancelModal(selectedInvoice); setSelectedInvoice(null) }}
                    onUploadVAT={handleUploadVAT}
                />
            )}

            {/* ── Record Payment Modal ────────────────────────────────────────────── */}
            {paymentModal && (
                <RecordPaymentModal
                    invoice={paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => { setPaymentModal(null); fetchInvoices() }}
                />
            )}

            {/* ── Cancel Modal ────────────────────────────────────────────────────── */}
            {cancelModal && (
                <CancelInvoiceModal
                    invoice={cancelModal}
                    onClose={() => setCancelModal(null)}
                    onSuccess={() => { setCancelModal(null); fetchInvoices() }}
                />
            )}
        </div>
    )
}

