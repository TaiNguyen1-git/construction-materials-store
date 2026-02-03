'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import ProductCard from '@/components/marketplace/ProductCard'

interface Product {
    id: string
    name: string
    price: number
    images?: string[]
    category?: { name: string }
}

interface FeaturedProductsProps {
    products: Product[]
    loading: boolean
}

export default function FeaturedProducts({ products, loading }: FeaturedProductsProps) {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 skew-x-12 translate-x-1/2 -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                            Sản phẩm thịnh hành
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Vật Liệu <span className="text-indigo-600">Nổi Bật</span></h2>
                        <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
                            Các sản phẩm được tìm kiếm và đặt hàng nhiều nhất tuần qua từ các thương hiệu hàng đầu.
                        </p>
                    </div>
                    <Link
                        href="/products"
                        className="group flex items-center gap-3 px-8 py-3.5 bg-white text-indigo-600 border border-indigo-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-slate-100"
                    >
                        Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {loading ? (
                        [...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[2rem] shadow-sm h-[380px] animate-pulse border border-slate-100"></div>
                        ))
                    ) : products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product as any} viewMode="grid" />
                        ))
                    ) : (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Package className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Chưa có sản phẩm nào được hiển thị</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
