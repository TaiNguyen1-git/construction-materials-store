'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    Headset,
    Ticket,
    MessageSquare,
    ShieldAlert,
    AlertTriangle,
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    Package,
    Phone,
    Mail,
    ExternalLink,
    TrendingUp,
    Users,
    Zap,
    Bell,
    Filter,
    ArrowUpRight,
    Loader2,
    BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

type TabType = 'overview' | 'tickets' | 'support' | 'disputes'
type TimelineItemType = 'TICKET' | 'SUPPORT_REQUEST' | 'DISPUTE'

interface TimelineItem {
    type: TimelineItemType
    id: string
    title: string
    status: string
    priority: string
    category: string
    lastMessage?: string
    customerName?: string
    orderId?: string
    orderNumber?: string
    createdAt: string
    updatedAt: string
}

interface Alert {
    type: string
    severity: 'critical' | 'warning'
    title: string
    description: string
    link: string
    createdAt: string
}

interface Stats {
    tickets: { open: number; inProgress: number; total: number; slaBreached: number }
    supportRequests: { pending: number; total: number }
    disputes: { open: number; total: number }
    alertCount: number
}

const TYPE_CONFIG: Record<TimelineItemType, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    TICKET: { label: 'Ticket', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200', icon: Ticket },
    SUPPORT_REQUEST: { label: 'Liên hệ', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: Phone },
    DISPUTE: { label: 'Tranh chấp', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: ShieldAlert }
}

const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Mới', IN_PROGRESS: 'Đang xử lý', WAITING_CUSTOMER: 'Chờ KH',
    WAITING_INTERNAL: 'Chờ nội bộ', RESOLVED: 'Đã xử lý', CLOSED: 'Đóng',
    REOPENED: 'Mở lại', PENDING: 'Chờ xử lý', RESPONDED: 'Đã phản hồi',
    ESCALATED: 'Đã chuyển', INVESTIGATING: 'Đang xem xét', MEDIATION: 'Hòa giải'
}

