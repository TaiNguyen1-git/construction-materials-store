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
            case 'PENDING': return 'Chờ xử lý'
            case 'REPLIED': return 'Đã gửi báo giá'
            case 'ACCEPTED': return 'Đã chốt HĐ'
            case 'REJECTED': return 'Từ chối'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        Báo giá & Đấu thầu
                    </h1>
                    <p className="text-slate-500 text-sm">Quản lý yêu cầu báo giá và chiến lược đấu thầu dự án</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Chờ xử lý</p>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{quotes.filter(q => q.status === 'PENDING').length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Dự án đã chốt</p>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{quotes.filter(q => q.status === 'ACCEPTED').length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* List - Left Column */}
                <div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="bg-slate-50 h-32 rounded-xl animate-pulse border border-slate-100" />
                        ))
                    ) : quotes.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl p-12 border-2 border-dashed border-slate-200 text-center space-y-4">
                            <History className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-slate-500 font-medium text-sm">Chưa có yêu cầu báo giá nào</p>
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
                                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer group ${selectedQuote?.id === quote.id
                                    ? 'bg-blue-50 border-blue-600 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${selectedQuote?.id === quote.id ? 'bg-blue-600 text-white' : getStatusStyle(quote.status)}`}>
                                        {getStatusText(quote.status)}
                                    </span>
                                    <span className={`text-xs font-medium ${selectedQuote?.id === quote.id ? 'text-blue-600/80' : 'text-slate-500'}`}>
                                        {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <h3 className={`font-bold text-base flex items-center gap-2 ${selectedQuote?.id === quote.id ? 'text-blue-900' : 'text-slate-900'}`}>
                                    #{quote.id.slice(-6).toUpperCase()}
                                </h3>
                                <p className={`text-sm font-medium mt-1 ${selectedQuote?.id === quote.id ? 'text-blue-800' : 'text-slate-600'}`}>{quote.customer.user.name}</p>
                                <p className={`text-sm mt-3 line-clamp-2 leading-relaxed ${selectedQuote?.id === quote.id ? 'text-blue-700/80' : 'text-slate-500'}`}>{quote.details}</p>

                                <div className={`mt-4 pt-4 border-t flex items-center justify-between ${selectedQuote?.id === quote.id ? 'border-blue-200' : 'border-slate-100'}`}>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${selectedQuote?.id === quote.id ? 'text-blue-700' : 'text-slate-500'}`}>
                                        <MapPin className="w-3.5 h-3.5" />
                                        {quote.location || 'Toàn quốc'}
                                    </div>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedQuote?.id === quote.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Area */}
                <div className="lg:col-span-8 h-full">
                    {selectedQuote ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500">
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 bg-white">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-slate-900">Chi tiết Báo giá</h2>
                                            <span className={`px-3 py-1 rounded-md text-xs font-semibold ${selectedQuote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {getStatusText(selectedQuote.status)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500">ID: #{selectedQuote.id.toUpperCase()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/contractor/quotes/${selectedQuote.id}/negotiate`}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Thương thảo Live
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Khách hàng', value: selectedQuote.customer.user.name, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: 'Dự án liên kết', value: selectedQuote.project?.name || 'Chưa liên kết', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Ngân sách (dự kiến)', value: `${selectedQuote.budget?.toLocaleString() || 0}đ`, icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                <stat.icon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500 font-semibold mb-0.5">{stat.label}</p>
                                                <p className="font-bold text-slate-900 text-sm truncate">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Requirements */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                        Yêu cầu từ khách hàng
                                    </h4>
                                    <div className="p-5 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-100 text-sm">
                                        {selectedQuote.details}
                                    </div>
                                </div>

                                {/* BoQ Editor */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="text-sm font-bold text-slate-900">Bảng phân rã hạng mục báo giá (BOQ)</h4>
                                        {(selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' || selectedQuote.status === 'ACCEPTED') && (
                                            <button
                                                onClick={addItem}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Thêm hạng mục
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-hidden border border-slate-200 rounded-xl bg-white">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                                    <th className="py-3 px-4 text-left font-semibold">Hạng mục</th>
                                                    <th className="py-3 px-2 text-center w-20 font-semibold">SL</th>
                                                    <th className="py-3 px-2 text-center w-20 font-semibold">ĐVT</th>
                                                    <th className="py-3 px-4 text-right w-36 font-semibold">Đơn giá</th>
                                                    <th className="py-3 px-4 text-right w-40 font-semibold">Thành tiền</th>
                                                    <th className="py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                                        <td className="py-3 px-4">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-0 font-medium text-slate-900 p-0 placeholder:text-slate-300"
                                                                placeholder="Mô tả hạng mục..."
                                                                value={item.description}
                                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                                disabled={selectedQuote.status === 'ACCEPTED' && !item.isNew}
                                                            />
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-none focus:ring-0 text-center p-0 tabular-nums text-slate-700"
                                                                value={item.quantity}
                                                                onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-0 text-center p-0 text-slate-500 uppercase text-xs"
                                                                value={item.unit}
                                                                onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-none focus:ring-0 text-right p-0 tabular-nums text-slate-700"
                                                                value={item.unitPrice}
                                                                onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                                                            {(item.quantity * (parseFloat(item.unitPrice) || 0)).toLocaleString()}đ
                                                        </td>
                                                        <td className="py-3 text-right pr-4">
                                                            <button 
                                                                onClick={() => removeItem(idx)} 
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-50 border-t border-slate-200">
                                                    <td colSpan={4} className="py-4 px-4 font-bold text-slate-700">TỔNG BÁO GIÁ</td>
                                                    <td className="py-4 px-4 text-lg font-bold text-right text-blue-600 tabular-nums">
                                                        {totalPrice.toLocaleString()}đ
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    {selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <h4 className="text-sm font-bold text-slate-900">Cam kết & Thông điệp gửi khách hàng</h4>
                                                <textarea
                                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-sm min-h-[100px] transition-all"
                                                    placeholder="Ghi chú về tiến độ thi công, bảo hành, cam kết chất lượng..."
                                                    value={replyForm.message}
                                                    onChange={e => setReplyForm({ ...replyForm, message: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleReply()}
                                                disabled={submitting}
                                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                            >
                                                {submitting ? (
                                                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" /> Gửi Báo Giá Ngay
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : selectedQuote.status === 'ACCEPTED' ? (
                                        <div className="space-y-4">
                                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center space-y-2">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-2 shadow-sm">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <h3 className="text-emerald-800 font-bold">Khách hàng đã chấp thuận</h3>
                                                <p className="text-emerald-600 text-sm">Hợp đồng đã thiết lập. Bạn có thể tạo Phụ lục phát sinh (Change Order) nếu cần.</p>
                                            </div>
                                            <button
                                                onClick={() => handleReply('CREATE_CHANGE_ORDER')}
                                                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex justify-center items-center gap-2"
                                            >
                                                <Plus size={16} /> Tạo hạng mục Phát sinh
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                                            <p className="font-semibold text-slate-500">Yêu cầu báo giá đã vô hiệu hóa</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <FileText className="w-24 h-24 text-slate-200" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-700">Chưa chọn yêu cầu</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto">Vui lòng chọn một yêu cầu báo giá từ danh sách bên trái để bắt đầu lập dự toán và gửi phản hồi.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
