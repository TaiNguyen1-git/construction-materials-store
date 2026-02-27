'use client'

import React from 'react'
import { Edit, Trash2, CheckCircle } from 'lucide-react'
import { Expense, formatCurrency } from '../types'

interface ExpensesTabProps {
    expenses: Expense[]
}

export default function ExpensesTab({ expenses }: ExpensesTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-6 bg-red-500 rounded-full shadow-lg shadow-red-500/20" />
                    Danh mục chi phí trong ngày
                </h3>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/50">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-100/60 font-bold">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung chi tiết</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {expenses.map(ex => (
                            <tr key={ex.id} className="group hover:bg-red-50/20 transition-all">
                                <td className="px-8 py-6">
                                    <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-red-100 shadow-sm shadow-red-500/5">
                                        {ex.category}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-slate-600">{ex.description}</td>
                                <td className="px-8 py-6 text-right">
                                    <p className="text-lg font-black text-slate-900 tracking-tighter">{formatCurrency(ex.amount)}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100" title="Chỉnh sửa">
                                            <Edit className="w-4.5 h-4.5" />
                                        </button>
                                        <button className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100" title="Xóa bỏ">
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                        <div className="p-5 bg-slate-50 rounded-full">
                                            <Trash2 className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Chưa có chi phí nào phát sinh</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-600/5 rounded-[32px] p-8 border border-blue-100 border-dashed flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-black text-blue-600/60 uppercase tracking-widest">Tổng chi phí hôm nay</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter italic">
                        {formatCurrency(expenses.reduce((a, b) => a + b.amount, 0))}
                    </p>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-50">
                    <CheckCircle className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
            </div>
        </div>
    )
}
