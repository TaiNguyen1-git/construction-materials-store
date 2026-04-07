"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    MessageSquare,
    Coins,
    Calendar,
    MapPin,
    ArrowLeft,
    FileText,
    History,
    Building2,
    Send,
    User,
    Paperclip,
    Plus,
    AlertCircle,
    Download,
    MessageCircle,
    Zap,
    BarChart3,
    ArrowUpRight,
    Search,
    Filter,
    Edit3,
    Trash2
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import { formatCurrency } from '@/lib/format-utils'

interface QuoteRequest {
    id: string
    status: string
    details: string
    budget: number | null
    location: string | null
    startDate: string | null
    priceQuote: number | null
    response: string | null
    respondedAt: string | null
    createdAt: string
    attachments: string[]
    customer: {
        id: string
        user: { name: string, email: string, phone: string }
    }
    project: { name: string } | null
    conversationId: string | null
    history: any[]
}

export default function ContractorQuotesPage() {
    const { user } = useAuth()
    const [quotes, setQuotes] = useState<QuoteRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)

    // Reply form
    const [replyForm, setReplyForm] = useState({
        price: '',
        message: ''
    })
    const [items, setItems] = useState<any[]>([
        { description: '', quantity: 1, unit: 'm2', unitPrice: 0, category: 'Vật tư', isNew: true }
    ])
    const [milestones, setMilestones] = useState<any[]>([
        { name: 'Tạm ứng đợt 1', percentage: 20, description: 'Sau khi ký hợp đồng' },
        { name: 'Thanh toán đợt 2', percentage: 50, description: 'Sau khi xong phần thô' },
        { name: 'Quyết toán', percentage: 30, description: 'Sau khi bàn giao' }
    ])
    const [submitting, setSubmitting] = useState(false)

    const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

    useEffect(() => {
        if (user) {
            fetchQuotes()
        }
    }, [user])

    const fetchQuotes = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/quotes?type=received')
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

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit: 'm2', unitPrice: 0, category: 'Vật tư', isNew: true }])
    }

    const removeItem = (index: number) => {
        if (items.length <= 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleReply = async (action?: string) => {
        if (!selectedQuote || items.some(i => !i.description) || !replyForm.message) {
            toast.error('Vui lòng nhập đầy đủ thông tin báo giá và mô tả cam kết')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetchWithAuth(`/api/quotes/${selectedQuote.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action === 'CREATE_CHANGE_ORDER' ? undefined : 'REPLIED',
                    action: action,
                    priceQuote: totalPrice,
                    response: replyForm.message,
                    items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice) })),
                    milestones: milestones
                })
            })

            if (res.ok) {
                toast.success(action === 'CREATE_CHANGE_ORDER' ? 'Đã gửi báo giá phát sinh!' : 'Đã xác nhận báo giá thành công!')
                fetchQuotes()
                setSelectedQuote(null)
                setReplyForm({ price: '', message: '' })
            } else {
                const error = await res.json()
                toast.error(error.message || 'Có lỗi xảy ra trong quá trình truyền tải')
            }
        } catch (error) {
            toast.error('Lỗi kết nối mạng cục bộ')
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700'
            case 'REPLIED': return 'bg-blue-100 text-blue-700'
            case 'ACCEPTED': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20'
            case 'REJECTED': return 'bg-rose-100 text-rose-700'
            case 'CANCELLED': return 'bg-slate-100 text-slate-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'New Incoming'
            case 'REPLIED': return 'Bidding Sent'
            case 'ACCEPTED': return 'Contracted'
            case 'REJECTED': return 'Rejected'
            case 'CANCELLED': return 'Revoked'
            default: return status
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
            {/* High Impact Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Zap className="w-8 h-8 text-blue-600" />
                        Bidding Hub
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Commercial Strategy & Project Acquisition Center</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Size</p>
                        <p className="text-3xl font-bold text-slate-900 tabular-nums">{quotes.filter(q => q.status === 'PENDING').length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Acquired Projects</p>
                        <p className="text-3xl font-bold text-slate-900 tabular-nums">{quotes.filter(q => q.status === 'ACCEPTED').length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* List - Left Column - High Density Interaction */}
                <div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="bg-slate-50 h-32 rounded-3xl animate-pulse" />
                        ))
                    ) : quotes.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-16 border border-dashed border-slate-200 text-center space-y-6">
                            <History className="w-20 h-20 text-slate-100 mx-auto" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Vault is empty</p>
                        </div>
                    ) : (
                        quotes.map(quote => (
                            <div
                                key={quote.id}
                                onClick={() => {
                                    setSelectedQuote(quote)
                                    if (quote.status === 'REPLIED' || (quote as any).items?.length > 0) {
                                        setReplyForm({ price: quote.priceQuote?.toString() || '', message: quote.response || '' })
                                        if ((quote as any).items) setItems((quote as any).items)
                                    } else {
                                        setReplyForm({ price: '', message: '' })
                                        setItems([{ description: '', quantity: 1, unit: 'm2', unitPrice: 0, category: 'Vật tư', isNew: true }])
                                    }
                                }}
                                className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden ${selectedQuote?.id === quote.id
                                    ? 'bg-blue-50 border-blue-600 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[9px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-600 text-white' : getStatusStyle(quote.status)}`}>
                                        {getStatusText(quote.status)}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedQuote?.id === quote.id ? 'text-blue-600/60' : 'text-slate-400'}`}>
                                        {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-lg flex items-center gap-2 transition-colors tracking-tight ${selectedQuote?.id === quote.id ? 'text-blue-900' : 'text-slate-900'}`}>
                                    #{quote.id.slice(-6).toUpperCase()}
                                </h3>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedQuote?.id === quote.id ? 'text-blue-600/80' : 'text-slate-400'}`}>{quote.customer.user.name}</p>
                                <p className={`text-[11px] mt-4 line-clamp-2 leading-relaxed font-medium ${selectedQuote?.id === quote.id ? 'text-slate-600' : 'text-slate-500'}`}>{quote.details}</p>

                                <div className={`mt-5 pt-4 border-t flex items-center justify-between ${selectedQuote?.id === quote.id ? 'border-blue-100' : 'border-slate-50'}`}>
                                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${selectedQuote?.id === quote.id ? 'text-blue-500' : 'text-slate-400'}`}>
                                        <MapPin className="w-3 h-3" />
                                        {quote.location || 'GLOBAL'}
                                    </div>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${selectedQuote?.id === quote.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Area - High Premium Commercial Interface */}
                <div className="lg:col-span-8 h-full">
                    {selectedQuote ? (
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[800px] flex flex-col animate-in slide-in-from-right-10 duration-700">
                            {/* Detailed Commercial Header */}
                            <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50 relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chi tiết báo giá</h2>
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm ${selectedQuote.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                    {getStatusText(selectedQuote.status)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã định danh: <span className="text-slate-900">#{selectedQuote.id.toUpperCase()}</span></p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link
                                                href={`/contractor/quotes/${selectedQuote.id}/negotiate`}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20"
                                            >
                                                <Zap className="w-4 h-4 fill-current" />
                                                Live Strategy
                                            </Link>
                                            <button className="w-12 h-12 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center transition-all group shadow-sm">
                                                <Download size={20} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-y-0.5 transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Counterparty', value: selectedQuote.customer.user.name, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Project Mapping', value: selectedQuote.project?.name || 'Open Portfolio', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'Liquidity Reserve', value: `${selectedQuote.budget?.toLocaleString()}đ`, icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all duration-300">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{stat.label}</p>
                                                    <p className="font-bold text-slate-900 text-xs truncate uppercase tracking-tight">{stat.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Requirements Display */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        Primary Objectives & Constraints
                                    </h4>
                                    <div className="p-6 bg-slate-50 rounded-2xl text-slate-700 leading-relaxed border border-slate-100 font-medium italic text-sm">
                                        "{selectedQuote.details}"
                                    </div>
                                </div>

                                {/* BoQ Dynamic Editor */}
                                <div className="space-y-5">
                                    <div className="flex justify-between items-end px-1">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill of Quantities</h4>
                                            <p className="text-xl font-bold text-slate-900 tracking-tight uppercase">Bảng phân rã hạng mục</p>
                                        </div>
                                        {(selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' || selectedQuote.status === 'ACCEPTED') && (
                                            <button
                                                onClick={addItem}
                                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-md active:scale-95"
                                            >
                                                <Plus size={14} /> Thêm hạng mục
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400">
                                                    <th className="py-4 px-6 text-left font-bold uppercase tracking-widest">Mô tả hạng mục</th>
                                                    <th className="py-4 px-2 text-center w-20 font-bold uppercase tracking-widest">SL</th>
                                                    <th className="py-4 px-2 text-center w-20 font-bold uppercase tracking-widest">ĐVT</th>
                                                    <th className="py-4 px-4 text-right w-36 font-bold uppercase tracking-widest">Đơn giá</th>
                                                    <th className="py-4 px-6 text-right w-40 font-bold uppercase tracking-widest">Thành tiền</th>
                                                    <th className="py-4 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-slate-50/30 transition-all">
                                                        <td className="py-5 px-6">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-900 p-0 placeholder:text-slate-200"
                                                                placeholder="NHẬP MÔ TẢ HẠNG MỤC..."
                                                                value={item.description}
                                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                                disabled={selectedQuote.status === 'ACCEPTED' && !item.isNew}
                                                            />
                                                        </td>
                                                        <td className="py-5 px-2">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-none focus:ring-0 text-center font-bold p-0 text-slate-400 tabular-nums"
                                                                value={item.quantity}
                                                                onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="py-5 px-2">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-0 text-center font-bold p-0 text-slate-300 uppercase text-[9px] tracking-widest"
                                                                value={item.unit}
                                                                onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-none focus:ring-0 text-right font-bold p-0 text-blue-600 tabular-nums"
                                                                value={item.unitPrice}
                                                                onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-5 px-6 text-right font-bold text-slate-900 tabular-nums text-sm">
                                                            {(item.quantity * (parseFloat(item.unitPrice) || 0)).toLocaleString()}đ
                                                        </td>
                                                        <td className="py-5 text-right pr-4">
                                                            <button 
                                                                onClick={() => removeItem(idx)} 
                                                                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-900 text-white">
                                                    <td colSpan={4} className="py-6 px-6 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Tổng cộng báo giá dự toán</td>
                                                    <td className="py-6 px-6 text-2xl font-bold text-right tracking-tight text-blue-400 tabular-nums">
                                                        {totalPrice.toLocaleString()}đ
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Decision Support & Communications */}
                                <div className="space-y-6">
                                    {selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' ? (
                                        <div className="space-y-5">
                                            <div className="space-y-1.5">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Strategic Narrative</h4>
                                                <textarea
                                                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 outline-none min-h-[120px] font-bold text-xs shadow-inner transition-all placeholder:text-slate-300"
                                                    placeholder="Articulate your technical commitment, SLA, and operational delivery timeline..."
                                                    value={replyForm.message}
                                                    onChange={e => setReplyForm({ ...replyForm, message: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleReply()}
                                                disabled={submitting}
                                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 group active:scale-95"
                                            >
                                                {submitting ? (
                                                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                        Execute Transmission
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : selectedQuote.status === 'ACCEPTED' ? (
                                        <div className="space-y-6 animate-in zoom-in duration-500">
                                            <div className="bg-emerald-50/50 p-10 rounded-3xl border-2 border-emerald-500 border-dashed text-center flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold text-emerald-900 uppercase tracking-tight">Agreement Finalized</h3>
                                                    <p className="text-emerald-700 font-bold text-[9px] uppercase tracking-widest max-w-sm mx-auto">Tất cả điều khoản đã được đối tác phê chuẩn. Bạn có thể khởi tạo Change Order cho các hạng mục phát sinh.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleReply('CREATE_CHANGE_ORDER')}
                                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <Plus size={20} />
                                                Initiate Change Order
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-16 bg-slate-50 rounded-3xl text-center">
                                            <span className="text-2xl font-bold text-slate-200 uppercase tracking-widest">Deactivated Status</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-16 text-center space-y-8 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600/5 blur-[40px] rounded-full group-hover:bg-blue-600/10 transition-all duration-700"></div>
                                <FileText className="w-40 h-40 text-slate-50 relative z-10 group-hover:scale-105 transition-transform duration-700" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Commercial Review Required</h3>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed text-[10px] uppercase tracking-widest opacity-60">Vui lòng chọn một bản ghi đấu thầu từ bảng điều khiển bên trái để bắt đầu phân tích kỹ thuật và định giá thương mại.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
