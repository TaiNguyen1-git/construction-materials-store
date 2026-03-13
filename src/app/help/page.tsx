'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
    Search,
    ChevronRight,
    CreditCard,
    Truck,
    Package,
    ShieldCheck,
    FileText,
    HelpCircle,
    Building2,
    ArrowLeft,
    BookOpen,
    MessageCircle,
    ChevronDown,
    Layers,
    Sparkles
} from 'lucide-react'
import Header from '@/components/Header'

// Số điện thoại Zalo từ biến môi trường
const ZALO_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '0987654321'

// Help Categories
const HELP_CATEGORIES = [
    {
        id: 'payment',
        title: 'Thanh toán & Hóa đơn',
        icon: CreditCard,
        color: 'from-blue-500 to-indigo-600',
        articles: [
            {
                id: 'payment-methods',
                title: 'Các phương thức thanh toán được hỗ trợ',
                content: `
**SmartBuild hỗ trợ đa dạng phương thức thanh toán:**

1. **Chuyển khoản ngân hàng** - Quét mã QR VietQR để thanh toán tức thì
2. **Thanh toán khi nhận hàng (COD)** - Áp dụng cho đơn dưới 10 triệu
3. **Ví điện tử** - MoMo, ZaloPay, VNPay
4. **Công nợ (B2B)** - Dành cho nhà thầu đã xác minh hạn mức

**Lưu ý:** Đơn hàng sẽ được xử lý ngay sau khi thanh toán được xác nhận (thường 1-3 phút với QR).
                `
            },
            {
                id: 'invoice-export',
                title: 'Cách xuất hóa đơn VAT (đỏ)',
                content: `
**Quy trình xuất hóa đơn VAT:**

1. Khi đặt hàng, chọn "Yêu cầu xuất hóa đơn VAT" và điền thông tin công ty
2. Hóa đơn sẽ được xuất trong vòng 3 ngày làm việc sau khi đơn hoàn thành
3. Hóa đơn điện tử sẽ gửi về email, bản cứng gửi kèm đơn hàng tiếp theo (nếu cần)

**Thông tin cần cung cấp:**
- Tên công ty đầy đủ
- Mã số thuế (MST)
- Địa chỉ đã đăng ký
- Email nhận hóa đơn
                `
            },
            {
                id: 'refund-policy',
                title: 'Chính sách hoàn tiền',
                content: `
**Thời gian hoàn tiền:**

| Phương thức | Thời gian xử lý |
|-------------|-----------------|
| Ví điện tử | 1-2 ngày làm việc |
| Chuyển khoản | 3-5 ngày làm việc |
| Thẻ tín dụng | 7-14 ngày (do ngân hàng) |

**Điều kiện hoàn tiền:**
- Hàng bị lỗi do nhà sản xuất
- Giao sai sản phẩm/số lượng
- Hàng hư hỏng trong quá trình vận chuyển
                `
            }
        ]
    },
    {
        id: 'shipping',
        title: 'Vận chuyển & Giao hàng',
        icon: Truck,
        color: 'from-emerald-500 to-teal-600',
        articles: [
            {
                id: 'shipping-time',
                title: 'Thời gian giao hàng dự kiến',
                content: `
**Thời gian giao hàng theo khu vực:**

| Khu vực | Thời gian |
|---------|-----------|
| Nội thành TP.HCM, Hà Nội | 1-2 ngày |
| Các tỉnh lân cận | 2-4 ngày |
| Miền Trung, miền Tây | 3-5 ngày |
| Vùng sâu vùng xa | 5-7 ngày |

**Lưu ý:** Với vật liệu nặng (xi măng, gạch số lượng lớn), thời gian có thể kéo dài thêm 1-2 ngày do cần xe chuyên dụng.
                `
            },
            {
                id: 'shipping-cost',
                title: 'Bảng giá vận chuyển',
                content: `
**Bảng giá vận chuyển theo khoảng cách:**

Phí vận chuyển được tính tự động dựa trên khoảng cách từ cửa hàng (P. Trấn Biên, TP. Biên Hòa) đến địa chỉ giao hàng.

| Khoảng cách | Phí vận chuyển |
|-------------|---------------|
| 0 – 5 km | Miễn phí |
| 5 – 10 km | 30.000đ |
| 10 – 20 km | 50.000đ |
| 20 – 40 km | 100.000đ |
| 40 – 70 km | 200.000đ |
| Trên 70 km | Liên hệ |

**✅ Miễn phí vận chuyển khi:**
- Đơn hàng có giá trị từ 5.000.000đ trở lên
- Khoảng cách giao hàng trong phạm vi 5km

**Lưu ý:**
- Khoảng cách được ước tính dựa trên tọa độ GPS
- Với đơn hàng trên 70km, phí sẽ được nhân viên báo giá riêng
- Phí trên áp dụng cho giao hàng trong giờ hành chính (7:00 – 18:00)
                `
            },
            {
                id: 'track-order',
                title: 'Cách theo dõi đơn hàng',
                content: `
**Theo dõi đơn hàng qua các kênh:**

1. **Trên website/app SmartBuild:**
   - Vào "Đơn hàng của tôi"
   - Nhấn vào đơn cần theo dõi
   - Xem timeline trạng thái realtime

2. **Qua SMS/Zalo:**
   - Hệ thống tự động gửi thông báo khi đơn có cập nhật

3. **Nhắn tin Chatbot:**
   - Gõ "Kiểm tra đơn [MÃ ĐƠN]" để được trả lời ngay
                `
            }
        ]
    },
    {
        id: 'returns',
        title: 'Đổi trả & Bảo hành',
        icon: Package,
        color: 'from-orange-500 to-red-600',
        articles: [
            {
                id: 'return-policy',
                title: 'Chính sách đổi trả hàng',
                content: `
**Thời gian đổi trả:**
- 7 ngày kể từ ngày nhận hàng (với lỗi nhà sản xuất)
- 24h nếu phát hiện hàng bị hư hỏng khi giao

**Điều kiện đổi trả:**
✅ Hàng còn nguyên tem, nhãn, bao bì
✅ Có video/hình ảnh chứng minh lỗi
✅ Có hóa đơn mua hàng hoặc mã đơn

**Không áp dụng đổi trả:**
❌ Hàng đặt theo yêu cầu riêng (cắt, pha màu)
❌ Vật tư đã qua sử dụng
❌ Quá thời hạn đổi trả
                `
            },
            {
                id: 'warranty',
                title: 'Chính sách bảo hành sản phẩm',
                content: `
**Thời gian bảo hành theo nhóm sản phẩm:**

| Nhóm sản phẩm | Bảo hành |
|---------------|----------|
| Thiết bị điện (đèn, quạt) | 12 tháng |
| Máy móc (máy khoan, máy cắt) | 6-12 tháng |
| Sơn, keo, hóa chất | Theo hạn sử dụng |
| Vật liệu thô (gạch, xi măng) | Không bảo hành |

**Quy trình bảo hành:**
1. Liên hệ CSKH kèm mã đơn và mô tả lỗi
2. Gửi hàng về kho hoặc đợi nhân viên thu hồi
3. Nhận hàng mới trong 7-14 ngày
                `
            }
        ]
    },
    {
        id: 'materials',
        title: 'Cẩm nang Vật liệu',
        icon: Layers,
        color: 'from-purple-500 to-violet-600',
        articles: [
            {
                id: 'cement-types',
                title: 'Hướng dẫn chọn loại xi măng phù hợp',
                content: `
**Các loại xi măng phổ biến:**

**1. Xi măng PCB30 (Poóc lăng Hỗn hợp)**
- Dùng cho: Xây trát thông thường, móng nhà cấp 4
- Giá: Thấp nhất
- Thời gian đông kết: 28 ngày

**2. Xi măng PCB40**
- Dùng cho: Đổ bê tông cột, dầm, sàn
- Cường độ cao hơn PCB30 ~30%
- Khuyên dùng cho nhà 2-3 tầng

**3. Xi măng PC50 (Portland)**
- Dùng cho: Công trình chịu lực cao, móng sâu
- Giá cao nhất
- Dùng cho cao ốc, cầu đường

**Công thức trộn bê tông chuẩn (1m³):**
- Xi măng: 7 bao (350kg)
- Cát: 0.5m³
- Đá: 0.8m³
- Nước: 180L
                `
            },
            {
                id: 'brick-selection',
                title: 'So sánh các loại gạch xây dựng',
                content: `
**Bảng so sánh gạch phổ biến:**

| Loại gạch | Kích thước | Trọng lượng | Ứng dụng |
|-----------|------------|-------------|----------|
| Gạch ống 2 lỗ | 8×8×18cm | 1.2kg | Tường ngăn |
| Gạch ống 4 lỗ | 10×10×20cm | 1.8kg | Tường chịu lực nhẹ |
| Gạch đặc | 6×10×21cm | 2.5kg | Móng, tường chịu lực |
| Gạch block | 9×19×39cm | 12kg | Tường ngoài, chịu lực |

**Lượng gạch cần cho 1m² tường:**
- Tường 10cm: ~55 viên gạch ống
- Tường 20cm: ~110 viên gạch ống
- Gạch block: ~12 viên/m²
                `
            },
            {
                id: 'steel-guide',
                title: 'Cách chọn thép và sắt xây dựng',
                content: `
**Phân loại thép theo công dụng:**

**1. Thép cuộn (Ø6, Ø8)**
- Dùng làm đai, cốt thép sàn mỏng
- Cần uốn, cắt theo yêu cầu

**2. Thép cây (Ø10, Ø12, Ø14...)**
- Thép chính cho cột, dầm
- Chọn Ø12-Ø14 cho nhà 2-3 tầng
- Chọn Ø16-Ø20 cho cao tầng

**Khối lượng thép cần thiết (ước tính):**
- Nhà cấp 4: 25-30 kg/m² sàn
- Nhà 2-3 tầng: 35-45 kg/m² sàn
- Nhà 4+ tầng: 50-70 kg/m² sàn

**Thương hiệu tin cậy:**
Hòa Phát, Pomina, Việt Nhật, Posco
                `
            }
        ]
    },
    {
        id: 'contractor',
        title: 'Dành cho Nhà thầu',
        icon: Building2,
        color: 'from-slate-600 to-slate-800',
        articles: [
            {
                id: 'contractor-register',
                title: 'Cách đăng ký tài khoản Nhà thầu',
                content: `
**Quyền lợi Nhà thầu:**
- Giá sỉ ưu đãi (thấp hơn 5-15% giá lẻ)
- Hạn mức công nợ lên đến 500 triệu
- Tích điểm x2, đổi quà và voucher
- Đội ngũ Account Manager riêng

**Quy trình đăng ký:**
1. Truy cập smartbuild.vn/contractor/register
2. Điền thông tin doanh nghiệp (giấy phép kinh doanh, MST)
3. Upload các giấy tờ xác minh
4. Chờ duyệt trong 24-48h
5. Nhận email kích hoạt và bắt đầu mua hàng
                `
            },
            {
                id: 'credit-limit',
                title: 'Hạn mức công nợ và thanh toán',
                content: `
**Bảng hạn mức công nợ:**

| Tier | Điều kiện | Hạn mức |
|------|-----------|---------|
| Mới | Đã xác minh | 20 triệu |
| Bạc | Thanh toán đúng hạn 3 tháng | 50 triệu |
| Vàng | Doanh số >500tr/năm | 100 triệu |
| Bạch Kim | Doanh số >1 tỷ/năm | 200 triệu |
| Kim Cương | Đối tác chiến lược | Thỏa thuận |

**Kỳ hạn thanh toán:**
- Mặc định: 15 ngày kể từ ngày giao hàng
- Có thể gia hạn thêm 15 ngày (tính phí 1%/tháng)
                `
            }
        ]
    },
    {
        id: 'account',
        title: 'Tài khoản & Bảo mật',
        icon: ShieldCheck,
        color: 'from-cyan-500 to-blue-600',
        articles: [
            {
                id: 'two-factor',
                title: 'Bật xác thực 2 lớp (2FA)',
                content: `
**Tại sao cần bật 2FA?**
- Bảo vệ tài khoản khỏi truy cập trái phép
- Bảo vệ thông tin thanh toán và công nợ
- Bắt buộc với tài khoản Nhà thầu

**Cách bật 2FA:**
1. Vào "Cài đặt tài khoản" > "Bảo mật"
2. Chọn "Bật xác thực 2 lớp"
3. Cài app Google Authenticator hoặc Authy
4. Quét mã QR và nhập mã xác nhận
5. Lưu mã dự phòng vào nơi an toàn
                `
            },
            {
                id: 'change-password',
                title: 'Đổi mật khẩu tài khoản',
                content: `
**Yêu cầu mật khẩu mới:**
- Ít nhất 8 ký tự
- Có chữ hoa, chữ thường và số
- Không trùng với 3 mật khẩu gần nhất

**Các bước đổi mật khẩu:**
1. Đăng nhập vào tài khoản
2. Vào "Cài đặt" > "Đổi mật khẩu"
3. Nhập mật khẩu hiện tại
4. Nhập mật khẩu mới 2 lần
5. Nhấn "Xác nhận"

Hệ thống sẽ gửi email thông báo sau khi đổi thành công.
                `
            }
        ]
    }
]

