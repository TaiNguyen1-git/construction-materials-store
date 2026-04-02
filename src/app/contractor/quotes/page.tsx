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
            <div className="grid lg:grid-cols-4 gap-6 items-end">
                <div className="lg:col-span-2 space-y-2">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-6">
                        <Zap className="w-14 h-14 text-blue-600 fill-current" />
                        Bidding Hub
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.3em] ml-20">Commercial Strategy & Project Acquisition Center</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Size</p>
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter tabular-nums">{quotes.filter(q => q.status === 'PENDING').length}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <Clock size={28} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acquired Projects</p>
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter tabular-nums">{quotes.filter(q => q.status === 'ACCEPTED').length}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <CheckCircle size={28} />
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
                                className={`p-8 rounded-[2.5rem] border-[3px] transition-all duration-500 cursor-pointer group relative overflow-hidden ${selectedQuote?.id === quote.id
                                    ? 'bg-slate-900 border-blue-600 shadow-2xl shadow-blue-900/40 translate-x-2'
                                    : 'bg-white border-transparent hover:border-slate-100 shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-600 text-white' : getStatusStyle(quote.status)}`}>
                                        {getStatusText(quote.status)}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedQuote?.id === quote.id ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <h3 className={`font-black text-xl flex items-center gap-3 transition-colors uppercase italic tracking-tighter ${selectedQuote?.id === quote.id ? 'text-white' : 'text-slate-900'}`}>
                                    #{quote.id.slice(-6).toUpperCase()}
                                </h3>
                                <p className={`text-xs font-black uppercase tracking-widest mt-1 ${selectedQuote?.id === quote.id ? 'text-blue-400/80' : 'text-slate-400'}`}>{quote.customer.user.name}</p>
                                <p className={`text-[11px] mt-4 line-clamp-2 leading-relaxed italic font-medium ${selectedQuote?.id === quote.id ? 'text-slate-400' : 'text-slate-500'}`}>"{quote.details}"</p>

                                <div className={`mt-6 pt-6 border-t flex items-center justify-between ${selectedQuote?.id === quote.id ? 'border-white/5' : 'border-slate-50'}`}>
                                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${selectedQuote?.id === quote.id ? 'text-slate-500' : 'text-slate-300'}`}>
                                        <MapPin className="w-3 h-3" />
                                        {quote.location || 'GLOBAL'}
                                    </div>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${selectedQuote?.id === quote.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Area - High Premium Commercial Interface */}
                <div className="lg:col-span-8 h-full">
                    {selectedQuote ? (
                        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[800px] flex flex-col animate-in slide-in-from-right-10 duration-700">
                            {/* Detailed Commercial Header */}
                            <div className="p-12 border-b border-slate-50 bg-slate-900 text-white relative">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-6">
                                                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Negotiation Console</h2>
                                                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/10 ${selectedQuote.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                    {getStatusText(selectedQuote.status)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Commercial Transaction Ref: <span className="text-white">#{selectedQuote.id.toUpperCase()}</span></p>
                                        </div>
                                        <div className="flex gap-4">
                                            <Link
                                                href={`/contractor/quotes/${selectedQuote.id}/negotiate`}
                                                className="px-10 py-5 bg-white text-slate-900 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl shadow-white/5"
                                            >
                                                <Zap className="w-5 h-5 fill-current text-blue-600" />
                                                Live Strategy
                                            </Link>
                                            <button className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-[1.8rem] flex items-center justify-center transition-all group">
                                                <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        {[
                                            { label: 'Counterparty', value: selectedQuote.customer.user.name, icon: User, color: 'text-blue-400' },
                                            { label: 'Project Mapping', value: selectedQuote.project?.name || 'Open Portfolio', icon: Building2, color: 'text-emerald-400' },
                                            { label: 'Liquidity Reserve', value: `${selectedQuote.budget?.toLocaleString()}đ`, icon: Coins, color: 'text-orange-400' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 flex items-center gap-6 group hover:bg-white/10 transition-all duration-500">
                                                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                                                    <stat.icon size={24} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                                    <p className="font-black text-white text-sm truncate uppercase italic tracking-tighter">{stat.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Requirements Display */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 text-orange-500" />
                                        Primary Objectives & Constraints
                                    </h4>
                                    <div className="p-10 bg-slate-50 rounded-[3rem] text-slate-800 leading-relaxed border border-slate-100 font-bold italic text-lg shadow-inner">
                                        "{selectedQuote.details}"
                                    </div>
                                </div>

                                {/* BoQ Dynamic Editor */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end px-4">
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Bill of Quantities</h4>
                                            <p className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Commercial Itemization</p>
                                        </div>
                                        {(selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' || selectedQuote.status === 'ACCEPTED') && (
                                            <button
                                                onClick={addItem}
                                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
                                            >
                                                <Plus size={16} /> Insert Asset
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-hidden border border-slate-100 rounded-[3rem] bg-white shadow-xl shadow-slate-200/20">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50/80">
                                                    <th className="py-8 px-10 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Detailed Description</th>
                                                    <th className="py-8 px-4 text-center w-24 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Volume</th>
                                                    <th className="py-8 px-4 text-center w-24 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Unit</th>
                                                    <th className="py-8 px-6 text-right w-44 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Unit Rate</th>
                                                    <th className="py-8 px-10 text-right w-48 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Financial Value</th>
                                                    <th className="py-8 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                                        <td className="py-8 px-10">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-0 font-black text-sm text-slate-900 p-0 placeholder:text-slate-200 uppercase tracking-tight italic"
                                                                placeholder="ASSET DESCRIPTION..."
                                                                value={item.description}
                                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                                disabled={selectedQuote.status === 'ACCEPTED' && !item.isNew}
                                                            />
                                                        </td>
                                                        <td className="py-8 px-4">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-none focus:ring-0 text-center font-black p-0 text-slate-400 tabular-nums"
                                                                value={item.quantity}
                                                                onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="py-8 px-4">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-0 text-center font-black p-0 text-slate-300 uppercase text-[10px] tracking-widest"
                                                                value={item.unit}
                                                                onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-8 px-6">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-none focus:ring-0 text-right font-black p-0 text-blue-600 tabular-nums italic"
                                                                value={item.unitPrice}
                                                                onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-8 px-10 text-right font-black text-slate-900 tabular-nums italic text-sm">
                                                            {(item.quantity * (parseFloat(item.unitPrice) || 0)).toLocaleString()}đ
                                                        </td>
                                                        <td className="py-8 text-right pr-6">
                                                            <button 
                                                                onClick={() => removeItem(idx)} 
                                                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-950 text-white">
                                                    <td colSpan={4} className="py-12 px-10 text-sm font-black italic tracking-[0.4em] text-slate-500 uppercase">Valuation Baseline Aggregate</td>
                                                    <td className="py-12 px-10 text-4xl font-black text-right tracking-tighter text-blue-400 italic tabular-nums">
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
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Strategic Narrative</h4>
                                                <textarea
                                                    className="w-full p-10 bg-slate-50 border border-slate-100 rounded-[3rem] focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 outline-none min-h-[150px] font-bold text-sm shadow-inner transition-all placeholder:text-slate-300"
                                                    placeholder="Articulate your technical commitment, SLA, and operational delivery timeline..."
                                                    value={replyForm.message}
                                                    onChange={e => setReplyForm({ ...replyForm, message: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleReply()}
                                                disabled={submitting}
                                                className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] italic hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-6 disabled:bg-slate-200 group active:scale-95"
                                            >
                                                {submitting ? (
                                                    <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full" />
                                                ) : (
                                                    <>
                                                        <Send className="w-8 h-8 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform" />
                                                        Execute Transmission
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : selectedQuote.status === 'ACCEPTED' ? (
                                        <div className="space-y-8 animate-in zoom-in duration-500">
                                            <div className="bg-emerald-50/50 p-12 rounded-[4rem] border-[3px] border-emerald-500 border-dashed text-center flex flex-col items-center gap-6">
                                                <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                                                    <CheckCircle size={40} />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-3xl font-black text-emerald-900 uppercase italic tracking-tighter">Agreement Finalized</h3>
                                                    <p className="text-emerald-700 font-bold text-[10px] uppercase tracking-[0.2em] max-w-sm mx-auto">Tất cả điều khoản đã được đối tác phê chuẩn. Bạn có thể khởi tạo Change Order cho các hạng mục phát sinh.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleReply('CREATE_CHANGE_ORDER')}
                                                className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] italic hover:bg-black shadow-2xl shadow-slate-900/10 transition-all flex items-center justify-center gap-6 active:scale-95"
                                            >
                                                <Plus size={32} />
                                                Initiate Change Order
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-20 bg-slate-50 rounded-[4rem] text-center">
                                            <span className="text-4xl font-black text-slate-200 uppercase tracking-[0.4em] italic">Deactivated Status</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-[4rem] border-[3px] border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center space-y-10 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600/5 blur-[50px] rounded-full group-hover:bg-blue-600/10 transition-all duration-700"></div>
                                <FileText className="w-48 h-48 text-slate-50 relative z-10 group-hover:scale-110 transition-transform duration-700 hover:rotate-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Commercial Review Required</h3>
                                <p className="text-slate-400 font-bold max-w-md mx-auto leading-relaxed text-[11px] uppercase tracking-[0.2em] opacity-60">Vui lòng chọn một bản ghi đấu thầu từ bảng điều khiển bên trái để bắt đầu phân tích kỹ thuật và định giá thương mại.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
