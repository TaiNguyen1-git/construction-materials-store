import { AlertCircle, Search, X, Filter, Calendar, Loader2, Banknote } from 'lucide-react'

interface UnpaidTransactionsTableProps {
    filteredTransactions: any[]
    searchTerm: string
    setSearchTerm: (val: string) => void
    isFilterOpen: boolean
    setIsFilterOpen: (val: boolean) => void
    reconcilingId: string | null
    handleReconcile: (id: string, number: string) => void
    formatCurrency: (amount: number) => string
}

export default function UnpaidTransactionsTable({
    filteredTransactions,
    searchTerm,
    setSearchTerm,
    isFilterOpen,
    setIsFilterOpen,
    reconcilingId,
    handleReconcile,
    formatCurrency,
}: UnpaidTransactionsTableProps) {
    return (
        <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Đơn hàng chờ quyết toán</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách các khoản tiền hệ thống đang treo</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl transition-all duration-300 px-3 w-64 focus-within:border-emerald-400 focus-within:shadow-md focus-within:ring-2 focus-within:ring-emerald-50">
                        <Search className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn (PO)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ml-2 bg-transparent border-none outline-none text-sm w-full font-medium h-10"
                        />
                        {searchTerm && <X className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-pointer" onClick={() => setSearchTerm('')} />}
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-10 h-10 flex items-center justify-center bg-white border rounded-xl transition-all shadow-sm ${isFilterOpen ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 hover:text-emerald-600'}`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filter Dropdown */}
            {isFilterOpen && (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-4">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest w-full">Lọc nhanh theo trạng thái</span>
                        {['Tất cả', 'Đã giao hàng', 'Chờ xác nhận'].map((f) => (
                            <button
                                key={f}
                                className={`px-4 py-2 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-all ${f === 'Tất cả' ? 'border-emerald-400 text-emerald-600' : ''}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Đơn hàng (PO)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Ngày tạo</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Doanh thu (VNĐ)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx: any, idx: number) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-6 font-black text-blue-600 text-lg">#{tx.orderNumber}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                <Calendar className="w-4 h-4 text-slate-300" />
                                                {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-lg font-black text-emerald-600">
                                                {formatCurrency(tx.totalAmount)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button
                                                onClick={() => handleReconcile(tx.id, tx.orderNumber)}
                                                disabled={reconcilingId === tx.id}
                                                className="min-w-[120px] px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {reconcilingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Đối soát'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center grayscale opacity-10">
                                        <div className="flex flex-col items-center">
                                            <Banknote className="w-20 h-20 mb-4" />
                                            <p className="text-xl font-black uppercase tracking-[0.4em] text-slate-400">Không có doanh thu chờ</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
