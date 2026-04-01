import { FileText, UploadCloud } from 'lucide-react'
import { Invoice } from '../types'
import { fmt, getStatus, typeMap } from '../utils'

export default function InvoiceTable({
    filtered,
    searchQuery,
    statusFilter,
    setSelectedInvoice,
    handleUploadVAT,
    setPaymentModal,
}: {
    filtered: Invoice[]
    searchQuery: string
    statusFilter: string
    setSelectedInvoice: (inv: Invoice) => void
    handleUploadVAT: (id: string, file: File) => void
    setPaymentModal: (inv: Invoice) => void
}) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Số hóa đơn</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Loại</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Thời gian</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right whitespace-nowrap">Tổng tiền</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right whitespace-nowrap">Còn nợ</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Trạng thái</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Thao tác</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-black text-blue-600 text-[13px] tracking-tight">{inv.invoiceNumber.replace(/^INV-[A-Z]+-/, '')}</span>
                                            {inv.order?.orderNumber && (
                                                <div className="text-[10px] font-bold text-slate-400 mt-0.5">Đơn #{inv.order.orderNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[11px] font-bold text-slate-600">{typeMap[inv.invoiceType] || inv.invoiceType}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-[13px] font-bold text-slate-700">{new Date(inv.issueDate).toLocaleDateString('vi-VN')}</div>
                                            <div className={`text-[11px] font-medium mt-0.5 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                                Hạn: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-[13px] font-black text-slate-900">{fmt(inv.totalAmount)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className={`text-[13px] font-bold ${inv.balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {inv.balanceAmount > 0 ? fmt(inv.balanceAmount) : 'Hết nợ'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${st.bg} ${st.color} ${st.border} border`}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                {inv.vatInvoiceUrl ? (
                                                    <a
                                                        href={inv.vatInvoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Xem hóa đơn VAT"
                                                        className="w-7 h-7 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : (
                                                    <label title="Tải lên hóa đơn VAT" className="w-7 h-7 flex items-center justify-center cursor-pointer bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all">
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,.pdf"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleUploadVAT(inv.id, file)
                                                            }}
                                                        />
                                                        <UploadCloud className="w-3.5 h-3.5" />
                                                    </label>
                                                )}
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
                                                        Ghi nhận
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-32 text-center">
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
    )
}