export default function CustomerCarePage() {
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<Stats | null>(null)
    const [timeline, setTimeline] = useState<TimelineItem[]>([])
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<TimelineItemType | ''>('')

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/admin/customer-care')
            if (res.ok) {
                const data = await res.json()
                setStats(data.stats)
                setTimeline(data.timeline || [])
                setAlerts(data.alerts || [])
            }
        } catch (error) {
            console.error('Error fetching care data:', error)
            toast.error('Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const formatRelative = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}p trước`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h trước`
        const days = Math.floor(hours / 24)
        return `${days}d trước`
    }

    const filteredTimeline = timeline.filter(item => {
        if (typeFilter && item.type !== typeFilter) return false
        if (activeTab === 'tickets' && item.type !== 'TICKET') return false
        if (activeTab === 'support' && item.type !== 'SUPPORT_REQUEST') return false
        if (activeTab === 'disputes' && item.type !== 'DISPUTE') return false
        if (search) {
            const q = search.toLowerCase()
            return item.title.toLowerCase().includes(q) || item.lastMessage?.toLowerCase().includes(q)
        }
        return true
    })

    const getStatusColor = (status: string) => {
        if (['OPEN', 'REOPENED', 'PENDING'].includes(status)) return 'bg-blue-100 text-blue-700'
        if (['IN_PROGRESS', 'INVESTIGATING', 'MEDIATION'].includes(status)) return 'bg-amber-100 text-amber-700'
        if (['RESOLVED', 'CLOSED', 'RESPONDED'].includes(status)) return 'bg-green-100 text-green-700'
        if (['WAITING_CUSTOMER'].includes(status)) return 'bg-purple-100 text-purple-700'
        return 'bg-slate-100 text-slate-600'
    }

    const getLinkForItem = (item: TimelineItem) => {
        if (item.type === 'TICKET') return '/admin/tickets'
        if (item.type === 'DISPUTE') return '/admin/disputes'
        return '/admin/support'
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg shadow-rose-200">
                        <Headset className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Trung tâm Chăm sóc Khách hàng</h1>
                        <p className="text-sm text-slate-500 font-medium">Hộp thư hợp nhất — Tất cả kênh hỗ trợ</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors" title="Làm mới">
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link href="/admin/tickets" className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Ticket className="w-4 h-4" /> Quản lý Tickets
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets chờ</span>
                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Ticket className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-blue-600">{stats.tickets.open}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{stats.tickets.inProgress} đang xử lý</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ chờ</span>
                            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Phone className="w-4.5 h-4.5 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-emerald-600">{stats.supportRequests.pending}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tổng {stats.supportRequests.total}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tranh chấp</span>
                            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-red-600">{stats.disputes.open}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tổng {stats.disputes.total}</p>
                    </div>

                    <div className={`rounded-2xl border p-5 shadow-sm group hover:shadow-md transition-all ${stats.tickets.slaBreached > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vi phạm SLA</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${stats.tickets.slaBreached > 0 ? 'bg-red-100' : 'bg-amber-50'}`}>
                                <Clock className={`w-4.5 h-4.5 ${stats.tickets.slaBreached > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${stats.tickets.slaBreached > 0 ? 'text-red-600' : 'text-amber-600'}`}>{stats.tickets.slaBreached}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Cần phản hồi ngay</p>
                    </div>

                    <div className={`rounded-2xl border p-5 shadow-sm group hover:shadow-md transition-all ${alerts.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cảnh báo</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${alerts.length > 0 ? 'bg-amber-100 animate-pulse' : 'bg-slate-50'}`}>
                                <Bell className={`w-4.5 h-4.5 ${alerts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${alerts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{alerts.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Cần chủ động xử lý</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex gap-6">
                {/* Left: Timeline */}
                <div className="flex-1">
                    {/* Tabs */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
                        <div className="flex border-b border-slate-100">
                            {[
                                { key: 'overview', label: 'Tất cả', icon: Zap },
                                { key: 'tickets', label: 'Tickets', icon: Ticket },
                                { key: 'support', label: 'Liên hệ', icon: Phone },
                                { key: 'disputes', label: 'Tranh chấp', icon: ShieldAlert }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as TabType)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold transition-colors border-b-2 ${activeTab === tab.key
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo nội dung, mã ticket..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Items */}
                    <div className="space-y-2">
                        {loading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                            </div>
                        ) : filteredTimeline.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                <Headset className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="font-bold text-slate-400">Không có yêu cầu nào</p>
                            </div>
                        ) : (
                            filteredTimeline.map((item) => {
                                const typeCfg = TYPE_CONFIG[item.type]
                                const TypeIcon = typeCfg.icon

                                return (
                                    <Link
                                        key={`${item.type}-${item.id}`}
                                        href={getLinkForItem(item)}
                                        className="block bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeCfg.bgColor} border`}>
                                                <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${typeCfg.bgColor} ${typeCfg.color} border`}>
                                                        {typeCfg.label}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                                                        {STATUS_LABELS[item.status] || item.status}
                                                    </span>
                                                    {item.priority === 'URGENT' && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700 animate-pulse">🔥 Khẩn</span>
                                                    )}
                                                    {item.priority === 'HIGH' && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">Cao</span>
                                                    )}
                                                </div>
                                                <p className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {item.title}
                                                </p>
                                                {item.lastMessage && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                        {item.lastMessage}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                    {formatRelative(item.createdAt)}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Right: Proactive Alerts Panel */}
                <div className="w-[360px] hidden lg:block">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Cảnh báo chủ động
                            </h3>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${alerts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {alerts.length > 0 ? `${alerts.length} cần xử lý` : 'Ổn định ✓'}
                            </span>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
                                    <p className="font-bold text-green-600 text-sm">Tất cả đều ổn!</p>
                                    <p className="text-xs text-slate-400 mt-1">Không có vấn đề cần chủ động xử lý</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {alerts.map((alert, i) => (
                                        <Link
                                            key={i}
                                            href={alert.link}
                                            className={`block p-4 hover:bg-slate-50 transition-colors ${alert.severity === 'critical' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-400'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'
                                                    }`}>
                                                    {alert.type === 'STUCK_ORDER' && <Package className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />}
                                                    {alert.type === 'SLOW_TICKET' && <Clock className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />}
                                                    {alert.type === 'SLOW_DISPUTE' && <ShieldAlert className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 mb-0.5">{alert.title}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{alert.description}</p>
                                                </div>
                                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="p-4 border-t border-slate-100 space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Truy cập nhanh</p>
                            {[
                                { href: '/admin/tickets', label: 'Quản lý Tickets', icon: Ticket },
                                { href: '/admin/support', label: 'Yêu cầu liên hệ', icon: MessageSquare },
                                { href: '/admin/disputes', label: 'Trung tâm tranh chấp', icon: ShieldAlert },
                                { href: '/admin/messages', label: 'Tin nhắn Chat', icon: MessageSquare },
                                { href: '/admin/help-center', label: 'Quản lý FAQ/Guide', icon: BookOpen },
                            ].map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors group"
                                >
                                    <link.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                    {link.label}
                                    <ChevronRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-indigo-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
