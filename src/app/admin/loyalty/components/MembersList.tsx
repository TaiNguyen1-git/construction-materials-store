'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Star, Plus, Minus, Save, X, Eye, Users as UsersIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

const TIER_NAMES: Record<string, string> = {
    BRONZE: 'Đồng', SILVER: 'Bạc', GOLD: 'Vàng', PLATINUM: 'Bạch Kim', DIAMOND: 'Kim Cương',
}
const TIER_COLORS: Record<string, string> = {
    BRONZE: 'bg-amber-50 text-amber-700 border-amber-200',
    SILVER: 'bg-slate-100 text-slate-700 border-slate-200',
    GOLD: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PLATINUM: 'bg-blue-50 text-blue-700 border-blue-200',
    DIAMOND: 'bg-purple-50 text-purple-700 border-purple-200',
}

interface Customer {
    id: string; name: string; email: string; tier: string; points: number; totalSpent: number
}
interface CustomerDetail {
    id: string; name: string; email: string; phone: string; tier: string; points: number
    totalPointsEarned: number; totalPointsRedeemed: number; totalPurchases: number
    lastPurchaseDate: string | null; birthday: string | null; referralCode: string | null
    totalReferrals: number; companyName: string | null; contractorVerified: boolean
    memberSince: string; transactions: any[]; vouchers: any[]; recentOrders: any[]
}

export default function MembersList() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTier, setSelectedTier] = useState('ALL')
    const [showAdjust, setShowAdjust] = useState(false)
    const [showDetail, setShowDetail] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [adjustAmount, setAdjustAmount] = useState(0)
    const [adjustReason, setAdjustReason] = useState('')
    const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT'>('ADD')

    useEffect(() => { fetchCustomers() }, [])

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/admin/loyalty/customers')
            const data = await res.json()
            if (data.success) setCustomers(data.data)
        } catch { toast.error('Không thể tải danh sách') }
        finally { setLoading(false) }
    }

    const fetchDetail = async (id: string) => {
        setDetailLoading(true)
        try {
            const res = await fetch(`/api/admin/loyalty/customers/${id}`)
            const data = await res.json()
            if (data.success) setCustomerDetail(data.data)
        } catch { toast.error('Lỗi tải chi tiết') }
        finally { setDetailLoading(false) }
    }

    const handleAdjust = async () => {
        if (!selectedCustomer || !adjustReason || adjustAmount <= 0) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }
        const points = adjustType === 'ADD' ? adjustAmount : -adjustAmount
        try {
            const res = await fetch(`/api/admin/loyalty/customers/${selectedCustomer.id}/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points, reason: adjustReason })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Điều chỉnh điểm thành công')
                setShowAdjust(false)
                setAdjustAmount(0)
                setAdjustReason('')
                fetchCustomers()
            } else {
                toast.error(data.error || 'Có lỗi xảy ra')
            }
        } catch { toast.error('Lỗi kết nối') }
    }

    const filtered = customers.filter(c => {
        const search = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
        const tier = selectedTier === 'ALL' || c.tier === selectedTier
        return search && tier
    })

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Tìm theo tên, email..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <select className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500" value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
                        <option value="ALL">Tất cả hạng</option>
                        {Object.entries(TIER_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} kết quả</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            {['Khách hàng', 'Hạng', 'Điểm tích lũy', 'Tổng chi tiêu', 'Thao tác'].map(h => (
                                <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex justify-center items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /> Đang tải...</div>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                <UsersIcon className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>Không tìm thấy khách hàng nào</p>
                            </td></tr>
                        ) : filtered.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">{c.name.charAt(0)}</div>
                                        <div><p className="font-bold text-slate-900 text-sm">{c.name}</p><p className="text-xs text-slate-400">{c.email}</p></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${TIER_COLORS[c.tier] || ''}`}>{TIER_NAMES[c.tier] || c.tier}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />{fmt(c.points)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-600">{fmt(c.totalSpent)}đ</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setSelectedCustomer(c); fetchDetail(c.id); setShowDetail(true) }}
                                            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors" title="Xem chi tiết"><Eye size={16} /></button>
                                        <button onClick={() => { setSelectedCustomer(c); setShowAdjust(true) }}
                                            className="px-3 py-1.5 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors">Điều chỉnh</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Adjust Modal */}
            {showAdjust && selectedCustomer && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-900">Điều Chỉnh Điểm</h3>
                            <button onClick={() => setShowAdjust(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">{selectedCustomer.name.charAt(0)}</div>
                                <div><p className="font-bold text-slate-900">{selectedCustomer.name}</p><p className="text-sm text-slate-400">Hiện tại: {fmt(selectedCustomer.points)} điểm</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setAdjustType('ADD')} className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border font-bold text-sm transition-all ${adjustType === 'ADD' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/30' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                    <Plus size={16} /> Cộng điểm
                                </button>
                                <button onClick={() => setAdjustType('SUBTRACT')} className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border font-bold text-sm transition-all ${adjustType === 'SUBTRACT' ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/30' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                    <Minus size={16} /> Trừ điểm
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Số điểm</label>
                                <input type="number" min="1" value={adjustAmount} onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nhập số điểm..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Lý do điều chỉnh</label>
                                <textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm" placeholder="VD: Quà tặng sinh nhật, Bồi thường..." rows={3} />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowAdjust(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-2xl transition-colors text-sm">Hủy bỏ</button>
                            <button onClick={handleAdjust} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20">
                                <Save size={16} /> Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && selectedCustomer && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                            <h3 className="text-lg font-black text-slate-900">Chi Tiết Thành Viên</h3>
                            <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            {detailLoading ? (
                                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                            ) : customerDetail ? (
                                <>
                                    {/* Profile */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-2xl">{customerDetail.name.charAt(0)}</div>
                                        <div>
                                            <p className="text-xl font-black text-slate-900">{customerDetail.name}</p>
                                            <p className="text-sm text-slate-400">{customerDetail.email} {customerDetail.phone && `• ${customerDetail.phone}`}</p>
                                            <span className={`inline-block mt-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${TIER_COLORS[customerDetail.tier]}`}>{TIER_NAMES[customerDetail.tier]}</span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Điểm hiện tại', value: fmt(customerDetail.points) },
                                            { label: 'Tổng tích lũy', value: fmt(customerDetail.totalPointsEarned) },
                                            { label: 'Đã quy đổi', value: fmt(customerDetail.totalPointsRedeemed) },
                                            { label: 'Tổng mua hàng', value: `${fmt(customerDetail.totalPurchases)}đ` },
                                        ].map((s, i) => (
                                            <div key={i} className="p-3 bg-slate-50 rounded-2xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                <p className="text-lg font-black text-slate-900 tracking-tighter">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recent Transactions */}
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Giao Dịch Điểm Gần Đây</h4>
                                        {customerDetail.transactions.length === 0 ? (
                                            <p className="text-sm text-slate-400 py-4 text-center">Chưa có giao dịch nào</p>
                                        ) : (
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                {customerDetail.transactions.slice(0, 10).map((t: any) => (
                                                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{t.description}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</p>
                                                        </div>
                                                        <span className={`text-sm font-black ${t.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {t.points > 0 ? '+' : ''}{fmt(t.points)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : <p className="text-center text-slate-400">Không có dữ liệu</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
