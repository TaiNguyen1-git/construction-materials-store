'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Package, Zap, CheckCircle } from 'lucide-react'

// ─── Types matching main POS broadcast ───────────────────────────────────────

interface DisplayItem {
    name: string
    quantity: number
    price: number
    total: number
    image?: string
    unit: string
}

interface DisplayData {
    type: 'cart_update' | 'checkout_success' | 'reset'
    items: DisplayItem[]
    customerName: string
    subtotal: number
    discount: number
    shipping: number
    total: number
    orderNumber?: string
}

// ─── Customer Facing Display ─────────────────────────────────────────────────

export default function POSDisplayPage() {
    const [data, setData] = useState<DisplayData>({
        type: 'reset',
        items: [],
        customerName: '',
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0
    })
    const [showSuccess, setShowSuccess] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Listen for BroadcastChannel messages from main POS
    useEffect(() => {
        const channel = new BroadcastChannel('pos-display')
        channel.onmessage = (event: MessageEvent<DisplayData>) => {
            const msg = event.data
            setData(msg)

            if (msg.type === 'checkout_success') {
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 8000) // Auto-hide after 8s
            } else if (msg.type === 'reset') {
                setShowSuccess(false)
            }
        }
        return () => channel.close()
    }, [])

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    const hasItems = data.items.length > 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white flex flex-col select-none overflow-hidden">

            {/* Header */}
            <div className="px-10 py-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl">
                        <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">SmartBuild</h1>
                        <p className="text-sm text-blue-300 font-medium">Hệ thống vật liệu xây dựng</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black tabular-nums">
                        {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-blue-300 font-medium">
                        {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Customer greeting */}
            {data.customerName && (
                <div className="px-10 pb-4 shrink-0">
                    <p className="text-lg text-blue-200">
                        Xin chào, <span className="font-black text-white text-xl">{data.customerName}</span>
                    </p>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 px-10 pb-6 flex gap-8 min-h-0">

                {/* Items list */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-blue-200 uppercase tracking-widest">Danh sách sản phẩm</h2>
                        {hasItems && (
                            <span className="bg-blue-600 px-3 py-1 rounded-xl text-sm font-black">
                                {data.items.length} SP
                            </span>
                        )}
                    </div>

                    {hasItems ? (
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-600">
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">Sản phẩm</div>
                                <div className="col-span-2 text-center">Số lượng</div>
                                <div className="col-span-2 text-right">Đơn Giá</div>
                                <div className="col-span-2 text-right">Thành Tiền</div>
                            </div>

                            {data.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-12 gap-2 items-center bg-white/5 hover:bg-white/10 rounded-2xl px-5 py-3.5 transition-all animate-in fade-in slide-in-from-left-3 duration-300"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="col-span-1 text-sm font-bold text-slate-500">{idx + 1}</div>
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-5 h-5 text-slate-500" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="bg-blue-600/30 px-3 py-1 rounded-lg text-sm font-black">{item.quantity}</span>
                                    </div>
                                    <div className="col-span-2 text-right text-sm text-slate-300 font-medium">
                                        {formatCurrency(item.price)}
                                    </div>
                                    <div className="col-span-2 text-right text-sm font-black text-white">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            {/* Background Decoration */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                <ShoppingCart className="w-[500px] h-[500px]" />
                            </div>

                            {/* Standby Content */}
                            <div className="text-center z-10 animate-in fade-in zoom-in duration-700">
                                <div className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20">
                                    <Zap className="w-16 h-16 fill-white" />
                                </div>
                                <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase">
                                    Chào mừng quý khách
                                </h2>
                                <p className="text-xl text-blue-300 font-bold uppercase tracking-[0.3em] mb-12 opacity-60">
                                    SmartBuild Store • Uy tín - chất lượng
                                </p>

                                <div className="inline-flex items-center gap-8 bg-white/5 backdrop-blur-md px-10 py-6 rounded-[32px] border border-white/10">
                                    <div className="text-left border-r border-white/10 pr-8">
                                        <p className="text-sm text-slate-400 font-bold uppercase mb-1">Giờ hệ thống</p>
                                        <p className="text-4xl font-black tabular-nums tracking-tight text-blue-400">
                                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-slate-400 font-bold uppercase mb-1">Ngày làm việc</p>
                                        <p className="text-xl font-black italic">
                                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long' })}
                                        </p>
                                        <p className="text-sm text-blue-300 font-medium">
                                            {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary panel */}
                {hasItems && (
                    <div className="w-80 shrink-0 flex flex-col justify-end">
                        <div className="bg-white/5 backdrop-blur-sm rounded-[32px] border border-white/10 p-8 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Tạm tính</span>
                                    <span className="font-bold">{formatCurrency(data.subtotal)}</span>
                                </div>
                                {data.discount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-400">
                                        <span>Giảm giá</span>
                                        <span className="font-bold">-{formatCurrency(data.discount)}</span>
                                    </div>
                                )}
                                {data.shipping > 0 && (
                                    <div className="flex justify-between text-sm text-blue-300">
                                        <span>Phí vận chuyển</span>
                                        <span className="font-bold">+{formatCurrency(data.shipping)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-white/10 pt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm text-slate-300 font-bold uppercase">Tổng cộng</span>
                                    <span className="text-4xl font-black text-blue-400">{formatCurrency(data.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Checkout success overlay */}
            {showSuccess && (
                <div className="fixed inset-0 bg-emerald-600 z-50 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center">
                        <CheckCircle className="w-32 h-32 mx-auto mb-8 animate-bounce" />
                        <h1 className="text-5xl font-black mb-4">Thanh toán thành công!</h1>
                        {data.orderNumber && (
                            <p className="text-2xl text-emerald-200 font-bold mb-2">Mã đơn: #{data.orderNumber}</p>
                        )}
                        <p className="text-xl text-emerald-100">
                            Tổng: <span className="font-black text-3xl text-white">{formatCurrency(data.total)}</span>
                        </p>
                        <p className="mt-8 text-lg text-emerald-200 font-medium animate-pulse">
                            Cảm ơn quý khách • SmartBuild
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-10 py-4 text-center text-xs text-slate-500 font-medium shrink-0">
                SmartBuild POS • Hệ thống quản lý vật liệu xây dựng
            </div>
        </div>
    )
}