// FAQ items
const FAQ_ITEMS = [
    {
        question: 'Tôi có thể hủy đơn hàng sau khi đặt không?',
        answer: 'Bạn có thể hủy đơn miễn phí nếu đơn chưa được xác nhận vận chuyển. Sau khi đã xuất kho, việc hủy đơn sẽ phát sinh phí vận chuyển 2 chiều.'
    },
    {
        question: 'Làm sao để được giá sỉ?',
        answer: 'Đăng ký tài khoản Nhà thầu và hoàn tất xác minh doanh nghiệp. Hoặc liên hệ Hotline để được báo giá riêng cho đơn hàng lớn.'
    },
    {
        question: 'SmartBuild có giao hàng vào Chủ nhật không?',
        answer: 'Có, chúng tôi giao hàng 7 ngày/tuần. Tuy nhiên, giao Chủ nhật và ngày lễ có thể phát sinh phụ phí 100.000đ tùy khu vực.'
    },
    {
        question: 'Tôi muốn mua số lượng lớn, có được chiết khấu thêm không?',
        answer: 'Có! Liên hệ đội ngũ Sales B2B qua Zalo hoặc Chat để được báo giá riêng với chiết khấu hấp dẫn cho đơn hàng lớn.'
    },
    {
        question: 'Chất lượng hàng có được đảm bảo không?',
        answer: 'Tất cả sản phẩm trên SmartBuild đều từ nhà cung cấp chính hãng, có đầy đủ chứng nhận CO/CQ và được kiểm tra chất lượng trước khi giao.'
    }
]

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null)
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
    const [dbArticles, setDbArticles] = useState<any[]>([])

    // Fetch dynamic articles
    useEffect(() => {
        fetch('/api/help/articles?audience=CUSTOMER')
            .then(res => res.json())
            .then(data => setDbArticles(Array.isArray(data) ? data : []))
            .catch(err => console.error('Fetch DB articles error:', err))
    }, [])

    // Merge DB articles into categories
    const mergedCategories = useMemo(() => {
        const categories = [...HELP_CATEGORIES]

        dbArticles.forEach(article => {
            const catIndex = categories.findIndex(c => c.title === article.category)
            if (catIndex > -1) {
                // Add to existing category
                if (!categories[catIndex].articles.find(a => a.id === article.id)) {
                    categories[catIndex].articles.push({
                        id: article.id,
                        title: article.title,
                        content: article.content
                    })
                }
            } else {
                // Create new category
                categories.push({
                    id: `db-${article.category.toLowerCase().replace(/\s+/g, '-')}`,
                    title: article.category,
                    icon: BookOpen,
                    color: 'from-slate-500 to-slate-700',
                    articles: [{
                        id: article.id,
                        title: article.title,
                        content: article.content
                    }]
                })
            }
        })
        return categories
    }, [dbArticles])

    // Filter articles by search
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return []

        const query = searchQuery.toLowerCase()
        const results: any[] = []

        mergedCategories.forEach(cat => {
            cat.articles.forEach(article => {
                if (
                    article.title.toLowerCase().includes(query) ||
                    article.content.toLowerCase().includes(query)
                ) {
                    results.push({ ...article, categoryTitle: cat.title, categoryId: cat.id })
                }
            })
        })

        return results
    }, [searchQuery, mergedCategories])

    const activeCategory = selectedCategory
        ? mergedCategories.find(c => c.id === selectedCategory)
        : null

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white py-16 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl" />

                    <div className="max-w-5xl mx-auto px-6 relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Trung tâm trợ giúp</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Chúng tôi có thể giúp gì cho bạn?
                        </h1>
                        <p className="text-blue-100 text-lg max-w-2xl mb-8 font-medium">
                            Tìm kiếm câu trả lời nhanh chóng về thanh toán, vận chuyển, đổi trả, và cẩm nang chọn vật liệu xây dựng.
                        </p>

                        {/* Search Box */}
                        <div className="relative max-w-2xl">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Nhập từ khóa, ví dụ: hoàn tiền, giao hàng, xi măng..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setSelectedCategory(null)
                                    setSelectedArticle(null)
                                }}
                                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 shadow-2xl shadow-black/10 outline-none focus:ring-4 focus:ring-white/30 transition-all text-lg font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchQuery && searchResults.length > 0 && (
                            <div className="absolute left-6 right-6 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto z-20">
                                {searchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedCategory(result.categoryId)
                                            setSelectedArticle(result)
                                            setSearchQuery('')
                                        }}
                                        className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                    >
                                        <p className="font-bold text-slate-900 text-sm">{result.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{result.categoryTitle}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchQuery && searchResults.length === 0 && (
                            <div className="mt-4 text-blue-100 text-sm font-medium">
                                Không tìm thấy kết quả. Hãy thử từ khóa khác hoặc <Link href="/messages" className="underline">chat với chúng tôi</Link>.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* Breadcrumb */}
                    {(selectedCategory || selectedArticle) && (
                        <nav className="flex items-center gap-2 text-sm mb-8">
                            <button
                                onClick={() => { setSelectedCategory(null); setSelectedArticle(null); }}
                                className="text-indigo-600 hover:underline font-medium flex items-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Trang chủ
                            </button>
                            {activeCategory && (
                                <>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                    <button
                                        onClick={() => setSelectedArticle(null)}
                                        className={`font-medium ${selectedArticle ? 'text-indigo-600 hover:underline' : 'text-slate-600'}`}
                                    >
                                        {activeCategory.title}
                                    </button>
                                </>
                            )}
                            {selectedArticle && (
                                <>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                    <span className="text-slate-600 font-medium truncate max-w-xs">{selectedArticle.title}</span>
                                </>
                            )}
                        </nav>
                    )}

                    {/* Category Grid (Home) */}
                    {!selectedCategory && !selectedArticle && (
                        <>
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Chủ đề phổ biến</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
                                {HELP_CATEGORIES.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-transparent hover:scale-[1.02] transition-all text-left"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <category.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                            {category.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {category.articles.length} bài viết
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {/* FAQ Section */}
                            <div className="bg-slate-50 rounded-[32px] p-8 mb-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <HelpCircle className="w-6 h-6 text-indigo-600" />
                                    <h2 className="text-2xl font-black text-slate-900">Câu hỏi thường gặp</h2>
                                </div>

                                <div className="space-y-3">
                                    {FAQ_ITEMS.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                            >
                                                <span className="font-bold text-slate-900 text-sm">{faq.question}</span>
                                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expandedFaq === idx && (
                                                <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Category Articles List */}
                    {selectedCategory && !selectedArticle && activeCategory && (
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeCategory.color} flex items-center justify-center shadow-lg`}>
                                    <activeCategory.icon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">{activeCategory.title}</h2>
                                    <p className="text-slate-500 font-medium">{activeCategory.articles.length} bài viết hướng dẫn</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {activeCategory.articles.map((article) => (
                                    <button
                                        key={article.id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="w-full bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all text-left flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {article.title}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Article Content */}
                    {selectedArticle && (
                        <article className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-tight">
                                {selectedArticle.title}
                            </h1>

                            {/* Markdown-like content rendering */}
                            <div className="prose prose-slate max-w-none prose-headings:font-black prose-a:text-indigo-600 prose-strong:text-slate-900 prose-table:text-sm">
                                {selectedArticle.content.split('\n').map((line: string, idx: number) => {
                                    const trimmed = line.trim()
                                    if (!trimmed) return <br key={idx} />

                                    // Headers
                                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                                        return <h3 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-3">{trimmed.slice(2, -2)}</h3>
                                    }

                                    // List items
                                    if (trimmed.startsWith('- ') || trimmed.startsWith('✅') || trimmed.startsWith('❌')) {
                                        return <li key={idx} className="ml-4 mb-1 text-slate-700">{trimmed.replace(/^- /, '')}</li>
                                    }

                                    // Numbered list
                                    if (/^\d+\./.test(trimmed)) {
                                        return <li key={idx} className="ml-4 mb-2 text-slate-700 list-decimal">{trimmed.replace(/^\d+\.\s*/, '')}</li>
                                    }

                                    // Table detection (simple)
                                    if (trimmed.startsWith('|')) {
                                        return <code key={idx} className="block text-xs bg-slate-50 px-3 py-1 rounded font-mono">{trimmed}</code>
                                    }

                                    return <p key={idx} className="text-slate-700 mb-2 leading-relaxed">{trimmed}</p>
                                })}
                            </div>

                            {/* Helpful? */}
                            <div className="mt-10 pt-8 border-t border-slate-100">
                                <p className="text-sm text-slate-500 font-medium mb-3">Bài viết này có hữu ích không?</p>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                                        👍 Có, hữu ích
                                    </button>
                                    <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                                        👎 Chưa giúp được
                                    </button>
                                </div>
                            </div>
                        </article>
                    )}

                    {/* Contact CTA */}
                    <div className="mt-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-black mb-2">Không tìm thấy câu trả lời?</h3>
                                <p className="text-blue-100 font-medium">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn 7 ngày/tuần.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/messages"
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Chat ngay
                                </Link>
                                <a
                                    href={`https://zalo.me/${ZALO_PHONE.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-400 transition-colors"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Nhắn Zalo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
