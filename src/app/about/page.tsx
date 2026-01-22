'use client'

import Link from 'next/link'
import { Package, Truck, Users, Star, Shield, Clock, Award, CheckCircle2, Target, Eye, ArrowRight, Linkedin, Twitter, Mail } from 'lucide-react'
import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Premium Hero Section - Bright Blue Theme (Fixed Legibility) */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-primary-700">
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop"
            alt="Modern Construction"
            className="w-full h-full object-cover opacity-20 scale-105 animate-slow-zoom"
          />
          {/* Deepened gradient for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700/90 to-blue-600/90" />

          {/* Animated decorative elements - reduced brightness */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white text-xs font-black mb-8 animate-fade-in shadow-xl tracking-wider">
              <Award className="w-4 h-4 text-yellow-400" />
              BÁO CÁO THỊ TRƯỜNG 2025: TOP 1 NHÀ CUNG CẤP
            </div>
            {/* Reduced size and added text-shadow for extreme clarity */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight animate-fade-in-up drop-shadow-2xl">
              Kiến Tạo <span className="text-blue-300 italic">Tương Lai</span><br />
              Ngành Xây Dựng Số
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-12 animate-fade-in-up delay-100 font-medium max-w-2xl drop-shadow-md">
              SmartBuild là hệ sinh thái cung ứng vật liệu thông minh, kết nối trực tiếp nhà máy tới công trình, giúp bạn tiết kiệm <span className="text-white font-bold underline decoration-blue-400">20% chi phí</span> và <span className="text-white font-bold underline decoration-blue-400">30% thời gian</span> quản lý.
            </p>
            <div className="flex flex-wrap gap-5 animate-fade-in-up delay-200">
              <Link href="/contact" className="px-10 py-5 bg-white text-primary-700 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-2xl flex items-center gap-2 group">
                Hợp tác chiến lược
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/products" className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border-2 border-white/20 rounded-2xl font-black hover:bg-white/20 transition-all">
                Bảng giá vật tư
              </Link>
            </div>
          </div>
        </div>

        {/* Improved Stat Badge - More compact */}
        <div className="absolute bottom-12 right-12 hidden xl:block animate-fade-in delay-500">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-2xl">
            <div className="text-white/70 text-xs font-bold mb-1 uppercase tracking-widest">Tin dùng bởi</div>
            <div className="text-white text-3xl font-black">2.500+ <span className="text-sm font-medium opacity-80">Dự án lớn</span></div>
          </div>
        </div>
      </section>

      {/* Our Mission & Vision - Bento Layout */}
      <section className="py-24 bg-neutral-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-12 rounded-[2.5rem] shadow-sm border border-neutral-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-neutral-900 mb-6 flex items-center gap-3">
                  <Target className="text-primary-600" /> Tầm nhìn chiến lược
                </h2>
                <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                  Chúng tôi hướng tới việc trở thành một nền tảng công nghệ cung ứng vật liệu xây dựng hàng đầu khu vực, nơi mọi chủ đầu tư, nhà thầu và kiến trúc sư có thể tìm thấy mọi thứ họ cần chỉ với vài cú nhấp chuột.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-2xl">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-neutral-900">Số hóa hoàn toàn</h4>
                      <p className="text-sm text-neutral-500">Quy trình báo giá & đặt hàng tự động.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-2xl">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-neutral-900">Chuỗi cung ứng bền vững</h4>
                      <p className="text-sm text-neutral-500">Cam kết vật liệu xanh & thân thiện môi trường.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-30 transition-transform duration-700 group-hover:scale-150"></div>
            </div>

            <div className="lg:col-span-4 bg-primary-600 p-12 rounded-[2.5rem] text-white flex flex-col justify-between">
              <div>
                <Eye className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-black mb-4">Sứ mệnh</h3>
                <p className="text-primary-100 leading-relaxed font-medium">
                  "Mang đến những sản phẩm chất lượng nhất với giá thành hợp lý nhất, thông qua việc ứng dụng công nghệ để loại bỏ mọi lãng phí trong chuỗi cung ứng."
                </p>
              </div>
              <Link href="/projects" className="mt-8 inline-flex items-center gap-2 font-bold hover:gap-3 transition-all">
                Xem các dự án chúng tôi đã hoàn thành <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-3xl bg-neutral-50 border border-neutral-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500">
              <div className="text-5xl font-black text-primary-600 mb-2">8+</div>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Năm kinh nghiệm</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-neutral-50 border border-neutral-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500">
              <div className="text-5xl font-black text-secondary-600 mb-2">10k+</div>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Sản phẩm có sẵn</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-neutral-50 border border-neutral-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500">
              <div className="text-5xl font-black text-orange-600 mb-2">500+</div>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Đối tác chiến lược</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-neutral-50 border border-neutral-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500">
              <div className="text-5xl font-black text-green-600 mb-2">4.9</div>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Điểm tin cậy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Deep Blue Premium Style (Fixed Visibility) */}
      <section className="py-24 bg-[#0a192f] text-white relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px] -z-0"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl font-black mb-4 text-white font-display uppercase tracking-tight">Giá Trị Cốt Lõi</h2>
            <p className="text-blue-200/60 max-w-xl mx-auto font-medium">Nền tảng giúp SmartBuild phát triển bền vững và nhận được sự tin tưởng từ hàng triệu khách hàng.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <Shield className="w-10 h-10" />, title: "Minh Bạch Tuyệt Đối", desc: "Mọi báo giá, nguồn gốc vật liệu và tình trạng vận chuyển đều được cập nhật thời gian thực trên hệ thống." },
              { icon: <Award className="w-10 h-10" />, title: "Chất Lượng Thẩm Định", desc: "100% vật liệu được nhập khẩu hoặc sản xuất từ các nhà máy tên tuổi, có đầy đủ chứng chỉ chất lượng CO/CQ." },
              { icon: <Clock className="w-10 h-10" />, title: "Tối Ưu Thời Gian", desc: "Hệ thống kho bãi phân bổ thông minh giúp rút ngắn 30% thời gian giao hàng so với phương thức truyền thống." }
            ].map((item, idx) => (
              <div key={idx} className="group relative p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-blue-400/50 transition-all duration-500 backdrop-blur-md">
                <div className="mb-8 inline-flex p-5 rounded-2xl bg-blue-600 text-white group-hover:scale-110 group-hover:bg-blue-400 transition-all duration-500 shadow-xl shadow-blue-500/20">
                  {item.icon}
                </div>
                <h4 className="text-2xl font-black mb-4 text-white group-hover:text-blue-300 transition-colors uppercase tracking-tight leading-tight">{item.title}</h4>
                <p className="text-blue-100/70 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Blue Accents */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-50 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-4">
            <div>
              <h2 className="text-4xl font-black text-primary-900 mb-4 tracking-tight">Đội Ngũ Lãnh Đạo</h2>
              <p className="text-primary-800/60 max-w-xl font-medium">Những chuyên gia tâm huyết với hơn 20 năm kinh nghiệm trong ngành xây dựng và công nghệ số.</p>
            </div>
            <Link href="/contact" className="hidden md:flex items-center gap-2 font-black text-primary-600 hover:gap-4 transition-all uppercase tracking-widest text-xs py-3 px-6 rounded-xl border border-primary-100 hover:bg-primary-50">
              Trở thành một phần của chúng tôi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { name: "Nguyễn Văn An", role: "Founder & CEO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop" },
              { name: "Trần Thị Bình", role: "COO - Giám đốc vận hành", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" },
              { name: "Lê Minh Cường", role: "CTO - Giám đốc công nghệ", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop" }
            ].map((member, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden mb-8 shadow-2xl shadow-primary-500/10 border-4 border-white">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-primary-600/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    <button className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white hover:text-primary-600 transition-all shadow-xl">
                      <Linkedin className="w-5 h-5" />
                    </button>
                    <button className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white hover:text-primary-600 transition-all shadow-xl">
                      <Twitter className="w-5 h-5" />
                    </button>
                    <button className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white hover:text-primary-600 transition-all shadow-xl">
                      <Mail className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-2xl font-black text-primary-900 mb-1">{member.name}</h4>
                <p className="text-primary-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-primary-500"></span>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight italic">"Chúng tôi xây dựng không chỉ là những bức tường, mà là niềm tin cho mọi kiến trúc sư và chủ đầu tư."</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/contact" className="px-10 py-5 bg-white text-primary-600 rounded-full font-black hover:scale-105 transition-all shadow-2xl">
              Liên Hệ Hợp Tác
            </Link>
            <Link href="/products" className="font-bold flex items-center gap-2 hover:gap-3 transition-all">
              Khám phá danh mục vật liệu <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}