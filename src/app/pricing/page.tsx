'use client'

import { useState } from 'react'
import { Check, Zap, Crown, ArrowRight, Shield, Star, Users, Lock, X } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import QRPayment from '@/components/QRPayment'
import { toast } from 'react-hot-toast'

const PLANS = [
  {
    id: 'FREE',
    name: 'Miễn Phí',
    price: 0,
    period: 'mãi mãi',
    icon: Shield,
    color: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-200',
    badge: null,
    description: 'Phù hợp để khám phá nền tảng',
    features: [
      { text: 'Tạo tối đa 5 báo giá/tháng', included: true },
      { text: 'Hồ sơ nhà thầu cơ bản', included: true },
      { text: 'Xem danh sách dự án', included: true },
      { text: 'Chat với khách hàng', included: true },
      { text: 'Xuất PDF báo giá cơ bản', included: true },
      { text: 'Đấu thầu dự án không giới hạn', included: false },
      { text: 'Xem thông tin liên hệ chủ nhà', included: false },
      { text: 'AI 3D Viewer bóc tách vật tư', included: false },
      { text: 'Báo giá không giới hạn', included: false },
      { text: 'Huy hiệu "PRO" trên hồ sơ', included: false },
    ],
    cta: 'Đang sử dụng',
    ctaLink: '/contractor',
  },
  {
    id: 'PRO_MONTHLY',
    name: 'Chuyên Nghiệp',
    price: 199000,
    period: 'tháng',
    icon: Crown,
    color: 'from-indigo-600 to-blue-600',
    borderColor: 'border-indigo-300',
    badge: 'Phổ biến nhất',
    description: 'Dành cho nhà thầu hoạt động chuyên nghiệp',
    features: [
      { text: 'Tất cả tính năng gói Free', included: true },
      { text: 'Báo giá không giới hạn/tháng', included: true },
      { text: 'Đấu thầu dự án không giới hạn', included: true },
      { text: 'Xem thông tin liên hệ chủ nhà', included: true },
      { text: 'AI 3D Viewer bóc tách vật tư', included: true },
      { text: 'Xuất PDF chuyên nghiệp có logo', included: true },
      { text: 'Huy hiệu "PRO ✓" xanh trên hồ sơ', included: true },
      { text: 'Ưu tiên hiển thị kết quả tìm kiếm', included: true },
      { text: 'Hỗ trợ ưu tiên 24/7', included: true },
      { text: 'Thống kê doanh thu chi tiết', included: true },
    ],
    cta: 'Nâng cấp ngay - 199.000₫/tháng',
    amount: 199000,
  },
  {
    id: 'PRO_YEARLY',
    name: 'Chuyên Nghiệp (Năm)',
    price: 1590000,
    period: 'năm',
    icon: Star,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-300',
    badge: 'Tiết kiệm 33%',
    description: 'Tiết kiệm nhất - Chỉ ~133k/tháng',
    features: [
      { text: 'Tất cả tính năng gói PRO Monthly', included: true },
      { text: 'Tiết kiệm 798.000₫/năm', included: true },
      { text: 'Truy cập beta tính năng mới', included: true },
      { text: 'Hỗ trợ onboarding trực tiếp', included: true },
      { text: '1 tháng dùng thử không cần thẻ', included: true },
    ],
    cta: 'Mua gói năm - 1.590.000₫/năm',
    amount: 1590000,
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  
  // Modal states
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState('')

  function handleUpgrade(plan: typeof PLANS[0]) {
    if (!plan.amount) return

    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    const orderId = 'PLAN-' + user.id.slice(-8).toUpperCase() + '-' + Date.now()
    setSelectedPlan(plan)
    setCurrentOrderId(orderId)
    setShowQRModal(true)
  }

  async function handleConfirmPayment() {
    if (!selectedPlan) return
    setLoading('VERIFYING')
    try {
      const res = await fetch('/api/payments/upgrade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plan: selectedPlan.id, 
          amount: selectedPlan.amount,
          orderId: currentOrderId
        }),
      })
      const data = await res.json()
      if (res.ok) {
         setShowQRModal(false)
         toast.success('🎉 Nâng cấp gói thành công! Bạn đang dùng gói PRO.')
         router.push('/contractor') // Về trang chủ profile nhà thầu
      } else {
         toast.error(data.error || 'Có lỗi xảy ra, vui lòng thử lại')
      }
    } catch {
      toast.error('Có lỗi kết nối. Vui lòng thử lại!')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 font-sans">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            SmartBuild Pro - Nâng cấp nghề nghiệp của bạn
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[1.05] mb-6">
            Chọn Gói <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Phù Hợp</span>
            <br />Với Bạn
          </h1>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Mở khóa toàn bộ sức mạnh của SmartBuild. Từ AI bóc tách vật tư đến đấu thầu dự án không giới hạn.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isFree = plan.id === 'FREE'
            const isPopular = plan.id === 'PRO_MONTHLY'
            const containerClass = 'relative rounded-[2rem] border ' + plan.borderColor + ' overflow-hidden transition-all duration-300 ' + (isPopular ? 'bg-white/5 backdrop-blur-xl shadow-2xl shadow-indigo-900/50 scale-[1.03]' : 'bg-white/[0.02] backdrop-blur-sm')
            const badgeClass = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ' + plan.color
            const iconBgClass = 'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-xl ' + plan.color
            const btnClass = 'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all shadow-lg bg-gradient-to-r ' + plan.color
            const featClassActive = 'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ' + plan.color

            return (
              <div
                key={plan.id}
                className={containerClass}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className={badgeClass}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon + Name */}
                  <div className={iconBgClass}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white mb-1">{plan.name}</h2>
                  <p className="text-sm text-slate-500 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="flex items-end gap-2 mb-8">
                    <span className="text-4xl font-black text-white">
                      {plan.price === 0
                        ? 'Miễn phí'
                        : plan.price.toLocaleString('vi-VN') + '₫'}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-500 font-medium mb-1">/{plan.period}</span>
                    )}
                  </div>

                  {/* CTA */}
                  {isFree ? (
                    <Link
                      href="/contractor"
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/5 transition-all"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      className={btnClass}
                    >
                      {plan.cta.split(' - ')[0]}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {!isFree && (
                    <p className="text-center text-xs text-slate-600 mt-3">
                      Thanh toán qua VietQR | Chuyển khoản
                    </p>
                  )}

                  {/* Divider */}
                  <div className="my-8 border-t border-white/5" />

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className={feat.included ? featClassActive : 'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/5'}>
                          {feat.included ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Lock className="w-2.5 h-2.5 text-slate-600" />
                          )}
                        </div>
                        <span className={feat.included ? 'text-sm text-slate-200' : 'text-sm text-slate-600'}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Users, label: '2.000+ nhà thầu', sub: 'đang dùng SmartBuild Pro' },
              { icon: Shield, label: 'Thanh toán bảo mật', sub: 'Tích hợp mã VietQR chuẩn Napas' },
              { icon: Zap, label: 'Kích hoạt tức thì', sub: 'Nâng cấp ngay sau khi thanh toán' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-white font-bold">{item.label}</p>
                <p className="text-sm text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Modal */}
      {showQRModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in relative">
              <button 
                 onClick={() => setShowQRModal(false)}
                 className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
              >
                 <X className="w-5 h-5" />
              </button>

              <div className="p-6 pb-0">
                 <h2 className="text-2xl font-black text-slate-800 text-center mb-1">Thanh Toán Gói</h2>
                 <p className="text-sm text-slate-500 text-center mb-6">Quét mã QR bằng ứng dụng ngân hàng</p>
                 
                 <QRPayment 
                    amount={selectedPlan.amount || 0}
                    orderId={currentOrderId}
                    description={'Mua goi ' + selectedPlan.name}
                 />
              </div>

              <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 mt-6">
                 {/* Dummy validation button for students */}
                 <button
                    onClick={handleConfirmPayment}
                    disabled={loading === 'VERIFYING'}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                 >
                    {loading === 'VERIFYING' ? (
                       <span className="animate-pulse">Đang xác nhận thanh toán...</span>
                    ) : (
                       <>
                         <Check className="w-5 h-5" /> Tôi đã chuyển khoản thành công
                       </>
                    )}
                 </button>
                 <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed">
                   * Tính năng được Demo qua SmartBuild Local cho mục đích Đồ Án.<br/> Việc nhấn xác nhận sẽ tự kích hoạt gói ngay lập tức.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
