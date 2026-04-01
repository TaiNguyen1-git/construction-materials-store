import { useState } from 'react'
import { X } from 'lucide-react'
import { Invoice } from '../types'
import { fmt } from '../utils'
import toast from 'react-hot-toast'

export default function RecordPaymentModal({
    invoice,
    onClose,
    onSuccess,
}: {
    invoice: Invoice
    onClose: () => void
    onSuccess: () => void
}) {
    const [amountInput, setAmountInput] = useState(new Intl.NumberFormat('vi-VN').format(Math.round(invoice.balanceAmount)))
    const [method, setMethod] = useState('BANK_TRANSFER')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const rawAmt = amountInput.replace(/\D/g, '')
        const amt = parseFloat(rawAmt)
        const maxAmt = Math.round(invoice.balanceAmount)
        
        if (!amt || amt <= 0) {
            toast.error('Số tiền phải lớn hơn 0')
            return
        }
        if (amt > maxAmt + 1) { // allow a +1 rounding error margin just in case
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
                        <p className="text-xs font-bold text-slate-400 mt-1">
                            Hóa đơn {invoice.invoiceNumber.replace(/^INV-[A-Z]+-/, '')} 
                            {invoice.customer && ` · Đối tác: ${invoice.customer.companyName || invoice.customer.user?.name || 'Khách hàng'}`} 
                            {' '}· Còn nợ <span className="text-emerald-600">{fmt(invoice.balanceAmount)}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-7 space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Số tiền (VND)</label>
                        <input
                            type="text"
                            value={amountInput}
                            onChange={e => {
                                const raw = e.target.value.replace(/\D/g, '')
                                setAmountInput(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '')
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-mono"
                            placeholder="0"
                            required
                        />
                        <div className="flex gap-2 mt-2">
                            <button type="button" onClick={() => setAmountInput(new Intl.NumberFormat('vi-VN').format(Math.round(invoice.balanceAmount)))} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg transition-colors">
                                Toàn bộ
                            </button>
                            <button type="button" onClick={() => setAmountInput(new Intl.NumberFormat('vi-VN').format(Math.round(invoice.balanceAmount / 2)))} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-lg transition-colors">
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
