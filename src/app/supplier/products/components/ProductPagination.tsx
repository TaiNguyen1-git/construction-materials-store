import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProductPagination({
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems
}: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: (p: number) => void;
    totalItems: number;
}) {
    if (totalItems === 0 || totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-8">
            <p className="text-sm font-bold text-slate-500">
                Hiển thị trang <span className="text-blue-600">{currentPage}</span> / {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 transition-all font-bold"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-blue-600'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 transition-all font-bold"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
