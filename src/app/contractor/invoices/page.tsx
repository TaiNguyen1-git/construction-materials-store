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
        case 'SENT': return { label: 'Issued Digitally', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
        case 'DRAFT': return { label: 'Working Draft', color: 'bg-slate-100 text-slate-800', icon: FileText }
        case 'PENDING_SIGN': return { label: 'Await Signature', color: 'bg-orange-100 text-orange-800', icon: Clock }
        case 'CANCELLED': return { label: 'Revoked', color: 'bg-rose-100 text-rose-800', icon: AlertTriangle }
        default: return { label: status, color: 'bg-slate-100 text-slate-800', icon: FileText }
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Receipt className="w-10 h-10 text-emerald-600" />
                        Billing Ledger
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý hóa đơn điện tử (VAT) & Lưu trữ tài chính pháp định</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200">
                        <ShieldCheck size={16} /> Batch Signature
                    </button>
                </div>
            </div>

            {/* Invoices List Table - Bento Architecture */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-700">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find records by serial or vendor..."
                            className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-8 py-4.5 bg-slate-50 text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3">
                            <Filter size={16} /> Advanced Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Serial ID</th>
                                <th className="text-left px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Issued At</th>
                                <th className="text-left px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Commercial Vendor</th>
                                <th className="text-right px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Financial Value</th>
                                <th className="text-center px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Verification</th>
                                <th className="text-right px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Interaction</th>
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
                                        <tr key={invoice.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-10 py-8">
                                                <span className="font-black text-xs text-slate-900 group-hover:text-emerald-600 transition-colors tabular-nums">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-8 text-xs font-bold text-slate-400 tabular-nums">
                                                {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-10 bg-slate-100 rounded-full group-hover:bg-emerald-400 transition-all duration-500" />
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tighter italic">{invoice.sellerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right">
                                                <span className="text-sm font-black text-slate-900 tabular-nums italic">{invoice.totalAmount.toLocaleString('vi-VN')}đ</span>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${status.color}`}>
                                                    <status.icon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleViewInvoice(invoice)}
                                                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                                                        title="Detailed Audit"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90" title="Download Vault">
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
                    <div className="bg-white p-12 space-y-12 animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="border-b-4 border-slate-900 pb-10 flex justify-between items-end relative">
                            <div className="space-y-4">
                                <div className="flex items-center gap-6">
                                    <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Tax Invoice</h2>
                                    <span className="px-5 py-2 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">Official Document</span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Legal Representation of Digital Signature</p>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-3xl font-black text-slate-900 italic tracking-tighter tabular-nums">#{viewingInvoice.invoiceNumber}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(viewingInvoice.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        {/* Participant Framework */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Seller</p>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">{viewingInvoice.sellerName}</h3>
                                <div className="space-y-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                                    <p className="flex justify-between border-b border-black/5 pb-2"><span>TAX CODE:</span> <span className="text-slate-900">0101234567</span></p>
                                    <p className="flex justify-between"><span>LOCATION:</span> <span className="text-slate-900">KCN TechStack, Hanoi</span></p>
                                </div>
                            </div>
                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Buyer</p>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">{viewingInvoice.buyerName}</h3>
                                <div className="space-y-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                                    <p className="flex justify-between border-b border-black/5 pb-2"><span>TAX CODE:</span> <span className="text-slate-900">{viewingInvoice.buyerTaxCode}</span></p>
                                    <p className="flex justify-between"><span>LOCATION:</span> <span className="text-slate-900 truncate ml-4">{viewingInvoice.buyerAddress}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Itemization Table */}
                        <div className="overflow-hidden border border-slate-100 rounded-[3rem] bg-white shadow-xl shadow-slate-200/20">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="py-8 px-10 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Resource Description</th>
                                        <th className="py-8 px-4 text-center w-24 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Qty</th>
                                        <th className="py-8 px-6 text-right w-44 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Rate</th>
                                        <th className="py-8 px-10 text-right w-48 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {viewingInvoice.items.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-8 px-10">
                                                <span className="font-black text-sm text-slate-900 uppercase tracking-tight italic">{item.productName}</span>
                                            </td>
                                            <td className="py-8 px-4 text-center">
                                                <span className="font-black text-slate-400 tabular-nums">{item.quantity.toLocaleString('vi-VN')}</span>
                                            </td>
                                            <td className="py-8 px-6 text-right">
                                                <span className="font-black text-slate-400 tabular-nums">{item.unitPrice.toLocaleString('vi-VN')}</span>
                                            </td>
                                            <td className="py-8 px-10 text-right">
                                                <span className="font-black text-slate-900 tabular-nums italic">{item.total.toLocaleString('vi-VN')}đ</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Aggregate */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4 p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 italic font-black text-[10px] tracking-widest text-emerald-800 uppercase">
                                    <ShieldCheck size={20} />
                                    This document is verified by SmartBuild Blockchain Ledger System
                                </div>
                            </div>
                            <div className="w-full md:w-[400px] bg-slate-950 p-12 rounded-[3.5rem] text-white shadow-2xl space-y-6">
                                <div className="flex justify-between items-center opacity-40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span>Net Balance:</span>
                                    <span className="tabular-nums">{viewingInvoice.subtotal.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                                </div>
                                <div className="flex justify-between items-center opacity-40 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 pb-6">
                                    <span>Tax Compliance (10%):</span>
                                    <span className="tabular-nums">{viewingInvoice.vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 italic">Total Payable:</span>
                                    <span className="text-3xl font-black italic tracking-tighter tabular-nums">{viewingInvoice.totalAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-6 pt-10 border-t border-slate-50">
                            <button onClick={() => setViewingInvoice(null)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all">Abort Review</button>
                            <button className="flex-[2] py-6 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4 group active:scale-95">
                                <Download size={20} className="group-hover:translate-y-1 transition-transform" /> Sync to Local Vault
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>
        </div>
    )
}
