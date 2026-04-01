import { useState } from 'react'
import { Invoice } from '../types'
import { fmt } from '../utils'
import toast from 'react-hot-toast'

export default function CancelInvoiceModal({
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
                    <p className="text-xs font-bold text-slate-400 mt-1">{invoice.invoiceNumber.replace(/^INV-[A-Z]+-/, '')} · {fmt(invoice.totalAmount)}</p>
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
