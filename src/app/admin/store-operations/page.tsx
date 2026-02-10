'use client'

import { useState, useEffect } from 'react'
import {
    Store,
    Truck,
    Wallet,
    History,
    Plus,
    Search,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    DollarSign,
    User,
    ChevronRight,
    Filter,
    Trash2,
    Edit,
    MoreVertical,
    PlusCircle,
    Package,
    ArrowRight
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import FormattedNumberInput from '@/components/FormattedNumberInput'

interface QuickQuote {
    id: string
    customerName: string
    customerPhone: string
    projectName?: string
    totalAmount: number
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    createdAt: string
}

interface DispatchOrder {
    id: string
    orderNumber: string
    customerName: string
    status: string
    totalAmount: number
    driverId?: string
    driver?: { user: { name: string } }
}

interface CashItem {
    id: string
    orderNumber: string
    customerName: string
    amount: number
    cashCollectedAt: string
}

interface Expense {
    id: string
    category: string
    amount: number
    description: string
    date: string
}

interface Driver {
    id: string
    user: { name: string }
    status: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE'
}

export default function StoreOperationsPage() {
    const [activeTab, setActiveTab] = useState<'quotes' | 'dispatch' | 'cash' | 'expenses'>('dispatch')
    const [loading, setLoading] = useState(true)

    // Data states
    const [quotes, setQuotes] = useState<QuickQuote[]>([])
    const [orders, setOrders] = useState<DispatchOrder[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [cashItems, setCashItems] = useState<CashItem[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [orderIdBeingDraggedOver, setOrderIdBeingDraggedOver] = useState<string | null>(null)

    // Form states
    const [quoteForm, setQuoteForm] = useState({
        customerName: '',
        customerPhone: '',
        totalAmount: 0,
        notes: ''
    })
    const [expenseForm, setExpenseForm] = useState({
        category: 'FUEL',
        amount: 0,
        description: ''
    })

    // Modal states
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoading(true)

            const [dispatchRes, quotesRes, cashRes, expenseRes] = await Promise.all([
                fetchWithAuth('/api/store/dispatch'),
                fetchWithAuth('/api/store/quotes'),
                fetchWithAuth('/api/store/cash-handover'),
                fetchWithAuth('/api/store/expenses')
            ])

            if (dispatchRes.ok) {
                const data = await dispatchRes.json()
                setOrders(data.data.orders.map((o: any) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.customerName || (o.customer?.name) || o.guestName || 'N/A',
                    status: o.status,
                    totalAmount: o.totalAmount,
                    driverId: o.driverId,
                    driver: o.driver
                })))
                setDrivers(data.data.drivers.map((d: any) => ({
                    id: d.id,
                    user: d.user,
                    status: 'AVAILABLE' // Simplify for now
                })))
            }

            if (quotesRes.ok) {
                const data = await quotesRes.json()
                setQuotes(data.data)
            }

            if (cashRes.ok) {
                const data = await cashRes.json()
                setCashItems(data.data.map((item: any) => ({
                    id: item.id,
                    orderNumber: item.orderNumber,
                    customerName: item.customerName || item.customer?.name || item.guestName || 'N/A',
                    amount: item.totalAmount,
                    cashCollectedAt: item.cashCollectedAt
                })))
            }

            if (expenseRes.ok) {
                const data = await expenseRes.json()
                setExpenses(data.data)
            }

        } catch (error) {
            toast.error('Không thể tải dữ liệu cửa hàng')
        } finally {
            setLoading(false)
        }
    }

    const handleDispatch = async (orderId: string, driverId: string) => {
        try {
            const response = await fetchWithAuth('/api/store/dispatch', {
                method: 'PUT',
                body: JSON.stringify({ orderId, driverId })
            })

            if (response.ok) {
                toast.success('Đã gán tài xế thành công')
                fetchInitialData() // Refresh
            } else {
                toast.error('Gán tài xế thất bại')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
        }
    }

    const handleConfirmCash = async (orderId: string) => {
        try {
            const response = await fetchWithAuth('/api/store/cash-handover', {
                method: 'PUT',
                body: JSON.stringify({ orderId })
            })

            if (response.ok) {
                toast.success('Đã xác nhận nhận tiền từ tài xế')
                fetchInitialData() // Refresh
            } else {
                toast.error('Xác nhận thất bại')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
        }
    }

    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetchWithAuth('/api/store/quotes', {
                method: 'POST',
                body: JSON.stringify({
                    ...quoteForm,
                    items: []
                })
            })

            if (response.ok) {
                toast.success('Tạo báo giá thành công')
                setIsQuoteModalOpen(false)
                setQuoteForm({ customerName: '', customerPhone: '', totalAmount: 0, notes: '' })
                fetchInitialData()
            } else {
                toast.error('Không thể tạo báo giá')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
        }
    }

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetchWithAuth('/api/store/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    ...expenseForm,
                    date: new Date().toISOString()
                })
            })

            if (response.ok) {
                toast.success('Đã ghi chi phí')
                setIsExpenseModalOpen(false)
                setExpenseForm({ category: 'FUEL', amount: 0, description: '' })
                fetchInitialData()
            } else {
                toast.error('Không thể ghi chi phí')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header & Stats - Dashboard hằng ngày */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <Store className="w-8 h-8" />
                        </div>
                        Vận Hành Cửa Hàng
                    </h1>
                    <p className="text-slate-500 font-medium ml-14 mt-1">Điều phối nhanh & Kiểm soát dòng tiền tại quầy</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-blue-100 text-blue-600 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Báo Giá Nhanh
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                    >
                        <DollarSign className="w-5 h-5" />
                        Ghi Chi Phí
                    </button>
                </div>
            </div>

            {/* Daily Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiền mặt chờ thu</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{formatCurrency(cashItems.reduce((acc, curr) => acc + curr.amount, 0))}</div>
                    <p className="text-xs text-slate-400 mt-1 font-bold italic">Tài xế đang cầm về</p>
                </div>

                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Truck className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch giao hàng</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{orders.filter(o => !o.driverId).length} Đơn</div>
                    <p className="text-xs text-slate-400 mt-1 font-bold italic">Cần điều phối tài xế</p>
                </div>

                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Báo giá chờ khách</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{quotes.filter(q => q.status === 'PENDING').length} Bản</div>
                    <p className="text-xs text-slate-400 mt-1 font-bold italic">Cần gọi điện xác nhận</p>
                </div>

                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                            <History className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi phí hôm nay</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{formatCurrency(expenses.reduce((acc, curr) => acc + curr.amount, 0))}</div>
                    <p className="text-xs text-slate-400 mt-1 font-bold italic">Xăng dầu và vận hành</p>
                </div>
            </div>

            {/* Main Command Center Layout */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                {/* Sub Navigation */}
                <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100">
                    {[
                        { id: 'dispatch', name: 'Điều Xe & Giao Hàng', icon: Truck },
                        { id: 'cash', name: 'Thu Tiền Tài Xế (COD)', icon: Wallet },
                        { id: 'quotes', name: 'Sổ Báo Giá Nhanh', icon: FileText },
                        { id: 'expenses', name: 'Nhật Ký Chi Phí', icon: DollarSign },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeTab === 'dispatch' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Cột 1: Đơn chờ gán xe */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        Đơn hàng chờ đi giao
                                    </h3>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                                        {orders.filter(o => !o.driverId).length} Đơn mới
                                    </span>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {orders.filter(o => !o.driverId).map(order => (
                                        <div
                                            key={order.id}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData('orderId', order.id)}
                                            className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-move group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-black text-blue-600">{order.orderNumber}</p>
                                                    <h4 className="font-bold text-slate-900 mt-1">{order.customerName}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{order.status}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider border-t border-dashed border-slate-100 pt-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Chờ gán tài xế
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="text-blue-600 hover:underline">Xem đơn</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {orders.filter(o => !o.driverId).length === 0 && (
                                        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[32px]">
                                            <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                                                <CheckCircle className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-bold">Tất cả đơn đã được điều phối!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cột 2: Danh sách tài xế & Trạng thái xe */}
                            <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Đội xe & Tài xế
                                    </h3>
                                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Quản lý đội xe</button>
                                </div>

                                <div className="space-y-6">
                                    {drivers.map(driver => (
                                        <div
                                            key={driver.id}
                                            onDragOver={(e) => {
                                                e.preventDefault()
                                                setOrderIdBeingDraggedOver(driver.id)
                                            }}
                                            onDragEnter={(e) => {
                                                e.preventDefault()
                                                setOrderIdBeingDraggedOver(driver.id)
                                            }}
                                            onDragLeave={() => setOrderIdBeingDraggedOver(null)}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                setOrderIdBeingDraggedOver(null)
                                                const orderId = e.dataTransfer.getData('orderId')
                                                if (orderId) handleDispatch(orderId, driver.id)
                                            }}
                                            className={`p-6 bg-white rounded-3xl border-2 transition-all ${orderIdBeingDraggedOver === driver.id ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-white shadow-sm hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${driver.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-orange-500'
                                                        }`}>
                                                        {driver.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900">{driver.user.name}</h4>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                {driver.status === 'AVAILABLE' ? 'Sẵn sàng nhận đơn' : 'Đang đi giao hàng'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase">Hôm nay</p>
                                                    <p className="font-black text-slate-900">3 Chuyến</p>
                                                </div>
                                            </div>

                                            {/* Hiển thị đơn đang chở */}
                                            <div className="space-y-2 mt-4">
                                                {orders.filter(o => o.driverId === driver.id).map(o => (
                                                    <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-3.5 h-3.5 text-blue-600" />
                                                            <span className="text-xs font-bold text-slate-700">{o.orderNumber} - {o.customerName}</span>
                                                        </div>
                                                        <button className="opacity-0 group-hover:opacity-100 text-xs text-red-500 font-bold transition-all">Gỡ đơn</button>
                                                    </div>
                                                ))}
                                                {orders.filter(o => o.driverId === driver.id).length === 0 && (
                                                    <div className="py-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                                                        <p className="text-[10px] font-black text-slate-300 uppercase italic">Thả đơn hàng vào đây để gán tài xế</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cash' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-900">Tiền mặt tài xế bàn giao cuối ngày</h3>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Tìm tài xế, mã đơn..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-3xl border border-slate-100">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn hàng</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian giao</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {cashItems.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-5 font-black text-blue-600 text-sm">{item.orderNumber}</td>
                                                <td className="px-6 py-5 text-sm font-bold text-slate-900">{item.customerName}</td>
                                                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                                                    {new Date(item.cashCollectedAt).toLocaleTimeString('vi-VN')} {new Date(item.cashCollectedAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(item.amount)}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={() => handleConfirmCash(item.id)}
                                                        className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all hover:-translate-y-0.5"
                                                    >
                                                        Xác nhận nhận tiền
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cashItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <div className="inline-block p-4 bg-emerald-50 rounded-full mb-4">
                                                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                                                    </div>
                                                    <p className="font-black text-slate-900">Đã đối soát xong hôm nay!</p>
                                                    <p className="text-slate-400 text-sm mt-1">Không còn đơn hàng chờ nộp tiền mặt.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'quotes' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-900">Tất cả báo giá miệng & Zalo</h3>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Tìm theo tên khách..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {quotes.map(quote => (
                                    <div key={quote.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${quote.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' :
                                                quote.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                {quote.status === 'ACCEPTED' ? 'Khách đã chốt' : quote.status === 'PENDING' ? 'Đang chờ khách' : 'Hết hạn'}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold">{new Date(quote.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 mb-1">{quote.customerName}</h4>
                                        <p className="text-sm text-slate-500 font-bold mb-4">{quote.customerPhone}</p>

                                        <div className="py-4 border-t border-dashed border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Giá đã báo</p>
                                            <p className="text-2xl font-black text-blue-600">{formatCurrency(quote.totalAmount)}</p>
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                                            <button className="flex-1 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all">Chi tiết</button>
                                            <button className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all">Lên đơn ngay</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-900">Lịch sử chi phí cửa hàng trong tháng</h3>
                                <div className="flex gap-2 text-sm">
                                    <span className="p-2 bg-slate-100 rounded-xl text-slate-500 font-bold tracking-tight">Tháng này: <span className="text-red-500">{formatCurrency(12500000)}</span></span>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-3xl border border-slate-100">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày chi</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung chi</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {expenses.map(expense => (
                                            <tr key={expense.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-5 text-sm font-bold text-slate-900">{new Date(expense.date).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-6 py-5">
                                                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        {expense.category === 'FUEL' ? 'Xăng dầu' : 'Chi phí văn phòng'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600 font-medium">{expense.description}</td>
                                                <td className="px-6 py-5 text-right font-black text-red-600">-{formatCurrency(expense.amount)}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                                                        <button className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS SẼ CODE Ở ĐÂY - CHO GỌN TÔI CODE SẴN CSS TRƯỚC */}
            {isQuoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <PlusCircle className="w-6 h-6 text-blue-600" />
                                Tạo Báo Giá Nhanh
                            </h2>
                            <button onClick={() => setIsQuoteModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                        </div>
                        <form onSubmit={handleQuoteSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tên khách hàng</label>
                                    <input
                                        type="text"
                                        required
                                        value={quoteForm.customerName}
                                        onChange={e => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                                        placeholder="VD: Anh Tuấn"
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
                                    <input
                                        type="text"
                                        value={quoteForm.customerPhone}
                                        onChange={e => setQuoteForm({ ...quoteForm, customerPhone: e.target.value })}
                                        placeholder="090..."
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số tiền báo giá (VNĐ)</label>
                                <FormattedNumberInput
                                    value={quoteForm.totalAmount}
                                    onChange={val => setQuoteForm({ ...quoteForm, totalAmount: val })}
                                    placeholder="Nhập tổng tiền..."
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-xl text-blue-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ghi chú (Sản phẩm báo giá...)</label>
                                <textarea
                                    rows={3}
                                    value={quoteForm.notes}
                                    onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                                    placeholder="VD: 10 khối cát xây, 2 tấn sắt phi 10..."
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                                Lưu & Gửi Báo Giá
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <DollarSign className="w-6 h-6 text-red-500" />
                                Ghi Chi Phí Cửa Hàng
                            </h2>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                        </div>
                        <form onSubmit={handleExpenseSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Loại chi phí</label>
                                <select
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-bold"
                                >
                                    <option value="FUEL">Xăng dầu vận chuyển</option>
                                    <option value="MAINTENANCE">Bảo trì/Sửa xe</option>
                                    <option value="MEALS">Ăn uống/Cơm nước</option>
                                    <option value="UTILITIES">Điện/Nước/Internet</option>
                                    <option value="OTHERS">Chi phí khác</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số tiền chi (VNĐ)</label>
                                <FormattedNumberInput
                                    value={expenseForm.amount}
                                    onChange={val => setExpenseForm({ ...expenseForm, amount: val })}
                                    placeholder="Nhập số tiền..."
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-black text-xl text-red-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Diễn giải</label>
                                <input
                                    type="text"
                                    required
                                    value={expenseForm.description}
                                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    placeholder="VD: Đổ dầu xe 2.5 tấn sáng nay"
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-medium"
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-red-500 text-white rounded-[24px] font-black text-lg shadow-xl shadow-red-200 hover:bg-red-600 transition-all">
                                Xác Nhận Chi
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Trạng thái drag & drop helper */}
            {orderIdBeingDraggedOver && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 bg-blue-600 text-white rounded-full font-black shadow-2xl pointer-events-none animate-bounce">
                    Thả đơn hàng vào tên tài xế để gán xe
                </div>
            )}
        </div>
    )
}
