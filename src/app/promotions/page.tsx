'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { Gift, Copy, Clock, CheckCircle, Sparkles, Tag, ArrowRight, ShoppingBag, Percent, Zap } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

interface Promotion {
    id: string
    code: string
    description: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    minOrderAmount: number
    maxDiscountAmount: number | null
    endDate: string
    usageLimit: number | null
    usedCount: number
}

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPromotions()
    }, [])

    const fetchPromotions = async () => {
        try {
            const res = await fetch('/api/promotions?isActive=true')
            const data = await res.json()
            if (data.success) {
                setPromotions(data.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success(`Đã sao chép mã ${code}!`, {
            style: { borderRadius: '20px', background: '#0c0f17', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
            <Toaster position="bottom-center" />
            <Header />

            {/* Premium Hero */}
            <div className="bg-[#0c0f17] pt-32 pb-48 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Gift className="w-3 h-3" /> ƯU ĐÃI ĐẶC QUYỀN
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-none">
                        SMART<span className="text-blue-500 italic">REWARDS</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Hệ thống voucher và mã giảm giá dành riêng cho khách hàng thân thiết. Tiết kiệm hơn cho mọi công trình.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 -mt-24 pb-32">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white rounded-[40px] animate-pulse border border-slate-100 shadow-xl"></div>
                        ))}
                    </div>
                ) : promotions.length === 0 ? (
                    <div className="bg-white rounded-[56px] p-24 text-center border border-slate-100 shadow-2xl">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Zap className="w-12 h-12 text-slate-200" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Hiện chưa có mã giảm giá mới</h2>
                        <p className="text-slate-500 mb-12 max-w-md mx-auto">Vui lòng quay lại sau hoặc theo dõi fanpage của SmartBuild để nhận các ưu đãi mới nhất.</p>
                        <Link href="/products" className="inline-flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/20">
                            Tiếp tục mua sắm <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {promotions.map((promo, idx) => (
                            <div 
                                key={promo.id}
                                className="group bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-8"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="p-10 flex-1 relative">
                                    <div className="absolute top-8 right-8 text-slate-50 group-hover:text-blue-50 transition-colors">
                                        <Tag className="w-24 h-24 rotate-12" />
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                {promo.discountType === 'PERCENTAGE' ? <Percent className="w-6 h-6" /> : <Tag className="w-6 h-6" />}
                                            </div>
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                                                {promo.discountType === 'PERCENTAGE' ? `Giảm ${promo.discountValue}%` : `Giảm ${promo.discountValue.toLocaleString()}đ`}
                                            </span>
                                        </div>

                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                                            {promo.code}
                                        </h3>
                                        
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-2">
                                            {promo.description || `Ưu đãi dành cho đơn hàng từ ${promo.minOrderAmount.toLocaleString()}đ.`}
                                        </p>

                                        <div className="space-y-3 pt-6 border-t border-slate-50">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> Hạn dùng:</span>
                                                <span className="text-slate-900">{new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            {promo.usageLimit && (
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                                                    <div 
                                                        className="h-full bg-blue-600 rounded-full" 
                                                        style={{ width: `${Math.min((promo.usedCount / promo.usageLimit) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-right">
                                                {promo.usageLimit ? `Đã dùng ${promo.usedCount}/${promo.usageLimit}` : 'Không giới hạn lượt dùng'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 pb-10 mt-auto">
                                    <button 
                                        onClick={() => copyCode(promo.code)}
                                        className="w-full py-5 bg-slate-50 hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-100 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-xl active:scale-95 group/btn"
                                    >
                                        <Copy className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" /> Sao chép mã
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Promo FAQ / Info */}
                <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center text-center p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Mua càng nhiều</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">Càng nhiều ưu đãi sỉ cho các đơn hàng khối lượng lớn và khách hàng doanh nghiệp.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Giảm giá trực tiếp</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">Sử dụng mã ngay tại bước thanh toán để được trừ tiền trực tiếp vào hóa đơn.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Uy tín & Minh bạch</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">Toàn bộ mã giảm giá tại SmartBuild đều được áp dụng ngay lập tức và tự động.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
