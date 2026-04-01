import {
    Package,
    Search,
    LayoutGrid,
    List,
    Filter,
    FileSpreadsheet,
    Download
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
        <div className="space-y-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Danh mục sản phẩm</h1>
                    <p className="text-slate-500 font-medium mt-1">Quản lý giá bán và tồn kho thời gian thực.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex bg-slate-100/80 p-1.5 rounded-2xl items-center border border-slate-200/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-[0.8rem] transition-all hover:scale-105 active:scale-95 ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                            title="Chế độ Thẻ con (Grid)"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-[0.8rem] transition-all hover:scale-105 active:scale-95 ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                            title="Chế độ Bảng tính (List)"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, SKU..."
                            className="pl-12 pr-6 py-3 w-72 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all shadow-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 border border-slate-200 shadow-sm"
                        title="Xuất Bảng Giá"
                    >
                        <Download className="w-5 h-5 text-blue-600" />
                        <span className="hidden lg:inline">Xuất Tệp</span>
                    </button>
                    <button
                        onClick={() => setIsImporting(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-200 transition-all active:scale-95 border border-emerald-200"
                        title="Nhập hàng loạt bằng Excel"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="hidden lg:inline">Nhập File</span>
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Package className="w-5 h-5" />
                        <span>Thêm mới</span>
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 font-bold px-2 border-r border-slate-200 pr-4">
                    <Filter className="w-5 h-5 text-blue-500" />
                    <span>Bộ lọc:</span>
                </div>
                
                <select 
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 min-w-[180px]"
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                >
                    <option value="ALL">Tất cả danh mục</option>
                    {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select 
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 min-w-[160px]"
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngưng bán</option>
                </select>

                <select 
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 min-w-[160px]"
                    value={filterStock}
                    onChange={(e) => { setFilterStock(e.target.value); setCurrentPage(1); }}
                >
                    <option value="ALL">Tình trạng kho</option>
                    <option value="OK">Kho dồi dào (&gt;10)</option>
                    <option value="LOW">Sắp rỗng (&le;10)</option>
                </select>
                
                <div className="ml-auto text-sm font-bold text-slate-500 px-4">
                    Tìm thấy <span className="text-blue-600 px-1">{filteredCount}</span> kết quả
                </div>
            </div>
        </div>
    )
}
