'use client'

import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ───────────────────────────────────────────────────────────────────────
interface InvoiceItem {
    id: string
    productId: string
    description?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    discount: number
    taxRate: number
    taxAmount: number
    product?: { name: string }
}

interface Invoice {
    id: string
    invoiceNumber: string
    invoiceType: string
    orderId?: string
    customerId?: string
    supplierId?: string
    issueDate: string
    dueDate?: string
    status: string
    subtotal: number
    taxAmount: number
    discountAmount: number
    totalAmount: number
    paidAmount: number
    balanceAmount: number
    paymentTerms?: string
    notes?: string
    vatInvoiceUrl?: string
    createdAt: string
    updatedAt: string
    invoiceItems: InvoiceItem[]
    order?: { orderNumber: string }
    customer?: { user?: { name?: string; email?: string }; companyName?: string }
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const fmtShort = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' tr'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
    return n.toString()
}

const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
    DRAFT: { label: 'Nháp', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    SENT: { label: 'Đã gửi', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    PAID: { label: 'Đã thanh toán', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    OVERDUE: { label: 'Quá hạn', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    CANCELLED: { label: 'Đã hủy', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
}

const typeMap: Record<string, string> = {
    SALES: 'Bán hàng',
    PURCHASE: 'Mua hàng',
    RETURN: 'Trả hàng',
    CREDIT_NOTE: 'Ghi có',
}

const getStatus = (s: string) => statusMap[s] || statusMap.DRAFT

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
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số hóa đơn</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loại</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày phát hành</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hạn TT</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tổng tiền</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Còn nợ</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">VAT</th>
                                <th className="px-7 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length > 0 ? (
                                filtered.map((inv) => {
                                    const st = getStatus(inv.status)
                                    const isOverdue = inv.status === 'OVERDUE'
                                    return (
                                        <tr
                                            key={inv.id}
                                            className={`group hover:bg-slate-50/50 transition-all duration-200 cursor-pointer ${isOverdue ? 'bg-rose-50/30' : ''}`}
                                            onClick={() => setSelectedInvoice(inv)}
                                        >
                                            <td className="px-7 py-5">
                                                <span className="font-black text-blue-600 text-base tracking-tight">{inv.invoiceNumber}</span>
                                                {inv.order?.orderNumber && (
                                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">Đơn #{inv.order.orderNumber}</div>
                                                )}
                                            </td>
                                            <td className="px-7 py-5">
                                                <span className="text-xs font-bold text-slate-600">{typeMap[inv.invoiceType] || inv.invoiceType}</span>
                                            </td>
                                            <td className="px-7 py-5">
                                                <span className="text-sm font-medium text-slate-700">{new Date(inv.issueDate).toLocaleDateString('vi-VN')}</span>
                                            </td>
                                            <td className="px-7 py-5">
                                                <span className={`text-sm font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '—'}
                                                </span>
                                            </td>
                                            <td className="px-7 py-5 text-right">
                                                <span className="text-sm font-black text-slate-900">{fmt(inv.totalAmount)}</span>
                                            </td>
                                            <td className="px-7 py-5 text-right">
                                                <span className={`text-sm font-bold ${inv.balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {inv.balanceAmount > 0 ? fmt(inv.balanceAmount) : 'Hết nợ'}
                                                </span>
                                            </td>
                                            <td className="px-7 py-5">
                                                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${st.bg} ${st.color} ${st.border} border`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-7 py-5" onClick={e => e.stopPropagation()}>
                                                {inv.vatInvoiceUrl ? (
                                                    <a
                                                        href={inv.vatInvoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-bold text-emerald-600 hover:underline"
                                                    >
                                                        Xem file
                                                    </a>
                                                ) : (
                                                    <label className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                                        Tải lên
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,.pdf"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleUploadVAT(inv.id, file)
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </td>
                                            <td className="px-7 py-5 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedInvoice(inv)}
                                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        Chi tiết
                                                    </button>
                                                    {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                                                        <button
                                                            onClick={() => setPaymentModal(inv)}
                                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        >
                                                            Ghi nhận TT
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-7 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                                <span className="text-4xl opacity-30">📄</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-300 uppercase tracking-widest">Không có hóa đơn</p>
                                            <p className="text-sm text-slate-400 font-medium mt-2">
                                                {searchQuery || statusFilter !== 'ALL' ? 'Thử thay đổi bộ lọc' : 'Chưa có hóa đơn nào được tạo'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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

// ── KPI Card Component ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
    const colors: Record<string, { gradient: string; text: string; subText: string }> = {
        blue: { gradient: 'from-blue-50 to-indigo-50', text: 'text-blue-700', subText: 'text-blue-400' },
        emerald: { gradient: 'from-emerald-50 to-teal-50', text: 'text-emerald-700', subText: 'text-emerald-400' },
        amber: { gradient: 'from-amber-50 to-orange-50', text: 'text-amber-700', subText: 'text-amber-400' },
        rose: { gradient: 'from-rose-50 to-pink-50', text: 'text-rose-700', subText: 'text-rose-400' },
    }
    const c = colors[accent] || colors.blue

    return (
        <div className={`bg-gradient-to-br ${c.gradient} rounded-2xl lg:rounded-3xl p-5 lg:p-7 border border-white/60 shadow-sm hover:shadow-md transition-shadow duration-300`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
            <p className={`text-2xl lg:text-3xl font-black ${c.text} tracking-tight leading-none`}>{value}</p>
            <p className={`text-[11px] font-bold ${c.subText} mt-2`}>{sub}</p>
        </div>
    )
}

// ── Invoice Detail Modal ────────────────────────────────────────────────────────
function InvoiceDetailModal({
    invoice,
    onClose,
    onRecordPayment,
    onCancel,
    onUploadVAT,
}: {
    invoice: Invoice
    onClose: () => void
    onRecordPayment: () => void
    onCancel: () => void
    onUploadVAT: (id: string, file: File) => void
}) {
    const st = getStatus(invoice.status)

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=600')
        if (!printWindow) return

        const itemsHtml = invoice.invoiceItems.map((item, idx) => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;">${idx + 1}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">${item.product?.name || item.description || 'Sản phẩm'}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${new Intl.NumberFormat('vi-VN').format(item.totalPrice)} đ</td>
            </tr>
        `).join('')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Hóa đơn ${invoice.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 40px; color: #1a1a1a; }
                        .header { text-align: center; margin-bottom: 40px; }
                        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
                        .meta { margin-bottom: 30px; display: flex; justify-content: space-between; font-size: 13px; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .table th { text-align: left; background: #f8f8f8; padding: 12px 10px; border-bottom: 2px solid #333; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
                        .summary { text-align: right; margin-top: 20px; font-size: 14px; }
                        .summary .total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
                        .footer { margin-top: 60px; display: flex; justify-content: space-between; text-align: center; }
                        .sign-box { width: 200px; }
                        .sign-box p { font-weight: bold; margin-bottom: 70px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Hóa Đơn</h1>
                        <p>Mã: <strong>${invoice.invoiceNumber}</strong></p>
                    </div>
                    <div class="meta">
                        <div>
                            <strong>SmartBuild Supplier System</strong><br>
                            Loại: ${typeMap[invoice.invoiceType] || invoice.invoiceType}<br>
                            ${invoice.order ? 'Đơn hàng: #' + invoice.order.orderNumber : ''}
                        </div>
                        <div style="text-align:right;">
                            <strong>Ngày phát hành:</strong> ${new Date(invoice.issueDate).toLocaleDateString('vi-VN')}<br>
                            <strong>Hạn TT:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : 'N/A'}<br>
                            <strong>Trạng thái:</strong> ${st.label}
                        </div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th style="width:40px;">STT</th>
                                <th>Mô tả</th>
                                <th style="width:80px;text-align:center;">SL</th>
                                <th style="width:120px;text-align:right;">Đơn giá</th>
                                <th style="width:120px;text-align:right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div class="summary">
                        <div>Tạm tính: ${new Intl.NumberFormat('vi-VN').format(invoice.subtotal)} đ</div>
                        <div>Thuế: ${new Intl.NumberFormat('vi-VN').format(invoice.taxAmount)} đ</div>
                        <div>Chiết khấu: -${new Intl.NumberFormat('vi-VN').format(invoice.discountAmount)} đ</div>
                        <div class="total">Tổng cộng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.totalAmount)}</div>
                    </div>
                    <div class="footer">
                        <div class="sign-box"><p>Người mua hàng</p><span>(Ký, họ tên)</span></div>
                        <div class="sign-box"><p>Người bán hàng</p><span>(Ký, họ tên)</span></div>
                    </div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-7 lg:p-9 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Hóa đơn {invoice.invoiceNumber}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${st.bg} ${st.color} ${st.border} border`}>
                                {st.label}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                {typeMap[invoice.invoiceType] || invoice.invoiceType}
                            </span>
                            {invoice.order?.orderNumber && (
                                <span className="text-xs font-bold text-blue-500">
                                    Đơn #{invoice.order.orderNumber}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-7 lg:p-9">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Items Table (2 cols) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Chi tiết hàng hóa</h3>
                                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SL</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Đơn giá</th>
                                                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoice.invoiceItems.length > 0 ? invoice.invoiceItems.map((item, idx) => (
                                                <tr key={idx} className="bg-white/30">
                                                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{item.product?.name || item.description || 'Sản phẩm'}</td>
                                                    <td className="px-5 py-3.5 text-sm font-black text-slate-900 text-center">x{item.quantity}</td>
                                                    <td className="px-5 py-3.5 text-sm font-medium text-slate-600 text-right">{fmt(item.unitPrice)}</td>
                                                    <td className="px-5 py-3.5 text-sm font-black text-blue-600 text-right">{fmt(item.totalPrice)}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400 font-medium">Không có mặt hàng</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Dates & Notes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thông tin thời gian</p>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Ngày phát hành</span>
                                            <span className="font-bold text-slate-800">{new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Hạn thanh toán</span>
                                            <span className="font-bold text-slate-800">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : '—'}</span>
                                        </div>
                                        {invoice.paymentTerms && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-medium">Điều khoản</span>
                                                <span className="font-bold text-slate-800">{invoice.paymentTerms}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">VAT & Ghi chú</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500 font-medium">Hóa đơn VAT</span>
                                            {invoice.vatInvoiceUrl ? (
                                                <a href={invoice.vatInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:underline">Xem file</a>
                                            ) : (
                                                <label className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                                    Tải lên
                                                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadVAT(invoice.id, f) }} />
                                                </label>
                                            )}
                                        </div>
                                        {invoice.notes && (
                                            <p className="text-sm text-slate-600 italic leading-relaxed">{invoice.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-5">
                            <div className="p-7 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Tổng kết thanh toán</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-slate-400 font-medium">
                                        <span>Tạm tính</span>
                                        <span className="text-slate-200">{fmt(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-400 font-medium">
                                        <span>Thuế</span>
                                        <span className="text-slate-200">{fmt(invoice.taxAmount)}</span>
                                    </div>
                                    {invoice.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-400 font-medium">
                                            <span>Chiết khấu</span>
                                            <span>-{fmt(invoice.discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-slate-800">
                                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Tổng cộng</span>
                                        <span className="text-2xl font-black text-blue-400 break-all">{fmt(invoice.totalAmount)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-800">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-slate-400">Đã thanh toán</span>
                                            <span className="text-emerald-400">{fmt(invoice.paidAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold mt-2">
                                            <span className="text-slate-400">Còn nợ</span>
                                            <span className={invoice.balanceAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                                {invoice.balanceAmount > 0 ? fmt(invoice.balanceAmount) : 'Hết nợ'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            {invoice.totalAmount > 0 && (
                                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ thu</span>
                                        <span className="text-xs font-black text-blue-600">
                                            {Math.round((invoice.paidAmount / invoice.totalAmount) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.totalAmount) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-7 lg:p-9 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                            <button
                                onClick={onCancel}
                                className="px-5 py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                            >
                                Hủy hóa đơn
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            In hóa đơn
                        </button>
                        {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                            <button
                                onClick={onRecordPayment}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
                            >
                                Ghi nhận thanh toán
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Record Payment Modal ────────────────────────────────────────────────────────
function RecordPaymentModal({
    invoice,
    onClose,
    onSuccess,
}: {
    invoice: Invoice
    onClose: () => void
    onSuccess: () => void
}) {
    const [amount, setAmount] = useState(invoice.balanceAmount.toString())
    const [method, setMethod] = useState('BANK_TRANSFER')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amt = parseFloat(amount)
        if (!amt || amt <= 0) {
            toast.error('Số tiền phải lớn hơn 0')
            return
        }
        if (amt > invoice.balanceAmount) {
            toast.error('Số tiền không được vượt quá số nợ còn lại')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/supplier/invoices/record-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    amount: amt,
                    paymentMethod: method,
                    reference,
                    notes,
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã ghi nhận thanh toán thành công')
                onSuccess()
            } else {
                toast.error(data.error || 'Không thể ghi nhận thanh toán')
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-7 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Ghi nhận thanh toán</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">Hóa đơn {invoice.invoiceNumber} · Còn nợ {fmt(invoice.balanceAmount)}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-7 space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Số tiền (VND)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                            placeholder="0"
                            min={0}
                            max={invoice.balanceAmount}
                            step="any"
                            required
                        />
                        <div className="flex gap-2 mt-2">
                            <button type="button" onClick={() => setAmount(invoice.balanceAmount.toString())} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg transition-colors">
                                Toàn bộ
                            </button>
                            <button type="button" onClick={() => setAmount((invoice.balanceAmount / 2).toString())} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg transition-colors">
                                50%
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Phương thức</label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
                        >
                            <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                            <option value="CASH">Tiền mặt</option>
                            <option value="CHECK">Séc</option>
                            <option value="DIGITAL_WALLET">Ví điện tử</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Mã giao dịch (tùy chọn)</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                            placeholder="VD: FT24012345..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ghi chú (tùy chọn)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none"
                            placeholder="Ghi chú thêm..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Cancel Invoice Modal ────────────────────────────────────────────────────────
function CancelInvoiceModal({
    invoice,
    onClose,
    onSuccess,
}: {
    invoice: Invoice
    onClose: () => void
    onSuccess: () => void
}) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCancel = async () => {
        if (!reason.trim()) {
            toast.error('Vui lòng nhập lý do hủy')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/supplier/invoices/cancel', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    reason,
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã hủy hóa đơn')
                onSuccess()
            } else {
                toast.error(data.error || 'Không thể hủy hóa đơn')
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-7 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900">Hủy hóa đơn</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">{invoice.invoiceNumber} · {fmt(invoice.totalAmount)}</p>
                </div>
                <div className="p-7 space-y-5">
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-sm font-bold text-rose-700">Hành động này không thể hoàn tác. Hóa đơn sẽ bị đánh dấu là đã hủy vĩnh viễn.</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Lý do hủy</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
                            placeholder="VD: Phát hành sai thông tin..."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors">
                            Quay lại
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
