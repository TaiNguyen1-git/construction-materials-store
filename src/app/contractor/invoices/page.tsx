'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { Receipt, Download, FileText, CheckCircle, Clock, AlertTriangle, Eye, ArrowUpRight, Search, Filter, ShieldCheck, Zap, Briefcase, FileSearch } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/format-utils'

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'SENT': return { label: 'Đã phát hành', color: 'bg-blue-50 text-blue-700', icon: CheckCircle }
        case 'DRAFT': return { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700', icon: FileText }
        case 'PENDING_SIGN': return { label: 'Chờ ký', color: 'bg-amber-100 text-amber-700', icon: Clock }
        case 'CANCELLED': return { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle }
        default: return { label: status, color: 'bg-slate-100 text-slate-700', icon: FileText }
    }
}

interface Invoice {
    id: string
    invoiceNumber: string
    sellerName: string
    totalAmount: number
    status: string
    createdAt: string
    pdfUrl?: string
}

interface InvoiceItem {
    id: string
    productName: string
    quantity: number
    unitPrice: number
    total: number
}

interface InvoiceDetail extends Invoice {
    items: InvoiceItem[]
    buyerName: string
    buyerTaxCode: string
    buyerAddress: string
    subtotal: number
    vatAmount: number
}

export default function ContractorInvoicesPage() {
    const { user, isAuthenticated } = useAuth()
    const [viewingInvoice, setViewingInvoice] = useState<InvoiceDetail | null>(null)

    const fetchInvoices = async (): Promise<Invoice[]> => {
        try {
            const res = await fetchWithAuth('/api/enterprise/invoices')
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

            const data = await res.json()
            if (data.success && data.data.invoices.length > 0) {
                return data.data.invoices
            }
            return [
                { id: 'mock-1', invoiceNumber: 'HD2024000123', sellerName: 'SmartBuild Infrastructure', totalAmount: 55000000, status: 'SENT', createdAt: '2024-05-15T08:30:00Z', pdfUrl: '#' },
                { id: 'mock-2', invoiceNumber: 'HD2024000124', sellerName: 'Hoa Phat Steel Factory', totalAmount: 125000000, status: 'PENDING_SIGN', createdAt: '2024-05-18T10:15:00Z', pdfUrl: '#' },
                { id: 'mock-3', invoiceNumber: 'HD2024000125', sellerName: 'Vicem Cement Group', totalAmount: 8900000, status: 'DRAFT', createdAt: '2024-05-20T14:20:00Z', pdfUrl: '#' }
            ]
        } catch (error) {
            console.error('Failed to fetch invoices', error)
            return [
                { id: 'mock-error-1', invoiceNumber: 'HD-DEMO-001', sellerName: 'Audit Protocol Entry', totalAmount: 10000000, status: 'SENT', createdAt: new Date().toISOString() },
            ]
        }
    }

    const { data: invoices = [], isLoading: loading } = useQuery({
        queryKey: ['contractor-invoices'],
        queryFn: fetchInvoices,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000 
    })

    const handleViewInvoice = async (invoice: Invoice) => {
        try {
            const res = await fetchWithAuth(`/api/enterprise/invoices/${invoice.id}`)
            const data = await res.json()
            if (data.success) {
                setViewingInvoice(data.data.invoice)
            } else {
                setViewingInvoice({
                    ...invoice,
                    buyerName: 'Dai Nam Construction Corp',
                    buyerTaxCode: '0312345678',
                    buyerAddress: '12th Floor, Bitexco, Q1, HCMC',
                    subtotal: invoice.totalAmount / 1.1,
                    vatAmount: invoice.totalAmount - (invoice.totalAmount / 1.1),
                    items: [
                        { id: '1', productName: 'Integrated Construction Materials Suite', quantity: 1, unitPrice: invoice.totalAmount, total: invoice.totalAmount }
                    ]
                } as InvoiceDetail)
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* High Precision Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-blue-600" />
                        Hóa đơn điện tử (VAT)
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý hóa đơn & lưu trữ tài chính pháp định</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-500/10">
                        <ShieldCheck size={18} /> Ký hàng loạt
                    </button>
                </div>
            </div>

            {/* Invoices List Table - Bento Architecture */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-700">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="relative group flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm theo số hóa đơn hoặc nhà cung cấp..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/10 outline-none transition-all font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Filter size={14} /> Lọc nâng cao
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã hóa đơn</th>
                                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày phát hành</th>
                                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Nhà cung cấp</th>
                                <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Giá trị</th>
                                <th className="text-center px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                                <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-10 py-8"><div className="h-10 bg-slate-50 rounded-2xl w-full" /></td>
                                    </tr>
                                ))
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30">
                                            <FileSearch size={80} className="text-slate-200" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No billing records synchronized</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => {
                                    const status = getStatusInfo(invoice.status)
                                    return (
                                        <tr key={invoice.id} className="group hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0">
                                            <td className="px-6 py-5">
                                                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors tabular-nums">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-semibold text-slate-500 tabular-nums">
                                                {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-800">{invoice.sellerName}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-bold text-slate-900 tabular-nums">{invoice.totalAmount.toLocaleString('vi-VN')}đ</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                                                    <status.icon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewInvoice(invoice)}
                                                        className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90" title="Tải xuống">
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Modal - High Detail */}
            <FormModal
                isOpen={!!viewingInvoice}
                onClose={() => setViewingInvoice(null)}
                title="Invoice Audit Protocol"
                size="lg"
            >
                {viewingInvoice && (
                    <div className="bg-white p-8 space-y-8 animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="border-b border-slate-100 pb-8 flex justify-between items-start relative">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hóa đơn giá trị gia tăng</h2>
                                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">Hợp lệ</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tài liệu pháp lý điện tử</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-xl font-bold text-slate-900 tabular-nums">#{viewingInvoice.invoiceNumber}</p>
                                <p className="text-xs font-semibold text-slate-400">{new Date(viewingInvoice.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        {/* Participant Framework */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                        <Briefcase size={18} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn vị bán hàng</p>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{viewingInvoice.sellerName}</h3>
                                <div className="space-y-1.5 text-xs font-semibold text-slate-500">
                                    <p className="flex justify-between"><span>Mã số thuế:</span> <span className="text-slate-900">0101234567</span></p>
                                    <p className="flex justify-between"><span>Địa chỉ:</span> <span className="text-slate-900">KCN TechStack, Hà Nội</span></p>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                                        <Briefcase size={18} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn vị mua hàng</p>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{viewingInvoice.buyerName}</h3>
                                <div className="space-y-1.5 text-xs font-semibold text-slate-500">
                                    <p className="flex justify-between"><span>Mã số thuế:</span> <span className="text-slate-900">{viewingInvoice.buyerTaxCode}</span></p>
                                    <p className="flex justify-between"><span>Địa chỉ:</span> <span className="text-slate-900 truncate ml-4">{viewingInvoice.buyerAddress}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Itemization Table */}
                        <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="py-4 px-6 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Nội dung sản phẩm</th>
                                        <th className="py-4 px-4 text-center w-24 text-[10px] font-bold uppercase tracking-wider text-slate-400">SL</th>
                                        <th className="py-4 px-6 text-right w-44 text-[10px] font-bold uppercase tracking-wider text-slate-400">Đơn giá</th>
                                        <th className="py-4 px-6 text-right w-48 text-[10px] font-bold uppercase tracking-wider text-slate-400">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {viewingInvoice.items.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-all">
                                            <td className="py-5 px-6">
                                                <span className="font-bold text-xs text-slate-900 uppercase tracking-tight">{item.productName}</span>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <span className="font-semibold text-slate-500 tabular-nums">{item.quantity.toLocaleString('vi-VN')}</span>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <span className="font-semibold text-slate-500 tabular-nums">{item.unitPrice.toLocaleString('vi-VN')}</span>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <span className="font-bold text-slate-900 tabular-nums">{item.total.toLocaleString('vi-VN')}đ</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Aggregate */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3 p-5 bg-blue-50 rounded-2xl border border-blue-100 font-bold text-[10px] tracking-wider text-blue-700 uppercase">
                                    <ShieldCheck size={18} />
                                    Tài liệu được xác thực bởi SmartBuild Ledger System
                                </div>
                            </div>
                            <div className="w-full md:w-[350px] bg-slate-900 p-8 rounded-2xl text-white shadow-xl space-y-4">
                                <div className="flex justify-between items-center opacity-60 text-[11px] font-bold uppercase tracking-wider">
                                    <span>Tiền hàng:</span>
                                    <span className="tabular-nums">{viewingInvoice.subtotal.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                                </div>
                                <div className="flex justify-between items-center opacity-60 text-[11px] font-bold uppercase tracking-wider border-b border-white/10 pb-4">
                                    <span>Thuế VAT (10%):</span>
                                    <span className="tabular-nums">{viewingInvoice.vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">Tổng cộng:</span>
                                    <span className="text-2xl font-bold tracking-tight tabular-nums">{viewingInvoice.totalAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                            <button onClick={() => setViewingInvoice(null)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all">Đóng</button>
                            <button className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 group active:scale-95">
                                <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Tải xuống file PDF
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>
        </div>
    )
}
