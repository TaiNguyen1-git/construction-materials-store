'use client'

import { useState, useEffect, useRef } from 'react'
import { Brain, AlertTriangle, Users, ShoppingBag, Star, TrendingDown, X, Ticket, Truck, MessageSquare, Phone, Download, QrCode, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import html2canvas from 'html2canvas-pro'

const TIER_NAMES: Record<string, string> = { BRONZE: 'Đồng', SILVER: 'Bạc', GOLD: 'Vàng', PLATINUM: 'Bạch Kim', DIAMOND: 'Kim Cương' }

interface ChurnCustomer {
    id: string; name: string; email: string; tier: string; points: number
    lastPurchaseDate: string | null; daysSinceLastPurchase: number; totalPurchases: number
}

interface Segment {
    name: string; count: number; description: string; avgSpend: number
}

export default function AIAnalytics() {
    const [churnRisk, setChurnRisk] = useState<ChurnCustomer[]>([])
    const [segments, setSegments] = useState<Segment[]>([])
    const [loading, setLoading] = useState(true)

    const [showProcessModal, setShowProcessModal] = useState(false)
    const [activeCustomer, setActiveCustomer] = useState<ChurnCustomer | null>(null)
    const [giftType, setGiftType] = useState('POINTS')
    const [giftValue, setGiftValue] = useState('')
    const [message, setMessage] = useState('')
    const [processing, setProcessing] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => { analyzeData() }, [])

    const analyzeData = async () => {
        try {
            const res = await fetch('/api/admin/loyalty/customers')
            const data = await res.json()
            if (!data.success) return

            const customers = data.data || []
            const now = new Date()

            const atRisk: ChurnCustomer[] = []
            const segmentMap: Record<string, { count: number; totalSpend: number }> = {}

            for (const c of customers) {
                const lastPurchase = c.lastPurchaseDate ? new Date(c.lastPurchaseDate) : null
                const daysSince = lastPurchase
                    ? Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
                    : 999

                if (daysSince > 60) {
                    atRisk.push({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        tier: c.tier,
                        points: c.points,
                        lastPurchaseDate: c.lastPurchaseDate,
                        daysSinceLastPurchase: daysSince,
                        totalPurchases: c.totalSpent,
                    })
                }

                const spend = c.totalSpent || 0
                let segment = 'Khách mới'
                if (spend > 50000000) segment = 'Khách VIP'
                else if (spend > 20000000) segment = 'Khách trung thành'
                else if (spend > 5000000) segment = 'Khách thường xuyên'
                else if (spend > 0) segment = 'Khách lẻ'

                if (!segmentMap[segment]) segmentMap[segment] = { count: 0, totalSpend: 0 }
                segmentMap[segment].count++
                segmentMap[segment].totalSpend += spend
            }

            atRisk.sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase)
            setChurnRisk(atRisk.slice(0, 20))

            const segmentDescriptions: Record<string, string> = {
                'Khách VIP': 'Chi tiêu trên 50 triệu, ưu tiên chăm sóc đặc biệt',
                'Khách trung thành': 'Chi tiêu 20-50 triệu, tiềm năng nâng hạng',
                'Khách thường xuyên': 'Chi tiêu 5-20 triệu, cần khuyến khích',
                'Khách lẻ': 'Chi tiêu dưới 5 triệu, cần chuyển đổi',
                'Khách mới': 'Chưa có giao dịch, cần kích hoạt',
            }

            setSegments(
                Object.entries(segmentMap).map(([name, data]) => ({
                    name,
                    count: data.count,
                    description: segmentDescriptions[name] || '',
                    avgSpend: data.count > 0 ? Math.round(data.totalSpend / data.count) : 0,
                })).sort((a, b) => b.avgSpend - a.avgSpend)
            )
        } catch (err) {
            console.error('Lỗi phân tích:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenProcess = (customer: ChurnCustomer) => {
        setActiveCustomer(customer)
        setGiftType('POINTS')
        setGiftValue('100 điểm')
        let msg = `Chào anh ${customer.name}, em là quản lý bên SmartBuild ạ. Đã lâu không thấy anh ghé cửa hàng. Em có gửi tặng anh 100 điểm tri ân, hy vọng sớm gặp lại anh!`
        if (customer.daysSinceLastPurchase > 120) {
            msg = `Chào anh ${customer.name}, SmartBuild rất trân trọng sự đồng hành của anh thời gian qua. Vì đã lâu anh chưa nhập hàng, em đặc biệt gửi tặng anh mã ưu đãi lớn này để hỗ trợ công trình sắp tới của mình ạ!`
        }
        setMessage(msg)
        setShowProcessModal(true)
    }

    const updateMessage = (type: string, value: string) => {
        if (!activeCustomer) return
        setGiftType(type)
        setGiftValue(value)

        let msg = message
        const giftText = type === 'POINTS' ? `tặng anh ${value}` : type === 'VOUCHER' ? `tặng anh ${value}` : `tặng anh lượt ${value}`

        if (message.includes('tặng anh')) {
            msg = message.replace(/tặng anh [^,]*,/, `${giftText},`)
                .replace(/tặng anh [^!]*!/, `${giftText}!`)
        } else {
            msg = `Chào anh ${activeCustomer.name}, SmartBuild gửi ${giftText} tri ân ạ!`
        }
        setMessage(msg)
    }

    const copyToZalo = () => {
        navigator.clipboard.writeText(message)
        window.open(`https://zalo.me/${activeCustomer?.email || ''}`, '_blank')
        toast.success('Đã sao chép tin nhắn!')
    }

    const downloadCard = async () => {
        if (!cardRef.current) return

        const loadToast = toast.loading('Đang khởi tạo ảnh thẻ quà tặng...')
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // Tăng chất lượng ảnh
                backgroundColor: null,
                useCORS: true,
                logging: false,
            })

            const image = canvas.toDataURL('image/png', 1.0)
            const link = document.createElement('a')
            link.download = `The_Qua_Tang_${activeCustomer?.name.replace(/\s+/g, '_')}.png`
            link.href = image
            link.click()
            toast.success('Đã tải ảnh về máy!', { id: loadToast })
        } catch (err) {
            console.error('Lỗi tải ảnh:', err)
            toast.error('Không thể tạo ảnh. Vui lòng thử lại!', { id: loadToast })
        }
    }

    const handleConfirmProcess = async () => {
        if (!activeCustomer) return
        setProcessing(true)
        const loadToast = toast.loading('Đang thực hiện xử lý...')

        try {
            const res = await fetch('/api/admin/loyalty/process-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: activeCustomer.id,
                    giftType,
                    giftValue,
                    message
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Đã gửi quà tặng và lưu nhật ký chăm sóc!', { id: loadToast })
                setShowProcessModal(false)
                analyzeData() // Refresh list
            } else {
                toast.error(data.message || 'Có lỗi xảy ra', { id: loadToast })
            }
        } catch (err) {
            console.error('Lỗi xử lý:', err)
            toast.error('Lỗi kết nối máy chủ', { id: loadToast })
        } finally {
            setProcessing(false)
        }
    }

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

    return (
        <div className="space-y-8">
            {/* Phân khúc khách hàng tự động - Theo thiết kế mẫu */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Phân Khúc Khách Hàng</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NHÓM THEO HÀNH VI MUA HÀNG</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map((s, idx) => {
                        const styleMap: Record<string, any> = {
                            'Khách VIP': { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-900', icon: 'text-purple-600', sub: 'text-purple-500' },
                            'Khách trung thành': { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-900', icon: 'text-indigo-600', sub: 'text-indigo-500' },
                            'Khách thường xuyên': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-900', icon: 'text-blue-600', sub: 'text-blue-500' },
                            'Khách lẻ': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-900', icon: 'text-emerald-600', sub: 'text-emerald-500' },
                            'Khách mới': { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-900', icon: 'text-amber-600', sub: 'text-amber-500' },
                        }
                        const style = styleMap[s.name] || { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-900', icon: 'text-slate-600', sub: 'text-slate-500' }

                        return (
                            <div key={s.name} className={`${style.bg} ${style.border} border rounded-[28px] p-7 relative group hover:shadow-lg transition-all duration-300`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className={`text-lg font-black tracking-tight ${style.text}`}>{s.name}</h4>
                                    <div className="p-2 bg-white/50 rounded-lg group-hover:scale-110 transition-transform">
                                        <ShoppingBag size={18} className={style.icon} />
                                    </div>
                                </div>
                                <p className={`text-[11px] font-bold ${style.sub} mb-8 leading-relaxed line-clamp-2`}>{s.description}</p>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">Số lượng</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{s.count}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">Tiêu TB</p>
                                        <p className="text-sm font-black text-slate-600 italic">{fmt(s.avgSpend)}đ</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-red-50 rounded-2xl text-red-600"><AlertTriangle size={20} /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tighter">Khách Hàng Nguy Cơ Rời Bỏ</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chưa mua hàng &gt;60 ngày • {churnRisk.length} khách hàng</p>
                    </div>
                </div>
                {churnRisk.length === 0 ? (
                    <div className="text-center py-8">
                        <Star className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                        <p className="text-slate-400 font-bold">Tuyệt vời! Không có khách hàng nào có nguy cơ rời bỏ.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
                                    <th className="py-3 px-4">Khách hàng</th>
                                    <th className="py-3 px-4">Hạng</th>
                                    <th className="py-3 px-4">Điểm</th>
                                    <th className="py-3 px-4">Ngày mua cuối</th>
                                    <th className="py-3 px-4">Số ngày vắng</th>
                                    <th className="py-3 px-4">Gợi ý</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {churnRisk.map(c => (
                                    <tr key={c.id} className="hover:bg-red-50/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-sm text-slate-900">{c.name}</p>
                                            <p className="text-xs text-slate-400">{c.email}</p>
                                        </td>
                                        <td className="py-3 px-4 text-xs font-bold text-slate-600">{TIER_NAMES[c.tier] || c.tier}</td>
                                        <td className="py-3 px-4 text-xs font-bold text-slate-600">{fmt(c.points)}</td>
                                        <td className="py-3 px-4 text-xs text-slate-500">{c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${c.daysSinceLastPurchase > 120 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {c.daysSinceLastPurchase} ngày
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleOpenProcess(c)}
                                                className="text-[10px] text-blue-600 font-black uppercase hover:underline bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-all active:scale-95"
                                            >
                                                {c.daysSinceLastPurchase > 120 ? 'Chăm sóc đặc biệt' : 'Liên hệ ngay'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Xử lý khách hàng */}
            {showProcessModal && activeCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200"><Sparkles size={18} /></div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic text-blue-600">CHĂM SÓC KHÁCH HÀNG THÂN THIẾT</h3>
                            </div>
                            <button onClick={() => setShowProcessModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all"><X size={20} /></button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 scrollbar-hide">
                            {/* Thông tin khách */}
                            <div className="flex items-center justify-between bg-blue-50/50 p-5 rounded-[24px] border border-blue-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">{activeCustomer.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-extrabold text-slate-900 text-lg leading-tight">{activeCustomer.name}</p>
                                        <p className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">Vắng mặt {activeCustomer.daysSinceLastPurchase} ngày</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng hiện tại</p>
                                    <p className="font-black text-blue-600">{TIER_NAMES[activeCustomer.tier] || activeCustomer.tier}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {/* Bước 1: Quà tặng */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-lg shadow-blue-200">1</div>
                                            Chọn món quà tri ân
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[{ id: 'POINTS', label: 'Điểm', icon: Star }, { id: 'VOUCHER', label: 'Voucher', icon: Ticket }, { id: 'SERVICE', label: 'Dịch vụ', icon: Truck }].map(t => (
                                                <button key={t.id} onClick={() => updateMessage(t.id, t.id === 'POINTS' ? '100 điểm' : t.id === 'VOUCHER' ? 'Voucher 5%' : 'Xe cẩu ưu tiên')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${giftType === t.id ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}>
                                                    <t.icon size={20} /><span className="text-[9px] font-extrabold uppercase">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {giftType === 'POINTS' && ['50 điểm', '100 điểm', '200 điểm', '500 điểm'].map(v => (
                                                <button key={v} onClick={() => updateMessage('POINTS', v)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${giftValue === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}>{v}</button>
                                            ))}
                                            {giftType === 'VOUCHER' && ['Voucher 5%', 'Voucher 10%', 'Freeship đơn 10tr', 'Giảm 500k'].map(v => (
                                                <button key={v} onClick={() => updateMessage('VOUCHER', v)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${giftValue === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}>{v}</button>
                                            ))}
                                            {giftType === 'SERVICE' && ['Xe cẩu ưu tiên', 'Mượn máy đục', 'Dự toán Free', 'Bốc xếp tầng'].map(v => (
                                                <button key={v} onClick={() => updateMessage('SERVICE', v)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${giftValue === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}>{v}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bước 2: Tin nhắn */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-lg shadow-blue-200">2</div>
                                            Nội dung tin nhắn (AI)
                                        </label>
                                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[140px] resize-none leading-relaxed shadow-inner" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Bước 3: Thẻ quà tặng Preview */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-lg shadow-blue-200">3</div>
                                            Xem trước Thẻ quà tặng
                                        </label>
                                        <div ref={cardRef} className="relative group overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-50 via-white to-blue-50 aspect-[4/5] p-6 text-slate-900 shadow-xl flex flex-col justify-between border-4 border-white ring-1 ring-slate-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase">Gift Certificate</p>
                                                    <h4 className="text-xl font-black mt-1 italic text-slate-900">SMARTBUILD</h4>
                                                </div>
                                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                                    <Sparkles size={16} />
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-4 py-4 flex-1 justify-center">
                                                <div className="p-4 bg-blue-50/50 rounded-3xl shadow-lg border border-blue-100">
                                                    <QrCode size={160} className="text-blue-900 opacity-90" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Dành tặng cho khách hàng</p>
                                                    <p className="text-xl font-black text-slate-900">{activeCustomer.name}</p>
                                                </div>
                                            </div>

                                            <div className="bg-blue-600 rounded-[20px] p-4 text-center shadow-lg shadow-blue-200">
                                                <p className="text-[10px] font-black uppercase text-blue-50 mb-1">Đặc quyền ưu đãi</p>
                                                <p className="text-xl font-black tracking-tighter text-white">{giftValue || 'Ưu đãi VIP'}</p>
                                            </div>

                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                        </div>
                                        <button
                                            onClick={downloadCard}
                                            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase border-2 border-blue-100 hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Download size={14} /> Tải thẻ quà tặng (Zalo)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Thao tác */}
                            <div className="grid grid-cols-2 gap-4 pb-4">
                                <button onClick={copyToZalo} className="flex items-center justify-center gap-2 py-5 bg-[#0068ff] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"><MessageSquare size={18} /> Nhắn Zalo khách</button>
                                <button className="flex items-center justify-center gap-2 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"><Phone size={18} /> Gọi tư vấn</button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                            <p className="text-[10px] font-bold text-slate-400 max-w-[200px]">Thông tin xử lý sẽ được lưu vào nhật ký chăm sóc khách hàng.</p>
                            <button
                                onClick={handleConfirmProcess}
                                disabled={processing}
                                className={`px-10 py-5 text-white font-black rounded-[24px] text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 shadow-blue-600/30 hover:bg-blue-700'}`}
                            >
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : 'Xác nhận Hoàn tất'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
