'use client'

import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Expense, formatCurrency } from '../types'

interface ExpensesTabProps {
    expenses: Expense[]
}

export default function ExpensesTab({ expenses }: ExpensesTabProps) {
    return (
        <div className="overflow-x-auto rounded-[32px] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {expenses.map(ex => (
                        <tr key={ex.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5">
                                <span className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase">{ex.category}</span>
                            </td>
                            <td className="px-6 py-5 text-slate-600 font-medium">{ex.description}</td>
                            <td className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(ex.amount)}</td>
                            <td className="px-6 py-5">
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Sửa">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic">Chưa ghi nhận chi phí nào hôm nay.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
