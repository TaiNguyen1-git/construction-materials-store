export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-[4px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold animate-pulse">Đang tải hồ sơ chuyên gia...</p>
            </div>
        </div>
    )
}
