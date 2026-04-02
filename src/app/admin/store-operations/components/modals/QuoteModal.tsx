import React from 'react'
import { PlusCircle } from 'lucide-react'
import FormattedNumberInput from '@/components/FormattedNumberInput'

interface QuoteModalProps {
    isOpen: boolean
    onClose: () => void
    quoteForm: {
        customerName: string
        customerPhone: string
        totalAmount: number
        notes: string
    }
    setQuoteForm: (form: any) => void
    onSubmit: (e: React.FormEvent) => void
}

const QuoteModal: React.FC<QuoteModalProps> = ({
    isOpen,
    onClose,
    quoteForm,
    setQuoteForm,
    onSubmit
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><PlusCircle className="text-blue-600" /> Tạo Báo Giá</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    <input 
                        type="text" required 
                        value={quoteForm.customerName} 
                        onChange={e => setQuoteForm({ ...quoteForm, customerName: e.target.value })} 
                        placeholder="Tên khách hàng" 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                    />
                    <input 
                        type="text" 
                        value={quoteForm.customerPhone} 
                        onChange={e => setQuoteForm({ ...quoteForm, customerPhone: e.target.value })} 
                        placeholder="Số điện thoại" 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" 
                    />
                    <FormattedNumberInput 
                        value={quoteForm.totalAmount} 
                        onChange={val => setQuoteForm({ ...quoteForm, totalAmount: val })} 
                        placeholder="Số tiền báo giá" 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-blue-600 text-xl" 
                    />
                    <textarea 
                        value={quoteForm.notes} 
                        onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })} 
                        placeholder="Ghi chú mặt hàng..." 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium" 
                        rows={3} 
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Hủy</button>
                        <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200">Lưu &amp; Gửi</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default QuoteModal
