'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Facebook, Instagram, Youtube, ChevronDown, Check } from 'lucide-react'
import Header from '@/components/Header'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    }, 1500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const faqs = [
    { q: "Làm thế nào để đặt hàng trực tuyến?", a: "Bạn có thể duyệt sản phẩm, thêm vào giỏ hàng và thanh toán trực tuyến qua các cổng thanh toán uy tín. Hệ thống sẽ tự động gửi email xác nhận và lộ trình giao hàng cho bạn." },
    { q: "Thời gian giao hàng trung bình là bao lâu?", a: "Đối với khu vực nội thành, chúng tôi cam kết giao hàng trong 4-8h làm việc. Với các tỉnh thành khác là từ 1-3 ngày tùy theo khối lượng và khoảng cách." },
    { q: "Có hỗ trợ tư vấn kỹ thuật vật liệu không?", a: "Có, đội ngũ kỹ sư của SmartBuild sẵn sàng hỗ trợ bạn tính toán dự toán vật liệu và tư vấn lựa chọn sản phẩm phù hợp nhất với kết cấu công trình." },
    { q: "Chính sách bảo hành và đổi trả như thế nào?", a: "Tất cả sản phẩm đều được bảo hành chính hãng. Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày nếu sản phẩm có lỗi từ nhà sản xuất hoặc không đúng cam kết." }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-neutral-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-secondary-600/20 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Kết Nối Với <span className="text-primary-400 font-serif italic text-5xl md:text-7xl">SmartBuild</span></h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Chúng tôi luôn ở đây để lắng nghe và hỗ trợ mọi nhu cầu về vật liệu xây dựng cho dự án của bạn.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-100 group hover:shadow-2xl transition-all duration-500">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Đường dây nóng</h3>
              <p className="text-neutral-500 text-sm mb-4">Hỗ trợ nhanh chóng 24/7 cho các đơn hàng gấp.</p>
              <div className="font-bold text-lg text-primary-600">1900 1234</div>
              <div className="text-neutral-900 font-semibold">0987-654-321</div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-100 group hover:shadow-2xl transition-all duration-500">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Email hỗ trợ</h3>
              <p className="text-neutral-500 text-sm mb-4">Gửi yêu cầu báo giá hoặc tư vấn chuyên sâu.</p>
              <div className="font-bold text-neutral-900">info@smartbuild.vn</div>
              <div className="text-neutral-500 text-sm">support@smartbuild.vn</div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-100 group hover:shadow-2xl transition-all duration-500">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Trụ sở chính</h3>
              <p className="text-neutral-500 text-sm mb-4">Ghé thăm văn phòng của chúng tôi để trao đổi trực tiếp.</p>
              <address className="not-italic font-semibold text-neutral-900">
                123 Đường Nguyễn Văn Cừ, Phường 3, Quận 5, TP. Hồ Chí Minh
              </address>
              <div className="mt-4 flex gap-4">
                <Link href="#" className="p-2 bg-neutral-100 rounded-lg hover:bg-primary-600 hover:text-white mb-0 text-neutral-500"><Facebook className="w-4 h-4" /></Link>
                <Link href="#" className="p-2 bg-neutral-100 rounded-lg hover:bg-primary-600 hover:text-white mb-0 text-neutral-500"><Instagram className="w-4 h-4" /></Link>
                <Link href="#" className="p-2 bg-neutral-100 rounded-lg hover:bg-primary-600 hover:text-white mb-0 text-neutral-500"><Youtube className="w-4 h-4" /></Link>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-neutral-100 p-8 md:p-12">
              <div className="mb-10">
                <h2 className="text-3xl font-black text-neutral-900 mb-4">Gửi tin nhắn hoặc yêu cầu báo giá</h2>
                <div className="h-1.5 w-20 bg-primary-600 rounded-full"></div>
              </div>

              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center animate-fade-in-up">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-green-500/20">
                    <Check className="w-10 h-10 stroke-[3]" />
                  </div>
                  <h3 className="text-2xl font-black text-green-900 mb-2">Thanh toán gửi thành công!</h3>
                  <p className="text-green-700 text-lg mb-8">
                    Cảm ơn bạn đã quan tâm. Đội ngũ tư vấn sẽ phản hồi lại bạn sớm nhất có thể trong vòng 2h làm việc.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all"
                  >
                    Gửi tin nhắn mới
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-neutral-700 uppercase tracking-widest pl-1">Họ và tên</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-neutral-700 uppercase tracking-widest pl-1">Địa chỉ Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@email.com"
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-neutral-700 uppercase tracking-widest pl-1">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="09xx xxx xxx"
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-neutral-700 uppercase tracking-widest pl-1">Chủ đề quan tâm</label>
                      <select
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none font-medium appearance-none"
                      >
                        <option value="">Chọn chủ đề</option>
                        <option value="quote">Yêu cầu báo giá vật liệu</option>
                        <option value="tech">Tư vấn kỹ thuật xây dựng</option>
                        <option value="partner">Hợp tác đại lý/Nhà cung cấp</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-neutral-700 uppercase tracking-widest pl-1">Nội dung chi tiết</label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Hãy cho chúng tôi biết yêu cầu cụ thể của bạn..."
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none font-medium resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 text-white py-5 px-8 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-70 group"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <>
                        GỬI YÊU CẦU NGAY
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Map & Office Section */}
        <div className="mt-20">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-neutral-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8 h-[400px] lg:h-auto bg-blue-50 relative">
              {/* Brighter, Colorful Map Image */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2066&auto=format&fit=crop')] bg-cover bg-center opacity-80 mix-blend-multiply"></div>

              {/* Floating Branch Badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-primary-500/20 flex items-center gap-6 border border-white group hover:scale-105 transition-all duration-500">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/30 group-hover:rotate-12 transition-transform">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="font-black text-2xl text-primary-950 leading-tight">SmartBuild Headquarter</div>
                    <div className="text-primary-600 font-bold flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      TP. Hồ Chí Minh, Việt Nam
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 left-4">
                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-xs font-black text-primary-600 border border-white">BẢN ĐỒ VĂN PHÒNG</div>
              </div>
            </div>
            <div className="lg:col-span-4 p-12 bg-gradient-to-br from-blue-50 to-white text-neutral-900 border-l border-neutral-100">
              <h3 className="text-2xl font-black mb-8 text-primary-900 uppercase tracking-tight">Thời gian làm việc</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-4 border-b border-blue-100">
                  <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Thứ 2 - Thứ 6</span>
                  <span className="font-black text-primary-800">08:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-blue-100">
                  <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Thứ 7</span>
                  <span className="font-black text-primary-800">08:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-blue-100">
                  <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Chủ nhật</span>
                  <span className="text-blue-600 font-black">Hẹn trước</span>
                </div>
              </div>
              <div className="mt-12 bg-primary-600 p-6 rounded-2xl shadow-xl shadow-primary-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Hỗ trợ kỹ thuật?</div>
                    <p className="text-sm text-blue-50 font-medium">Kết nối trực tiếp với kỹ sư của chúng tôi qua Zalo hoặc Hotline.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section with Custom Accordion */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary-900 mb-4 tracking-tight">Các Câu Hỏi Thường Gặp</h2>
            <p className="text-primary-600/70 font-medium">Giải đáp nhanh những thắc mắc của bạn về <span className="text-primary-600 font-bold underline decoration-primary-200">SmartBuild</span></p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-all"
                >
                  <span className="font-black text-neutral-900 pr-8">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-6 pt-0 text-neutral-600 leading-relaxed border-t border-neutral-50 bg-neutral-50/50">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Trust Footer - Vibrant Blue Theme */}
      <section className="bg-gradient-to-r from-primary-600 to-blue-500 py-16 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative z-10">
          <div className="text-xl font-black tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Check className="w-5 h-5 text-white" /></span>
            ĐỐI TÁC TIN CẬY
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-base font-bold uppercase tracking-[0.15em] text-white">
            <span className="hover:scale-110 transition-transform cursor-pointer hover:text-blue-100">NovaLand</span>
            <span className="hover:scale-110 transition-transform cursor-pointer hover:text-blue-100">Hoa Binh Corp</span>
            <span className="hover:scale-110 transition-transform cursor-pointer hover:text-blue-100">Coteccons</span>
            <span className="hover:scale-110 transition-transform cursor-pointer hover:text-blue-100">VinGroup</span>
          </div>
        </div>
      </section>
    </div>
  )
}