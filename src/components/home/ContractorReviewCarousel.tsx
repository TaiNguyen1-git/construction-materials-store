'use client'

import React, { useState, useEffect } from 'react'
import { Star, Quote, ChevronRight } from 'lucide-react'

const REVIEWS = [
    { name: 'Anh Hùng', role: 'Chủ thầu (Quận 7)', comment: 'Sản phẩm thép Hòa Phát rất chuẩn, giao hàng nhanh đúng tiến độ công trình. Dịch vụ chăm sóc khách hàng cực kỳ tốt.', rating: 5.0, avatar: 'H' },
    { name: 'Chị Lan', role: 'Chủ nhà (Bình Chánh)', comment: 'Gạch Viglacera mẫu mã đẹp, giá cả cạnh tranh. Nhân viên tư vấn rất nhiệt tình và chu đáo.', rating: 5.0, avatar: 'L' },
    { name: 'Bác Thành', role: 'Thầu xây dựng (Thủ Đức)', comment: 'Xi măng Hà Tiên loại 1, chất lượng khỏi bàn. Chatbot tư vấn dự toán AI rất chính xác và tiện lợi.', rating: 4.9, avatar: 'T' },
    { name: 'Anh Minh', role: 'Công ty xây dựng (Q.2)', comment: 'Hệ thống đặt hàng online rất chuyên nghiệp, giúp chúng tôi quản lý vật tư cho nhiều công trình cùng lúc dễ dàng.', rating: 4.8, avatar: 'M' },
    { name: 'Chị Mai', role: 'Nhà thiết kế (Q.9)', comment: 'Sơn Dulux lên màu rất chuẩn, giao hàng cẩn thận. SmartBuild là lựa chọn hàng đầu cho các dự án của tôi.', rating: 5.0, avatar: 'M' },
    { name: 'Chú Sáu', role: 'Chủ công trình (Hóc Môn)', comment: 'Giá cả vật liệu rất minh bạch, không lo bị đội giá. Tôi rất an tâm khi mua hàng tại đây.', rating: 4.9, avatar: 'S' },
]

export default function ContractorReviewCarousel() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % (REVIEWS.length - 2))
        }, 6000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Niềm Tin <span className="text-indigo-600">Khách Hàng</span></h2>
                        <p className="text-slate-500 font-medium">Được tin dùng bởi 1,200+ nhà thầu và kiến trúc sư trên cả nước.</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <button
                            onClick={() => setIndex(prev => Math.min(REVIEWS.length - 3, prev + 1))}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div
                        className="flex gap-6 transition-all duration-1000 ease-in-out"
                        style={{ transform: `translateX(-${index * (100 / 3)}%)` }}
                    >
                        {REVIEWS.map((review, i) => (
                            <div
                                key={i}
                                className="min-w-[calc(33.333%-16px)] bg-white p-10 rounded-[2.5rem] border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-500 flex flex-col group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Quote className="w-16 h-16 text-slate-900" />
                                </div>

                                <div className="flex gap-1 text-yellow-500 mb-8">
                                    {[...Array(5)].map((_, star) => (
                                        <Star key={star} className={`w-4 h-4 ${star < Math.floor(review.rating) ? 'fill-current' : 'text-slate-200'}`} />
                                    ))}
                                </div>

                                <p className="text-slate-600 font-medium italic mb-10 leading-relaxed text-sm flex-grow">
                                    &quot;{review.comment}&quot;
                                </p>

                                <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                                    <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 uppercase">
                                        {review.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{review.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{review.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
