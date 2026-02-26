'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Package, Zap, CheckCircle, CreditCard } from 'lucide-react'

// ─── Types matching main POS broadcast ───────────────────────────────────────

interface DisplayItem {
    name: string
    quantity: number
    price: number
    total: number
    image?: string
    unit: string
}

interface BankInfo {
    bankId: string
    accountNumber: string
    accountName: string
    bankName: string
}

interface DisplayData {
    type: 'cart_update' | 'checkout_success' | 'payment_pending' | 'reset'
    paymentMethod?: string
    items: DisplayItem[]
    customerName: string
    subtotal: number
    discount: number
    shipping: number
    total: number
    orderNumber?: string
    bankInfo?: BankInfo
}

// ─── Customer Facing Display (Light Theme) ───────────────────────────────────

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
    const [showQR, setShowQR] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Listen for BroadcastChannel messages from main POS
    useEffect(() => {
        const channel = new BroadcastChannel('pos-display')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channel.onmessage = (event: MessageEvent<any>) => {
            const msg = event.data
            setData(msg)

            if (msg.type === 'checkout_success') {
                setShowQR(false)
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 8000)
            } else if (msg.type === 'payment_pending') {
                setShowSuccess(false)
                setShowQR(true)
            } else if (msg.type === 'reset') {
                setShowSuccess(false)
                setShowQR(false)
            } else if (msg.type === 'cart_update') {
                setShowQR(false)
                setShowSuccess(false)
            }
        }
        return () => channel.close()
    }, [])

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    const hasItems = data.items.length > 0
    const qrUrl = data.bankInfo
        ? `https://img.vietqr.io/image/${data.bankInfo.bankId}-${data.bankInfo.accountNumber}-compact2.png?amount=${Math.floor(data.total)}&addInfo=${encodeURIComponent('POS ' + Date.now().toString().slice(-6))}&accountName=${encodeURIComponent(data.bankInfo.accountName)}`
        : ''

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col select-none overflow-hidden font-sans">

            {/* Header */}
            <div className="px-10 py-6 flex items-center justify-between shrink-0 bg-white border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                        <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900">SmartBuild</h1>
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">Hệ thống vật liệu xây dựng</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-3xl font-black tabular-nums text-slate-900 leading-none mb-1">
                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer greeting */}
            {data.customerName && (
                <div className="px-10 py-4 bg-blue-50/50 border-b border-blue-100 shrink-0">
                    <p className="text-lg text-slate-500 font-medium">
                        Xin chào, <span className="font-black text-blue-600 text-xl">{data.customerName}</span>
                    </p>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 px-10 py-8 flex gap-8 min-h-0">

                {/* Items list */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Giỏ hàng của quý khách</h2>
                        {hasItems && (
                            <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black text-white">
                                {data.items.length} SẢN PHẨM
                            </span>
                        )}
                    </div>

                    {hasItems ? (
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">Tên sản phẩm</div>
                                <div className="col-span-2 text-center">SL</div>
                                <div className="col-span-2 text-right">Đơn giá</div>
                                <div className="col-span-2 text-right text-blue-600">Thành tiền</div>
                            </div>

                            {data.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-200/60 shadow-sm rounded-2xl px-6 py-4 transition-all animate-in fade-in slide-in-from-left-3 duration-300"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="col-span-1 text-sm font-bold text-slate-300">{idx + 1}</div>
                                    <div className="col-span-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                                            {item.image ? (
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 tracking-tight truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-sm font-black border border-blue-100">{item.quantity}</span>
                                    </div>
                                    <div className="col-span-2 text-right text-sm text-slate-500 font-bold">
                                        {formatCurrency(item.price)}
                                    </div>
                                    <div className="col-span-2 text-right text-lg font-black text-blue-600">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center relative bg-white rounded-[40px] border border-slate-200 border-dashed">
                            {/* Background Decoration */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                                <ShoppingCart className="w-[400px] h-[400px]" />
                            </div>

                            {/* Standby Content */}
                            <div className="text-center z-10 animate-in fade-in zoom-in duration-700">
                                <div className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30">
                                    <Zap className="w-16 h-16 fill-white text-white" />
                                </div>
                                <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase text-slate-900">
                                    Chào mừng quý khách
                                </h2>
                                <p className="text-xl text-blue-600 font-black uppercase tracking-[0.3em] mb-12">
                                    SmartBuild Store • Uy tín - chất lượng
                                </p>

                                <div className="inline-flex items-center gap-12 bg-slate-50 px-12 py-8 rounded-[40px] border border-slate-200/60">
                                    <div className="text-left border-r border-slate-200 pr-12">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Giờ hệ thống</p>
                                        <p className="text-5xl font-black tabular-nums tracking-tighter text-slate-900">
                                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ngày làm việc</p>
                                        <p className="text-xl font-black text-slate-800">
                                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long' })}
                                        </p>
                                        <p className="text-sm text-blue-600 font-black italic">
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
                    <div className="w-96 shrink-0 flex flex-col justify-end">
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 p-10 space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-slate-500 font-bold">
                                    <span>Tạm tính</span>
                                    <span className="text-slate-900">{formatCurrency(data.subtotal)}</span>
                                </div>
                                {data.discount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                        <span>Giảm giá</span>
                                        <span className="bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px]">-{formatCurrency(data.discount)}</span>
                                    </div>
                                )}
                                {data.shipping > 0 && (
                                    <div className="flex justify-between text-sm text-blue-600 font-bold">
                                        <span>Phí vận chuyển</span>
                                        <span>+{formatCurrency(data.shipping)}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-8 mt-6">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Tổng thanh toán</span>
                                        <span className="text-6xl font-black text-slate-900 tracking-tighter">{formatCurrency(data.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Payment Pending Overlay (QR) ─────────────────────────────── */}
            {showQR && data.bankInfo && (
                <div className="fixed inset-0 bg-white z-40 flex flex-col animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="px-10 py-6 flex items-center justify-between border-b border-slate-100 bg-blue-50/50 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl">
                                <CreditCard className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thanh toán chuyển khoản</h1>
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">Quét mã QR bên dưới để thanh toán</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Số tiền cần thanh toán</p>
                            <p className="text-5xl font-black text-blue-600 tracking-tighter">{formatCurrency(data.total)}</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex items-center justify-center gap-16 px-16 py-8">
                        {/* QR Section */}
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-6 rounded-[40px] border-2 border-blue-100 shadow-2xl shadow-blue-100">
                                <img
                                    src={qrUrl}
                                    alt="QR Payment"
                                    className="w-80 h-80 rounded-2xl"
                                />
                            </div>
                            <p className="text-sm text-slate-400 font-bold mt-6 animate-pulse">📱 Mở app ngân hàng → Quét mã QR</p>
                        </div>

                        {/* Bank Details */}
                        <div className="space-y-6 w-96">
                            <div className="bg-slate-50 rounded-[32px] p-8 space-y-5 border border-slate-200">
                                <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-4">Thông tin chuyển khoản</h3>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Ngân hàng</p>
                                    <p className="text-lg font-black text-slate-800">{data.bankInfo.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Số tài khoản</p>
                                    <p className="text-2xl font-black text-blue-600 font-mono tracking-wider">{data.bankInfo.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Chủ tài khoản</p>
                                    <p className="text-lg font-black text-slate-800">{data.bankInfo.accountName}</p>
                                </div>
                            </div>

                            {/* Order summary mini */}
                            <div className="bg-blue-50 rounded-[32px] p-8 border border-blue-200/50">
                                <h3 className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mb-4">Chi tiết đơn hàng</h3>
                                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                                    {data.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-slate-600 font-bold truncate max-w-[200px]">{item.name} ×{item.quantity}</span>
                                            <span className="text-blue-600 font-black">{formatCurrency(item.total)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-blue-200 mt-4 pt-4 flex justify-between items-end">
                                    <span className="text-sm text-slate-500 font-bold">Tổng cộng</span>
                                    <span className="text-3xl font-black text-blue-600">{formatCurrency(data.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] shrink-0">
                        Vui lòng đợi nhân viên xác nhận sau khi chuyển khoản thành công
                    </div>
                </div>
            )}

            {/* ── Checkout success overlay ─────────────────────────────────── */}
            {showSuccess && (
                <div className="fixed inset-0 bg-white z-50 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center p-20 bg-emerald-50 rounded-[80px] border-4 border-emerald-500/20 shadow-2xl animate-in zoom-in-90 duration-700">
                        <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-200">
                            <CheckCircle className="w-20 h-20 text-white animate-bounce" />
                        </div>
                        <h1 className="text-6xl font-black mb-4 text-emerald-600 tracking-tighter">THANH TOÁN XONG!</h1>
                        {data.orderNumber && (
                            <div className="inline-block bg-white px-8 py-3 rounded-full border border-emerald-100 font-black text-emerald-500 text-2xl mb-8 shadow-sm">
                                Mã đơn: #{data.orderNumber}
                            </div>
                        )}
                        <p className="text-3xl text-slate-600 font-bold mb-4">
                            Tổng tiền: <span className="font-black text-5xl text-slate-900">{formatCurrency(data.total)}</span>
                        </p>
                        <div className="mt-16 space-y-2">
                            <p className="text-2xl text-emerald-600 font-black uppercase tracking-[0.2em]">Cảm ơn quý khách đã tin tưởng</p>
                            <p className="text-sm text-slate-400 font-bold italic">Vui lòng nhận hàng và hóa đơn tại quầy</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-10 py-6 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] shrink-0 border-t border-slate-100 bg-white">
                SmartBuild POS • Hệ thống quản lý vật liệu xây dựng chuyên nghiệp
            </div>
        </div>
    )
}
