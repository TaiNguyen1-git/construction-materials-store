import {
    Package,
    Search,
    LayoutGrid,
    List,
    Filter,
    FileSpreadsheet,
    Download,
    Percent
} from 'lucide-react'

export default function ProductHeader({
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    exportToCSV,
    setIsImporting,
    setIsCreating,
    filterCategory,
    setFilterCategory,
    categories,
    filterStatus,
    setFilterStatus,
    filterStock,
    setFilterStock,
    filteredCount
}: any) {
    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh mục sản phẩm</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-1 opacity-70">Quản lý giá bán và tồn kho thời gian thực.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggles & Search Group */}
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                        <div className="flex bg-slate-100/50 p-1 rounded-xl items-center border border-slate-200/30">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all active:scale-95 ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Chế độ Thẻ (Grid)"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all active:scale-95 ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Chế độ Danh sách (List)"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                className="pl-9 pr-4 py-2 w-48 md:w-64 bg-transparent outline-none text-sm font-medium placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-3 py-2.5 bg-white text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 border border-slate-200 shadow-sm"
                        >
                            <Download className="w-4 h-4 text-blue-600" />
                            <span>Xuất Tệp</span>
                        </button>
                        
                        <button
                            onClick={() => window.location.href = '/supplier/promotions'}
                            className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95 border border-amber-100"
                        >
                            <Percent className="w-4 h-4" />
                            <span>Ưu đãi</span>
                        </button>

                        <button
                            onClick={() => setIsImporting(true)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Nhập File</span>
                        </button>

                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Package className="w-4 h-4" />
                            <span>Thêm mới</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 text-slate-400 font-bold px-3 border-r border-slate-100 pr-5">
                    <Filter className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] uppercase tracking-[0.1em]">Bộ lọc nhanh</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <select 
                        className="px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 font-bold text-[10px] text-slate-600 uppercase tracking-wider"
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Danh mục: Tất cả</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select 
                        className="px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 font-bold text-[10px] text-slate-600 uppercase tracking-wider"
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Trạng thái: Tất cả</option>
                        <option value="ACTIVE">Đang bán</option>
                        <option value="INACTIVE">Ngưng bán</option>
                    </select>

                    <select 
                        className="px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 font-bold text-[10px] text-slate-600 uppercase tracking-wider"
                        value={filterStock}
                        onChange={(e) => { setFilterStock(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="ALL">Kho: Tất cả</option>
                        <option value="OK">Còn hàng (&gt;10)</option>
                        <option value="LOW">Sắp hết (&le;10)</option>
                    </select>
                </div>
                
                <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                    Kết quả: <span className="text-blue-600">{filteredCount}</span>
                </div>
            </div>
        </div>
    )
}
