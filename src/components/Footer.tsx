'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Footer() {
    const pathname = usePathname()

    // Don't show footer on admin pages
    if (pathname?.startsWith('/admin')) {
        return null
    }

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center mb-4">
                            <Package className="h-8 w-8 text-primary-400" />
                            <span className="ml-2 text-xl font-bold">SmartBuild</span>
                        </div>
                        <p className="text-gray-400">
                            Đối tác tin cậy của bạn cho vật liệu xây dựng chất lượng và dịch vụ xuất sắc.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Sản Phẩm</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/products" className="hover:text-white">Xi măng</Link></li>
                            <li><Link href="/products" className="hover:text-white">Thép</Link></li>
                            <li><Link href="/products" className="hover:text-white">Gạch</Link></li>
                            <li><Link href="/products" className="hover:text-white">Công cụ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Công Ty</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="/about" className="hover:text-white">Về chúng tôi</Link></li>
                            <li><Link href="/contact" className="hover:text-white">Liên hệ</Link></li>
                            <li><Link href="#" className="hover:text-white">Tuyển dụng</Link></li>
                            <li><Link href="#" className="hover:text-white">Blog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Hỗ Trợ</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="#" className="hover:text-white">Trung tâm trợ giúp</Link></li>
                            <li><Link href="#" className="hover:text-white">Thông tin vận chuyển</Link></li>
                            <li><Link href="#" className="hover:text-white">Đổi trả hàng</Link></li>
                            <li><Link href="#" className="hover:text-white">Bảo hành</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 SmartBuild. Bản quyền thuộc về SmartBuild.</p>
                </div>
            </div>
        </footer>
    )
}
