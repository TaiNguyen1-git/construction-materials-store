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
    DollarSign,
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
    Zap
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

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
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)

    // Reply form
    const [replyForm, setReplyForm] = useState({
        price: '',
        message: ''
    })
    const [items, setItems] = useState<any[]>([
        { description: '', quantity: 1, unit: 'm2', unitPrice: 0, category: 'Vật tư' }
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
        setItems([...items, { description: '', quantity: 1, unit: 'm2', unitPrice: 0, category: 'Vật tư' }])
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
            alert('Vui lòng nhập đầy đủ thông tin báo giá và mô tả')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetchWithAuth(`/api/quotes/${selectedQuote.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                toast.success(action === 'CREATE_CHANGE_ORDER' ? 'Đã gửi báo giá phát sinh!' : 'Đã gửi báo giá thành công!')
                fetchQuotes()
                setSelectedQuote(null)
                setReplyForm({ price: '', message: '' })
            } else {
                const error = await res.json()
                toast.error(error.message || 'Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700'
            case 'REPLIED': return 'bg-blue-100 text-blue-700'
            case 'ACCEPTED': return 'bg-green-100 text-green-700 font-bold ring-1 ring-green-600'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            case 'CANCELLED': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Mới nhận'
            case 'REPLIED': return 'Đã báo giá'
            case 'ACCEPTED': return 'Đã chốt (ACCEPTED)'
            case 'REJECTED': return 'Đã bị từ chối'
            case 'CANCELLED': return 'Khách đã hủy'
            default: return status
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Trung tâm Báo giá</h1>
                            <p className="text-xs text-gray-500 font-medium">Bảng điều khiển kinh doanh & Đấu thầu dự án</p>
                        </div>
                        <div className="hidden md:flex gap-3">
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Đang chờ</p>
                                    <p className="font-black text-lg leading-none">{quotes.filter(q => q.status === 'PENDING').length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Thành công</p>
                                    <p className="font-black text-lg leading-none">{quotes.filter(q => q.status === 'ACCEPTED').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* List - Left Column */}
                        <div className="lg:col-span-4 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white h-32 rounded-3xl animate-pulse" />
                                ))
                            ) : quotes.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-gray-200 text-center">
                                    <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold italic uppercase tracking-widest text-xs">Chưa có yêu cầu mới</p>
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
                                                setItems([{ description: '', quantity: 1, unit: 'm2', unitPrice: 0, category: 'Vật tư' }])
                                            }
                                        }}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedQuote?.id === quote.id
                                            ? 'bg-white border-primary-500 shadow-lg shadow-primary-50 ring-2 ring-primary-50/50'
                                            : 'bg-white border-transparent hover:border-gray-100 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${getStatusStyle(quote.status)}`}>
                                                {getStatusText(quote.status)}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-gray-900 text-base flex items-center gap-2 group-hover:text-primary-600 transition-colors">
                                            #{quote.id.slice(-6).toUpperCase()}
                                        </h3>
                                        <p className="text-xs font-bold text-gray-400 mt-0.5">{quote.customer.user.name}</p>
                                        <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed italic">"{quote.details}"</p>

                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                                <MapPin className="w-3 h-3" />
                                                {quote.location || 'Toàn quốc'}
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all">
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Detail - Right Column */}
                        <div className="lg:col-span-8">
                            {selectedQuote ? (
                                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-full">
                                    <div className="p-6 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/30">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className="text-xl font-black text-gray-900 tracking-tighter italic">Chi tiết Thỏa thuận</h2>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(selectedQuote.status)}`}>
                                                        {getStatusText(selectedQuote.status)}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-400">Mã giao dịch: #{selectedQuote.id.toUpperCase()}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.print()}
                                                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-100 bg-white text-gray-900 rounded-xl font-black text-xs hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    XUẤT PDF
                                                </button>
                                                <Link
                                                    href={`/contractor/quotes/${selectedQuote.id}/negotiate`}
                                                    className="relative flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 hover:translate-y-[-1px] hover:shadow-lg transition-all"
                                                >
                                                    <Zap className="w-4 h-4 fill-current animate-pulse text-yellow-300" />
                                                    VÀO PHÒNG CHIẾN LƯỢC
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
                                                </Link>
                                                {selectedQuote.conversationId && (
                                                    <Link
                                                        href={`/contractor/messages?id=${selectedQuote.conversationId}`}
                                                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs hover:translate-y-[-1px] hover:shadow-lg transition-all"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        TRAO ĐỔI VỚI KHÁCH
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Khách hàng</p>
                                                    <p className="font-black text-gray-900 text-sm whitespace-nowrap">{selectedQuote.customer.user.name}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Dự án</p>
                                                    <p className="font-black text-gray-900 text-sm truncate w-24">{selectedQuote.project?.name || 'Tự do'}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Ngân sách</p>
                                                    <p className="font-black text-gray-900 text-sm">{selectedQuote.budget?.toLocaleString()}đ</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-8">
                                        {/* Requirements */}
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Yêu cầu từ khách hàng
                                            </h4>
                                            <div className="p-5 bg-gray-50/50 rounded-2xl text-gray-700 leading-relaxed border border-gray-100 font-medium text-sm italic">
                                                "{selectedQuote.details}"
                                            </div>
                                        </div>

                                        {/* BoQ Editor */}
                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="flex justify-between items-center mb-5">
                                                <h4 className="text-lg font-black text-gray-900 tracking-tighter">
                                                    {selectedQuote.status === 'ACCEPTED' ? 'Điều chỉnh Phát sinh' : 'Bảng Khối Lượng BoQ'}
                                                </h4>
                                                {(selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' || selectedQuote.status === 'ACCEPTED') && (
                                                    <button
                                                        onClick={addItem}
                                                        className="px-4 py-1.5 bg-primary-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-1.5"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Thêm hạng mục
                                                    </button>
                                                )}
                                            </div>

                                            <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-md">
                                                <table className="w-full text-[12px]">
                                                    <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[9px] tracking-widest">
                                                        <tr>
                                                            <th className="py-3 px-5 text-left">Mô tả chi tiết hạng mục</th>
                                                            <th className="py-3 px-2 text-center w-16">SL</th>
                                                            <th className="py-3 px-2 text-center w-16">Đơn vị</th>
                                                            <th className="py-3 px-4 text-right w-32">Đơn giá</th>
                                                            <th className="py-3 px-6 text-right w-32">Thành tiền</th>
                                                            <th className="py-3 w-8"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {items.map((item, idx) => (
                                                            <tr key={idx} className="group hover:bg-gray-50/30">
                                                                <td className="py-3 px-5">
                                                                    <input
                                                                        className="w-full bg-transparent border-none focus:ring-0 font-bold text-gray-900 p-0 placeholder:font-medium placeholder:text-gray-300"
                                                                        placeholder="VD: Xi măng Hà Tiên loại 1..."
                                                                        value={item.description}
                                                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                                                        disabled={selectedQuote.status === 'ACCEPTED' && !item.isNew}
                                                                    />
                                                                </td>
                                                                <td className="py-3 px-2">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent border-none focus:ring-0 text-center font-bold p-0 text-gray-500"
                                                                        value={item.quantity}
                                                                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                    />
                                                                </td>
                                                                <td className="py-3 px-2">
                                                                    <input
                                                                        className="w-full bg-transparent border-none focus:ring-0 text-center font-bold p-0 text-gray-400 uppercase text-[10px]"
                                                                        value={item.unit}
                                                                        onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent border-none focus:ring-0 text-right font-black p-0 text-primary-600"
                                                                        value={item.unitPrice}
                                                                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="py-3 px-6 text-right font-black text-gray-900">
                                                                    {(item.quantity * (parseFloat(item.unitPrice) || 0)).toLocaleString()}đ
                                                                </td>
                                                                <td className="py-3 text-right pr-2">
                                                                    <button onClick={() => removeItem(idx)} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-sm">✕</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-900 text-white">
                                                        <tr>
                                                            <td colSpan={4} className="py-6 px-6 text-sm font-black italic tracking-widest opacity-60 uppercase">TỔNG GIÁ TRỊ PHÊ DUYỆT</td>
                                                            <td className="py-6 px-6 text-xl font-black text-right tracking-tighter text-indigo-400">
                                                                {totalPrice.toLocaleString()}đ
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pb-6">
                                            {selectedQuote.status === 'PENDING' || selectedQuote.status === 'REPLIED' ? (
                                                <div className="space-y-4">
                                                    <textarea
                                                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-primary-500 outline-none min-h-[120px] font-medium text-sm shadow-inner"
                                                        placeholder="Mô tả cam kết kỹ thuật & thời gian hoàn thành mong muốn..."
                                                        value={replyForm.message}
                                                        onChange={e => setReplyForm({ ...replyForm, message: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => handleReply()}
                                                        disabled={submitting}
                                                        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-lg hover:bg-primary-700 shadow-xl shadow-primary-50 transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 group"
                                                    >
                                                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                        {submitting ? 'ĐANG GỬI...' : 'XÁC NHẬN GỬI BÁO GIÁ CHI TIẾT'}
                                                    </button>
                                                </div>
                                            ) : selectedQuote.status === 'ACCEPTED' ? (
                                                <div className="space-y-4">
                                                    <div className="bg-green-50 p-6 rounded-3xl border border-green-200 border-dashed text-center">
                                                        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                                                        <h3 className="text-xl font-black text-green-900">Báo giá này đã được ký kết!</h3>
                                                        <p className="text-green-700 font-medium text-sm">Bạn có thể gửi <strong>Báo giá bổ sung (Change Order)</strong> nếu dự án có phát sinh mới.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleReply('CREATE_CHANGE_ORDER')}
                                                        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-lg hover:bg-orange-600 shadow-xl shadow-orange-50 transition-all flex items-center justify-center gap-3"
                                                    >
                                                        <Plus className="w-6 h-6" />
                                                        GỬI BÁO GIÁ PHÁT SINH BỔ SUNG
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-8 bg-gray-100 rounded-3xl text-center font-black text-gray-300 uppercase tracking-widest italic text-lg">
                                                    YÊU CẦU ĐÃ {getStatusText(selectedQuote.status).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-white rounded-[48px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center p-20 text-center text-gray-200 group">
                                    <FileText className="w-32 h-32 mb-8 opacity-5 group-hover:opacity-10 transition-opacity" />
                                    <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tighter">Bàn Soạn Báo Giá</h3>
                                    <p className="text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">Vui lòng chọn một yêu cầu bên cột trái để tiến hành bóc tách khối lượng (BoQ) và gửi bản chào thầu chuyên nghiệp.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
