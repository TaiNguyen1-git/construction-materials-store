import { X, Loader2, FileSpreadsheet } from 'lucide-react'

export default function BulkImportModal({
    isImporting,
    setIsImporting,
    isProcessingImport,
    handleBulkImport,
    importLog
}: any) {
    if (!isImporting) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessingImport && setIsImporting(false)} />
            <div className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">Nhập Excel Hàng Loạt</h2>
                    <button disabled={isProcessingImport} onClick={() => setIsImporting(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Tải lên file dữ liệu <span className="font-bold text-slate-800">CSV</span> với các cột bắt buộc:
                        <br />
                        <span className="font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 mt-2 inline-block">1. Tên sản phẩm</span>, <span className="font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 mt-2 inline-block">2. SKU</span>, <span className="font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 mt-2 inline-block">3. ID Danh mục</span>, <span className="font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 mt-2 inline-block">4. Giá bán</span>, <span className="font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 mt-2 inline-block">5. Số lượng</span>
                    </p>
                    
                    <div className="relative border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-[1.5rem] p-10 flex flex-col items-center justify-center group hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer shadow-inner">
                        <FileSpreadsheet className="w-12 h-12 text-emerald-400 mb-4 group-hover:scale-110 group-hover:text-emerald-500 transition-all" />
                        <span className="font-bold text-emerald-700 text-center">Bấm để tải file lên (Định dạng .csv)</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv" onChange={handleBulkImport} disabled={isProcessingImport} />
                    </div>

                    {isProcessingImport && (
                        <div className="flex flex-col items-center justify-center text-blue-600 py-4 animate-in fade-in">
                            <Loader2 className="w-10 h-10 animate-spin mb-3 shadow-blue-100 rounded-full" />
                            <span className="font-black uppercase tracking-widest text-[10px] bg-blue-50 px-3 py-1.5 rounded-lg">Đang nạp dữ liệu vào kho...</span>
                        </div>
                    )}

                    {(importLog.success > 0 || importLog.failed > 0) && (
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-center gap-8 justify-center mt-4">
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-4xl font-black text-emerald-500 drop-shadow-sm">{importLog.success}</span>
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Thành công</span>
                            </div>
                            <div className="h-12 w-px bg-slate-200" />
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-4xl font-black text-rose-500 drop-shadow-sm">{importLog.failed}</span>
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Thất bại</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
