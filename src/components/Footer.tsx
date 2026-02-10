'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Footer() {
    const pathname = usePathname()

    // Don't show footer on admin pages, contractor dashboard, or legal/doc pages
    const documentationPaths = ['/terms', '/privacy', '/guidelines', '/help', '/payment-policy', '/standards']
    const hideFooter =
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/supplier') ||
        pathname?.startsWith('/contractor/') && !pathname?.startsWith('/contractors/') ||
        pathname === '/contractor' ||
        documentationPaths.includes(pathname || '')

    if (hideFooter) {
        return null
    }

    return (
        <footer className="bg-slate-900 text-white relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center mb-4 group cursor-default">
                            <div className="p-1.5 bg-primary-500 rounded-lg group-hover:scale-110 transition-transform">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <span className="ml-2 text-lg font-black tracking-tighter uppercase">SmartBuild</span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
                            Hệ thống cung ứng vật tư 4.0. Giải pháp tối ưu chi phí và minh bạch cho mọi công trình xây dựng.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-primary-400 mb-4 uppercase tracking-[0.2em]">Sản Phẩm</h3>
                        <ul className="space-y-2 text-[11px] font-medium text-gray-400">
                            <li><Link href="/products" className="hover:text-primary-400 transition-colors">Vật liệu thô</Link></li>
                            <li><Link href="/products" className="hover:text-primary-400 transition-colors">Vật liệu hoàn thiện</Link></li>
                            <li><Link href="/products" className="hover:text-primary-400 transition-colors">Thiết bị điện nước</Link></li>
                            <li><Link href="/products" className="hover:text-primary-400 transition-colors">Dụng cụ xây dựng</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-primary-400 mb-4 uppercase tracking-[0.2em]">Giải Pháp AI</h3>
                        <ul className="space-y-2 text-[11px] font-medium text-gray-400">
                            <li><Link href="/estimator" className="hover:text-primary-400 transition-colors">Dự toán vật liệu</Link></li>
                            <li><Link href="/contractors" className="hover:text-primary-400 transition-colors">Tìm kiếm thầu thợ</Link></li>
                            <li><Link href="/market" className="hover:text-primary-400 transition-colors">Theo dõi giá thị trường</Link></li>
                            <li><Link href="/account/projects" className="hover:text-primary-400 transition-colors">Quản lý dự án</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-primary-400 mb-4 uppercase tracking-[0.2em]">Hỗ Trợ</h3>
                        <ul className="space-y-2 text-[11px] font-medium text-gray-400">
                            <li><Link href="/about" className="hover:text-primary-400 transition-colors">Về SmartBuild</Link></li>
                            <li><Link href="/contact" className="hover:text-primary-400 transition-colors">Liên hệ chuyên gia</Link></li>
                            <li><Link href="/help" className="hover:text-primary-400 transition-colors">Trung tâm trợ giúp</Link></li>
                            <li><Link href="/help" className="hover:text-primary-400 transition-colors">Hướng dẫn thanh toán</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-orange-400 mb-4 uppercase tracking-[0.2em]">Đối Tác</h3>
                        <ul className="space-y-2 text-[11px] font-medium text-gray-400">
                            <li><Link href="/contractor" className="hover:text-orange-400 transition-colors">Giải pháp Nhà Thầu</Link></li>
                            <li><Link href="/supplier" className="hover:text-blue-400 transition-colors">Giải pháp Nhà Cung Cấp</Link></li>
                            <li><Link href="/contractor/register" className="hover:text-orange-300 transition-colors">Đăng ký Nhà Thầu</Link></li>
                            <li><Link href="/supplier/register" className="hover:text-blue-300 transition-colors">Đăng ký Nhà Cung Cấp</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800/50 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">&copy; 2026 SmartBuild System. Bảo lưu mọi quyền.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">Điều khoản</Link>
                        <Link href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">Bảo mật</Link>
                        <Link href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">Sơ đồ web</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
