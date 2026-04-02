import React from 'react'
import { Coins } from 'lucide-react'
import FormattedNumberInput from '@/components/FormattedNumberInput'

interface ExpenseModalProps {
    isOpen: boolean
    onClose: () => void
    expenseForm: {
        category: string
        amount: number
        description: string
    }
    setExpenseForm: (form: any) => void
    onSubmit: (e: React.FormEvent) => void
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
    isOpen,
    onClose,
    expenseForm,
    setExpenseForm,
    onSubmit
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><Coins className="text-red-500" /> Ghi Chi Phí</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    <select 
                        value={expenseForm.category} 
                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold"
                    >
                        <option value="FUEL">Xăng dầu</option>
                        <option value="MAINTENANCE">Sửa chữa xe</option>
                        <option value="MEALS">Cơm nước/Bốc xếp</option>
                        <option value="OTHERS">Khác</option>
                    </select>
                    <FormattedNumberInput 
                        value={expenseForm.amount} 
                        onChange={val => setExpenseForm({ ...expenseForm, amount: val })} 
                        placeholder="Số tiền chi" 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-red-500 text-xl" 
                    />
                    <input 
                        type="text" required 
                        value={expenseForm.description} 
                        onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} 
                        placeholder="Diễn giải chi phí" 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium" 
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Hủy</button>
                        <button type="submit" className="flex-[2] py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-200">Xác Nhận Chi</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ExpenseModal
