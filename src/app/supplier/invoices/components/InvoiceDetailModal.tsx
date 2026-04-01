import { X } from 'lucide-react'
import { Invoice } from '../types'
import { fmt, getStatus, typeMap } from '../utils'

export default function InvoiceDetailModal({
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
                        <p>Mã: <strong>${invoice.invoiceNumber.replace(/^INV-[A-Z]+-/, '')}</strong></p>
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
                            Hóa đơn {invoice.invoiceNumber.replace(/^INV-[A-Z]+-/, '')}
                        </h2>
                        {invoice.customer && (
                            <p className="text-sm font-bold text-slate-500 mt-1.5 flex items-center gap-1.5">
                                Đối tác: <span className="text-slate-800">{invoice.customer.companyName || invoice.customer.user?.name || 'Khách hàng'}</span>
                            </p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
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
