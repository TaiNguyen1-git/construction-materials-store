"use client"

import React, { useState, useEffect } from 'react'
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    MessageSquare,
    MapPin,
    DollarSign,
    Calendar,
    ChevronRight,
    History,
    Building2,
    PenTool,
    Send,
    CreditCard,
    QrCode,
    ShieldCheck,
    Star,
    Award
} from 'lucide-react'
import Link from 'next/link'

interface QuoteRequest {
    id: string
    status: string
    details: string
    budget: number | null
    location: string | null
    startDate: string | null
    response: string | null
    priceQuote: number | null
    respondedAt: string | null
    createdAt: string
    contractor: {
        id: string
        companyName: string | null
        user: {
            name: string
        }
        contractorProfile?: {
            trustScore: number
            totalProjectsCompleted: number
            avgRating: number
        }
    }
    project?: {
        name: string
    }
    history?: {
        id: string
        newStatus: string
        notes: string | null
        createdAt: string
    }[]
    items?: {
        description: string
        quantity: number
        unit: string
        unitPrice: number
    }[]
    milestones?: {
        id: string
        name: string
        percentage: number
        amount: number
        order: number
        status: string
    }[]
    contractNumber?: string
}

export default function CustomerQuotesPage() {
    const [quotes, setQuotes] = useState<QuoteRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)
    const [otpModal, setOtpModal] = useState(false)
    const [otpValue, setOtpValue] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [qrModal, setQrModal] = useState(false)
    const [activeMilestone, setActiveMilestone] = useState<any>(null)

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/quotes?type=sent', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setQuotes(data.data)
                }
            }
        } catch (error) {
            console.error('Failed to fetch quotes:', error)
        } finally {
            setLoading(false)
        }
    }

    const requestOtp = async () => {
        if (!selectedQuote) return
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/quotes/${selectedQuote.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'REQUEST_OTP' })
            })
            if (res.ok) {
                setOtpModal(true)
            } else {
                alert('Không thể gửi mã OTP. Vui lòng thử lại.')
            }
        } catch (e) {
            alert('Lỗi kết nối')
        }
    }

    const handleVerifyOtp = async () => {
        if (!selectedQuote || otpValue.length !== 6) return
        setVerifying(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/quotes/${selectedQuote.id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ otp: otpValue })
            })
            const data = await res.json()
            if (res.ok) {
                alert('Xác thực thành công! Hợp đồng đã được khởi tạo.')
                setOtpModal(false)
                setOtpValue('')
                fetchQuotes()
                setSelectedQuote(data.data)
            } else {
                alert(data.message || 'Mã OTP không chính xác')
            }
        } catch (e) {
            alert('Lỗi hệ thống')
        } finally {
            setVerifying(false)
        }
    }

    const handleAction = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/quotes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                fetchQuotes()
                setSelectedQuote(null)
            }
        } catch (error) {
            alert('Lỗi kết nối')
        }
    }

    const handlePayment = async (milestoneId: string) => {
        if (!selectedQuote) return
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/quotes/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    milestoneId,
                    paymentMethod: 'BANK_TRANSFER'
                })
            })
            const data = await res.json()
            if (res.ok) {
                alert('Hệ thống đã ghi nhận yêu cầu thanh toán. Tiền của bạn sẽ được giữ an toàn (Escrow) cho đến khi bạn xác nhận hoàn thành giai đoạn.')
                setQrModal(false)
                fetchQuotes()
            } else {
                alert(data.message || 'Lỗi thanh toán')
            }
        } catch (e) {
            alert('Lỗi hệ thống')
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Đang chờ'
            case 'REPLIED': return 'Đã báo giá'
            case 'ACCEPTED': return 'Đã chấp nhận'
            case 'REJECTED': return 'Từ chối'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700'
            case 'REPLIED': return 'bg-blue-100 text-blue-700'
            case 'ACCEPTED': return 'bg-green-100 text-green-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            case 'CANCELLED': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getTrustColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-50'
        if (score >= 70) return 'text-blue-600 bg-blue-50'
        if (score >= 50) return 'text-yellow-600 bg-yellow-50'
        return 'text-red-600 bg-red-50'
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/account" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Báo giá</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-8 h-[calc(100vh-180px)]">
                    {/* List Section */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                placeholder="Tìm kiếm báo giá..."
                                className="bg-transparent border-none outline-none text-sm w-full"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white h-32 rounded-3xl animate-pulse" />
                                ))
                            ) : quotes.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium italic">Chưa có yêu cầu nào</p>
                                </div>
                            ) : quotes.map((quote) => (
                                <div
                                    key={quote.id}
                                    onClick={() => setSelectedQuote(quote)}
                                    className={`p-6 rounded-3xl cursor-pointer transition-all border-2 ${selectedQuote?.id === quote.id
                                        ? 'bg-white border-primary-500 shadow-xl shadow-primary-50'
                                        : 'bg-white border-transparent hover:border-gray-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(quote.status)}`}>
                                            {getStatusText(quote.status)}
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${getTrustColor(quote.contractor.contractorProfile?.trustScore || 0)}`}>
                                            <ShieldCheck className="w-3 h-3" />
                                            {quote.contractor.contractorProfile?.trustScore || 100}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-gray-900 mb-1 line-clamp-1">Mã: #{quote.id.slice(-6).toUpperCase()}</h3>
                                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {quote.contractor.user.name}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className="text-sm font-black text-primary-600">
                                            {quote.priceQuote ? `${quote.priceQuote.toLocaleString()}đ` : 'Chưa báo giá'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail Section */}
                    <div className="col-span-12 lg:col-span-8">
                        {selectedQuote ? (
                            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 h-full overflow-hidden flex flex-col">
                                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Báo giá chi tiết</h2>
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusStyle(selectedQuote.status)}`}>
                                                    {getStatusText(selectedQuote.status)}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 font-medium tracking-tight">Cập nhật lúc {new Date(selectedQuote.createdAt).toLocaleString('vi-VN')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all text-sm shadow-sm">
                                                <MessageSquare className="w-4 h-4 text-primary-500" />
                                                Nhắn tin
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                                    {/* Contractor Info & Trust Score Flow 5 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <ShieldCheck className="w-20 h-20 text-indigo-600" />
                                            </div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Nhà thầu phụ trách</h4>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                    <Building2 className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-xl leading-tight">{selectedQuote.contractor.user.name}</p>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{selectedQuote.contractor.companyName || 'Đối tác Xây dựng'}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200/50">
                                                <div className="bg-white p-3 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Điểm tín nhiệm</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-black text-indigo-600">{selectedQuote.contractor.contractorProfile?.trustScore || 100}</span>
                                                        <div className="bg-indigo-100 p-1 rounded-lg">
                                                            <Award className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Dự án đã xong</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-black text-gray-900">{selectedQuote.contractor.contractorProfile?.totalProjectsCompleted || 0}</span>
                                                        <div className="bg-green-100 p-1 rounded-lg">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Dự án liên kết</h4>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                                    <MapPin className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-xl leading-tight">{selectedQuote.project?.name || 'Yêu cầu tự do'}</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-medium italic">{selectedQuote.location || 'Tại địa điểm chưa xác định'}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Ngân sách dự kiến</p>
                                                    <p className="font-black text-gray-900">{selectedQuote.budget?.toLocaleString() || 'Thỏa thuận'}đ</p>
                                                </div>
                                                <div className="w-px h-8 bg-gray-100" />
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Bắt đầu</p>
                                                    <p className="font-black text-gray-900">{selectedQuote.startDate ? new Date(selectedQuote.startDate).toLocaleDateString() : 'Sớm nhất'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BoQ Table */}
                                    {selectedQuote.items && selectedQuote.items.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                        <PenTool className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    Bảng Khối Lượng (BoQ)
                                                </h4>
                                                <span className="text-xs font-bold text-gray-400 italic font-serif">Đơn vị: VNĐ</span>
                                            </div>
                                            <div className="border border-gray-100 rounded-[32px] overflow-hidden bg-white shadow-xl shadow-gray-50/50">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-widest">
                                                        <tr>
                                                            <th className="py-5 px-8 text-left">Hạng mục thi công / Vật tư</th>
                                                            <th className="py-5 px-2 text-center w-28">Số lượng</th>
                                                            <th className="py-5 px-6 text-right w-40">Đơn giá</th>
                                                            <th className="py-5 px-8 text-right w-40">Thành tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {selectedQuote.items.map((item, i) => (
                                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                                                <td className="py-5 px-8">
                                                                    <p className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{item.description}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Vật tư đạt chuẩn ISO</p>
                                                                </td>
                                                                <td className="py-5 px-2 text-center">
                                                                    <span className="bg-gray-100 px-3 py-1 rounded-xl font-black text-gray-600 text-xs">{item.quantity} {item.unit}</span>
                                                                </td>
                                                                <td className="py-5 px-6 text-right font-bold text-gray-400 tabular-nums italic text-xs">{item.unitPrice.toLocaleString()}đ</td>
                                                                <td className="py-5 px-8 text-right font-black text-gray-900 tabular-nums">{(item.quantity * item.unitPrice).toLocaleString()}đ</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-900 text-white">
                                                        <tr>
                                                            <td colSpan={3} className="py-10 px-8 text-xl font-black tracking-widest uppercase italic opacity-60">TỔNG GIÁ TRỊ PHÊ DUYỆT</td>
                                                            <td className="py-10 px-8 text-3xl font-black text-right tracking-tighter text-indigo-400">{(selectedQuote.priceQuote || 0).toLocaleString()}đ</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Milestones / Escrow Flow 3 */}
                                    {selectedQuote.milestones && selectedQuote.milestones.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                                                        <DollarSign className="w-4 h-4 text-pink-600" />
                                                    </div>
                                                    Lộ trình Thanh toán & Escrow
                                                </h4>
                                                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 border border-yellow-200">
                                                    <Clock className="w-3 h-3" /> Hệ thống giữ tiền hộ (Escrow)
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                {selectedQuote.milestones.map((m, i) => (
                                                    <div key={i} className={`p-6 bg-white border-2 rounded-[32px] shadow-sm relative overflow-hidden transition-all group ${m.status === 'ESCROW_PAID' ? 'border-green-500 bg-green-50/30' : 'border-neutral-100 hover:border-indigo-200'
                                                        }`}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.status === 'ESCROW_PAID' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                                                                }`}>{m.percentage}%</span>
                                                            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic font-serif">Đợt {m.order || (i + 1)}</span>
                                                        </div>
                                                        <p className="text-sm font-black text-gray-900 mb-1 leading-tight">{m.name}</p>
                                                        <p className="text-xl font-black text-indigo-600 mb-6">{m.amount.toLocaleString()}đ</p>

                                                        {m.status === 'ESCROW_PAID' ? (
                                                            <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase">
                                                                <CheckCircle className="w-4 h-4 shadow-sm" /> Đã nạp Escrow
                                                            </div>
                                                        ) : selectedQuote.status === 'ACCEPTED' ? (
                                                            <button
                                                                onClick={() => {
                                                                    setActiveMilestone(m)
                                                                    setQrModal(true)
                                                                }}
                                                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group-hover:translate-y-[-2px] shadow-lg shadow-gray-200"
                                                            >
                                                                <CreditCard className="w-3 h-3" /> Thanh toán cọc
                                                            </button>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-300 font-bold italic uppercase flex items-center gap-2">
                                                                <Clock className="w-3 h-3" /> Chờ chốt báo giá
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Area Flow 2 */}
                                    <div className="pt-12 pb-8 border-t border-gray-100">
                                        {selectedQuote.status === 'REPLIED' ? (
                                            <div className="flex gap-6">
                                                <button
                                                    onClick={requestOtp}
                                                    className="flex-[2] bg-indigo-600 text-white py-8 rounded-[40px] font-black text-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex flex-col items-center justify-center gap-1 group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <CheckCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                                        PHÊ DUYỆT & KÝ SỐ OTP
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Xác thực pháp lý qua Email</span>
                                                </button>
                                                <button
                                                    onClick={() => handleAction(selectedQuote.id, 'REJECTED')}
                                                    className="flex-1 bg-white border-2 border-red-50 text-red-500 py-8 rounded-[40px] font-black text-xl hover:bg-red-50 transition-all uppercase tracking-tighter"
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        ) : selectedQuote.status === 'ACCEPTED' ? (
                                            <div className="bg-green-600 p-12 rounded-[56px] text-center space-y-6 shadow-3xl shadow-green-100 relative overflow-hidden group">
                                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                                                <div className="w-24 h-24 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                                    <CheckCircle className="w-14 h-14 text-white" />
                                                </div>
                                                <h3 className="text-5xl font-black text-white tracking-tighter">Báo giá đã ký kết</h3>
                                                <p className="text-green-100 max-w-lg mx-auto font-medium text-lg leading-relaxed">
                                                    Hợp đồng thi công số <strong className="text-white text-2xl tracking-widest italic">#{selectedQuote.contractNumber || 'PRO-' + selectedQuote.id.slice(-6).toUpperCase()}</strong> đã được kích hoạt.
                                                </p>
                                                <div className="pt-8 flex gap-4 justify-center">
                                                    <Link href="/account/contracts" className="bg-white text-green-600 px-12 py-5 rounded-[24px] font-black text-lg hover:translate-y-[-4px] transition-all shadow-xl">Xem Hợp đồng</Link>
                                                    <Link href="/account/projects" className="bg-green-800 text-white border-2 border-green-500/50 px-12 py-5 rounded-[24px] font-black text-lg hover:bg-green-900 transition-all">Quản lý thi công</Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-20 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[56px] font-black text-gray-300 uppercase tracking-[0.5em] italic text-3xl">
                                                {getStatusText(selectedQuote.status).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full bg-white rounded-[48px] border-2 border-dashed border-gray-50 flex flex-col items-center justify-center p-24 text-center text-neutral-200 group">
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-indigo-600 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
                                    <PenTool className="w-40 h-40 relative z-10 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:rotate-12" />
                                </div>
                                <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter italic">Hàn Thuyên & Kỹ Thuật</h3>
                                <p className="font-bold text-gray-400 tracking-tight max-w-sm mx-auto leading-relaxed text-lg">Hệ thống đang sẵn sàng. Hãy chọn một báo giá để kiểm tra khối lượng (BoQ) và điểm tín nhiệm (Trust Score) của nhà thầu.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* OTP Verification Modal */}
            {otpModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[64px] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-24 duration-1000">
                        <div className="p-16 text-center">
                            <div className="w-28 h-28 bg-indigo-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 rotate-6 shadow-inner relative">
                                <Send className="w-14 h-14 text-indigo-600" />
                                <div className="absolute -top-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs">OTP</div>
                            </div>
                            <h3 className="text-5xl font-black text-gray-900 mb-6 tracking-tighter italic">Ký Số Điện Tử</h3>
                            <p className="text-gray-500 mb-12 leading-relaxed text-xl font-medium tracking-tight px-4">
                                Nhập mã OTP 6 chữ số vừa được gửi đến email của bạn để thực hiện xác thực pháp lý & khởi tạo hợp đồng thi công.
                            </p>

                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={otpValue}
                                onChange={e => setOtpValue(e.target.value)}
                                className="w-full text-center text-7xl font-black tracking-[1.5rem] py-12 border-4 border-gray-50 rounded-[40px] mb-12 focus:border-indigo-600 focus:ring-0 outline-none transition-all placeholder:text-gray-100 bg-gray-50/50 shadow-inner italic"
                            />

                            <div className="flex gap-6">
                                <button
                                    onClick={() => setOtpModal(false)}
                                    className="flex-1 py-7 text-gray-400 font-black hover:bg-gray-50 rounded-3xl transition-all uppercase tracking-widest text-sm"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={verifying || otpValue.length !== 6}
                                    className="flex-[2] py-7 bg-indigo-600 text-white font-black rounded-[40px] shadow-3xl shadow-indigo-200 hover:bg-indigo-700 disabled:bg-gray-200 transition-all text-2xl uppercase tracking-tighter"
                                >
                                    {verifying ? 'ĐANG XỬ LÝ...' : 'XÁC THỰC NGAY'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TPBank QR Escrow Modal Flow 3 */}
            {qrModal && activeMilestone && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/95 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[72px] shadow-3xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-700 border-4 border-white/20">
                        {/* QR Info Side */}
                        <div className="flex-[1.2] p-16 bg-neutral-900 text-white relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-4 mb-14 relative z-10">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-white/5">
                                    <Building2 className="w-8 h-8 text-neutral-900" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cổng thanh toán chuyên nghiệp</p>
                                    <p className="font-black text-3xl italic tracking-tighter text-white">TPBank Fast <span className="text-indigo-500">QR</span></p>
                                </div>
                            </div>

                            <div className="space-y-10 mb-16 relative z-10">
                                <div className="group">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 group-hover:text-indigo-400 transition-colors">Tài khoản thanh toán (Escrow)</p>
                                    <p className="text-4xl font-black text-white tracking-[0.2em] font-mono group-hover:scale-105 transition-transform origin-left">000 7824 1001</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Chủ tài khoản thụ hưởng</p>
                                    <p className="text-2xl font-black text-white uppercase tracking-tight italic">Vat Lieu So - Digital Escrow</p>
                                </div>
                                <div className="p-8 bg-indigo-600 rounded-[40px] shadow-2xl shadow-indigo-500/20">
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Số tiền cần nạp</p>
                                    <p className="text-6xl font-black text-white tracking-tighter tabular-nums font-serif">
                                        {activeMilestone.amount.toLocaleString()}
                                        <span className="text-2xl ml-2 font-black italic opacity-60 text-indigo-200">VNĐ</span>
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 italic text-sm text-gray-400 leading-relaxed font-medium relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                    <h5 className="text-white font-black uppercase text-xs tracking-widest not-italic">Hợp đồng bảo vệ (Escrow):</h5>
                                </div>
                                Khoản tiền này sẽ được hệ thống phong tỏa an toàn. Chúng tôi chỉ giải ngân cho nhà thầu khi bạn ký xác nhận hoàn thành đợt thi công này trên ứng dụng.
                            </div>
                        </div>

                        {/* QR Scan Side */}
                        <div className="flex-1 p-20 text-center bg-white flex flex-col justify-center items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <QrCode className="w-64 h-64 text-indigo-600" />
                            </div>

                            <div className="relative p-12 border-8 border-gray-50 rounded-[64px] mb-12 group bg-neutral-50 shadow-inner">
                                <div className="absolute inset-0 bg-white rounded-[56px] scale-95 group-hover:scale-100 transition-transform duration-500" />
                                <img
                                    src={`https://api.vietqr.io/image/TPB-00078241001-qr_only.jpg?amount=${activeMilestone.amount}&addInfo=MS_${activeMilestone.id.slice(-6)}`}
                                    alt="TPBank QR Code"
                                    className="w-72 h-72 relative z-10 rounded-[32px] shadow-2xl mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute -top-6 -left-6 w-16 h-16 bg-neutral-900 rounded-[28px] flex items-center justify-center text-white rotate-[-15deg] shadow-2xl border-4 border-white animate-bounce-slow">
                                    <QrCode className="w-8 h-8" />
                                </div>
                                <div className="absolute -bottom-4 -right-4 bg-indigo-600 px-6 py-2 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl rotate-3">
                                    Auto-Fill
                                </div>
                            </div>

                            <h4 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter italic">Quét để nạp tiền</h4>
                            <p className="text-gray-400 font-bold text-base mb-14 max-w-[280px] leading-relaxed">Sử dụng ứng dụng MB, TPBank, Vietcombank... để quét mã thanh toán tức thì.</p>

                            <div className="flex flex-col gap-4 w-full relative z-10">
                                <button
                                    onClick={() => handlePayment(activeMilestone.id)}
                                    className="w-full py-6 bg-neutral-900 text-white font-black rounded-[32px] shadow-3xl shadow-neutral-200 hover:bg-black transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group"
                                >
                                    <CheckCircle className="w-5 h-5 text-indigo-500 group-hover:scale-125 transition-transform" />
                                    Xác nhận đã chuyển tiền
                                </button>
                                <button
                                    onClick={() => setQrModal(false)}
                                    className="w-full py-5 text-gray-400 font-black hover:bg-neutral-50 rounded-[24px] transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Hủy giao dịch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
