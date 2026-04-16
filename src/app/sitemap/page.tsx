import Link from 'next/link'
import { 
    Package, 
    Zap, 
    Clock, 
    ShieldCheck, 
    Briefcase, 
    ShoppingBag, 
    Cpu, 
    Users, 
    HelpCircle, 
    FileText, 
    Search,
    ChevronRight,
    Map
} from 'lucide-react'

export const metadata = {
    title: 'Sơ đồ trang web | SmartBuild',
    description: 'Tổng hợp tất cả các liên kết và phân hệ chức năng trên hệ thống SmartBuild Construction Materials.',
}

export default function SitemapPage() {
    const sections = [
        {
            title: 'Sản Phẩm & Thương Mại',
            icon: <ShoppingBag className="w-5 h-5 text-blue-500" />,
            color: 'bg-blue-50',
            links: [
                { name: 'Tất cả sản phẩm', href: '/products' },
                { name: 'Vật liệu thô & Xây dựng', href: '/products?category=raw' },
                { name: 'Vật liệu hoàn thiện', href: '/products?category=finish' },
                { name: 'Thiết bị & Phụ kiện điện', href: '/products?category=electric' },
                { name: 'Thiết bị nước & Vệ sinh', href: '/products?category=plumbing' },
                { name: 'Thanh toán & Đơn hàng', href: '/account/orders' },
            ]
        },
        {
            title: 'Công Cụ & Giải Pháp AI',
            icon: <Cpu className="w-5 h-5 text-indigo-500" />,
            color: 'bg-indigo-50',
            links: [
                { name: 'Dự toán vật liệu AI', href: '/estimator' },
                { name: 'Theo dõi giá thị trường', href: '/market' },
                { name: 'So sánh sản phẩm', href: '/comparison' },
                { name: 'Tìm kiếm thầu thợ', href: '/contractors' },
                { name: 'Đấu thầu dự án', href: '/market/projects' },
            ]
        },
        {
            title: 'Dành Cho Đối Tác',
            icon: <Users className="w-5 h-5 text-amber-500" />,
            color: 'bg-amber-50',
            links: [
                { name: 'Cổng Nhà Thầu (Contractor)', href: '/contractor' },
                { name: 'Cổng Nhà Cung Cấp (Supplier)', href: '/supplier' },
                { name: 'Đăng ký Nhà Thầu', href: '/contractor/register' },
                { name: 'Đăng ký Nhà Cung Cấp', href: '/supplier/register' },
                { name: 'Quản lý kho hàng (Supplier)', href: '/supplier/inventory' },
            ]
        },
        {
            title: 'Hỗ Trợ & Thông Tin',
            icon: <HelpCircle className="w-5 h-5 text-emerald-500" />,
            color: 'bg-emerald-50',
            links: [
                { name: 'Trung tâm trợ giúp', href: '/help' },
                { name: 'Tin tức & Blog', href: '/blog' },
                { name: 'Về SmartBuild', href: '/about' },
                { name: 'Liên hệ chuyên gia', href: '/contact' },
                { name: 'Báo cáo vi phạm', href: '/report' },
            ]
        },
        {
            title: 'Pháp Lý & Chính Sách',
            icon: <ShieldCheck className="w-5 h-5 text-slate-500" />,
            color: 'bg-slate-50',
            links: [
                { name: 'Điều khoản sử dụng', href: '/terms' },
                { name: 'Chính sách bảo mật', href: '/privacy' },
                { name: 'Quy chuẩn cộng đồng', href: '/standards' },
                { name: 'Chính sách thanh toán', href: '/payment-policy' },
                { name: 'Hướng dẫn sử dụng', href: '/guidelines' },
            ]
        },
        {
            title: 'Tài Khoản & Cá Nhân',
            icon: <Zap className="w-5 h-5 text-rose-500" />,
            color: 'bg-rose-50',
            links: [
                { name: 'Hồ sơ cá nhân', href: '/account' },
                { name: 'Dự án của tôi', href: '/account/projects' },
                { name: 'Danh sách yêu thích', href: '/wishlist' },
                { name: 'Tin nhắn hỗ trợ', href: '/account/tickets' },
                { name: 'Ví điện tử', href: '/account/wallet' },
            ]
        }
    ]

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 pt-32 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 mb-6">
                        <Map className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        Sơ đồ <span className="text-indigo-600">Hệ thống</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Khám phá tất cả các phân hệ chức năng và dịch vụ của SmartBuild Construction Materials 4.0 một cách nhanh chóng nhất.
                    </p>
                </div>
            </div>

            {/* Sitemap Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 ${section.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                                    {section.icon}
                                </div>
                                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                    {section.title}
                                </h2>
                            </div>

                            <ul className="space-y-4">
                                {section.links.map((link, lIdx) => (
                                    <li key={lIdx}>
                                        <Link 
                                            href={link.href}
                                            className="flex items-center justify-between group/item py-1"
                                        >
                                            <span className="text-slate-500 font-bold text-sm tracking-tight group-hover/item:text-indigo-600 group-hover/item:translate-x-1 transition-all">
                                                {link.name}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-16 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-4">Bạn vẫn chưa tìm thấy thứ mình muốn?</h3>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm font-medium">
                            Sử dụng thanh tìm kiếm thông minh hoặc liên hệ trực tiếp với đội ngũ chuyên gia của chúng tôi để được hỗ trợ tốt nhất.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/products" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg">
                                Đến trang Sản phẩm
                            </Link>
                            <Link href="/contact" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg">
                                Liên hệ chuyên gia
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
