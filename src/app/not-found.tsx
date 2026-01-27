
import Link from 'next/link'
import { HardHat, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">

                {/* Illustration */}
                <div className="relative mx-auto w-64 h-64">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-50 blur-3xl"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 border border-blue-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <HardHat className="w-full h-full text-blue-600 stroke-1" />
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-0 right-0 bg-yellow-400 p-3 rounded-xl shadow-lg animate-bounce delay-100">
                        <span className="text-2xl font-black text-yellow-900">404</span>
                    </div>
                    <div className="absolute bottom-0 left-0 bg-red-500 p-3 rounded-xl shadow-lg animate-bounce delay-300">
                        <span className="text-xl font-black text-white">Oops!</span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Không Tìm Thấy Trang Này
                    </h1>
                    <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
                        Có vẻ như trang bạn đang tìm kiếm đã bị di dời hoặc không tồn tại. Giống như một công trình chưa hoàn thiện vậy!
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Home size={20} />
                        Về Trang Chủ
                    </Link>
                    <Link
                        href="/products"
                        className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 hover:border-blue-200 transition-all"
                    >
                        <Search size={20} />
                        Tìm Sản Phẩm
                    </Link>
                </div>

                {/* Footer Helper */}
                <p className="text-xs text-slate-400 font-medium">
                    Mã lỗi: 404_PAGE_NOT_FOUND • SmartBuild System
                </p>
            </div>
        </div>
    )
}
