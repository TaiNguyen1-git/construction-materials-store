'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Truck, Calendar, Package, ChevronRight, Save } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
)

interface OrderItem {
    id: string
    product: {
        name: string
        sku: string
    }
    quantity: number
    unitPrice: number
}

interface Order {
    id: string
    orderNumber: string
    orderItems: OrderItem[]
    status: string
}

interface Phase {
    phaseNumber: number
    scheduledDate: string
    notes: string
    items: { orderItemId: string; quantity: number }[]
}

export default function PhasedDeliveryPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [phases, setPhases] = useState<Phase[]>([])
    const [existingPhases, setExistingPhases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchOrderData()
        fetchExistingPhases()
    }, [orderId])

    const fetchOrderData = async () => {
        try {
            const res = await fetchWithAuth(`/api/orders/${orderId}`)
            if (res.ok) {
                const data = await res.json()
                setOrder(data.data || data)
            }
        } catch (error) {
            toast.error('Không thể tải thông tin đơn hàng')
        } finally {
            setLoading(false)
        }
    }

    const fetchExistingPhases = async () => {
        try {
            const res = await fetchWithAuth(`/api/delivery/phases?orderId=${orderId}`)
            if (res.ok) {
                const data = await res.json()
                setExistingPhases(data)
            }
        } catch (error) {
            console.error('Error fetching existing phases:', error)
        }
    }

    const updatePhaseStatus = async (phaseId: string, status: string) => {
        try {
            const res = await fetchWithAuth('/api/delivery/phases', {
                method: 'PUT',
                body: JSON.stringify({ phaseId, status })
            })
            if (res.ok) {
                toast.success('Đã cập nhật trạng thái đợt hàng')
                fetchExistingPhases()
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái')
        }
    }

    const addPhase = () => {
        const nextNumber = (phases.length + existingPhases.length) + 1
        setPhases([...phases, {
            phaseNumber: nextNumber,
            scheduledDate: new Date().toISOString().split('T')[0],
            notes: '',
            items: order?.orderItems.map(item => ({ orderItemId: item.id, quantity: 0 })) || []
        }])
    }

    const removePhase = (index: number) => {
        setPhases(phases.filter((_, i) => i !== index))
    }

    const updatePhaseItem = (phaseIndex: number, itemIndex: number, qty: number) => {
        const newPhases = [...phases]
        newPhases[phaseIndex].items[itemIndex].quantity = qty
        setPhases(newPhases)
    }

    const handleSave = async () => {
        if (phases.length === 0) return

        setSaving(true)
        try {
            const res = await fetchWithAuth('/api/delivery/phases', {
                method: 'POST',
                body: JSON.stringify({
                    orderId,
                    phases: phases.map(p => ({
                        ...p,
                        scheduledDate: new Date(p.scheduledDate).toISOString(),
                        // Only send items with quantity > 0
                        items: p.items.filter(item => item.quantity > 0)
                    }))
                })
            })

            if (res.ok) {
                toast.success('Đã lưu lịch trình giao hàng thành công!')
                setPhases([])
                fetchExistingPhases()
            } else {
                toast.error('Có lỗi xảy ra khi lưu')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-20"><Spinner /></div>

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            <Toaster />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
                            Lập Lịch Giao Hàng
                        </h1>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                            #{order?.orderNumber}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-1 gap-12">

                {/* Existing Phases Section */}
                {existingPhases.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Các đợt giao hàng đã lập ({existingPhases.length})
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            {existingPhases.map((phase, i) => (
                                <div key={i} className="bg-white p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none"></div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                                                {phase.phaseNumber}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Đợt Giao {phase.phaseNumber}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500">
                                                        Dự kiến: {new Date(phase.scheduledDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${phase.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                                phase.status === 'PREPARING' || phase.status === 'READY' ? 'bg-indigo-50 text-indigo-600' :
                                                    phase.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600' :
                                                        phase.status === 'DELIVERED' || phase.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                                                            'bg-red-50 text-red-600'
                                                }`}>
                                                {phase.status === 'PENDING' ? 'Chờ xử lý' :
                                                    phase.status === 'PREPARING' ? 'Đang soạn' :
                                                        phase.status === 'READY' ? 'Sẵn sàng' :
                                                            phase.status === 'IN_TRANSIT' ? 'Đang giao' :
                                                                phase.status === 'DELIVERED' ? 'Đã giao' :
                                                                    phase.status === 'CONFIRMED' ? 'Đã nhận' : 'Đã hủy'}
                                            </span>

                                            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>

                                            <div className="flex gap-2">
                                                {phase.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => updatePhaseStatus(phase.id, 'PREPARING')}
                                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                                    >
                                                        Soạn hàng
                                                    </button>
                                                )}
                                                {(phase.status === 'PENDING' || phase.status === 'PREPARING' || phase.status === 'READY') && (
                                                    <button
                                                        onClick={() => updatePhaseStatus(phase.id, 'IN_TRANSIT')}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                                                    >
                                                        Giao ngay
                                                    </button>
                                                )}
                                                {phase.status === 'IN_TRANSIT' && (
                                                    <button
                                                        onClick={() => updatePhaseStatus(phase.id, 'DELIVERED')}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                                                    >
                                                        Hoàn thành
                                                    </button>
                                                )}
                                                {['PENDING', 'PREPARING', 'READY'].includes(phase.status) && (
                                                    <button
                                                        onClick={() => updatePhaseStatus(phase.id, 'CANCELLED')}
                                                        className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        Hủy
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-50 space-y-3">
                                        {phase.items
                                            .filter((item: any) => item.quantity > 0)
                                            .map((item: any, j: number) => (
                                                <div key={j} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover/item:bg-blue-400 transition-colors"></div>
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {order?.orderItems.find(oi => oi.id === item.orderItemId)?.product.name || 'Sản phẩm'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                        {item.quantity} sản phẩm
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Phases Planner Section */}
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-white p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Lập kế hoạch giao hàng mới
                            </h2>
                        </div>
                        <button
                            onClick={addPhase}
                            className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                            <Plus size={16} /> Thêm đợt
                        </button>
                    </div>

                    <div className="grid gap-8">
                        {phases.map((phase, pIdx) => (
                            <div key={pIdx} className="bg-white p-10 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.05)] border-2 border-dashed border-slate-200 relative animate-in zoom-in-95 duration-300">
                                <button
                                    onClick={() => removePhase(pIdx)}
                                    className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all active:scale-90"
                                >
                                    <Trash2 size={20} />
                                </button>

                                <div className="grid md:grid-cols-2 gap-10 mb-10">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Mã Đợt Giao</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                readOnly
                                                value={phase.phaseNumber}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-slate-900 focus:ring-0"
                                            />
                                            <Truck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Ngày Giao Dự Kiến</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={phase.scheduledDate}
                                                onChange={(e) => {
                                                    const newPhases = [...phases]
                                                    newPhases[pIdx].scheduledDate = e.target.value
                                                    setPhases(newPhases)
                                                }}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                        <Package className="text-blue-500 w-5 h-5" />
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cấu hình số lượng</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {order?.orderItems.map((item, iIdx) => (
                                            <div key={item.id} className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm leading-tight mb-1">{item.product.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Tối đa: {item.quantity} SP
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.quantity}
                                                        value={phase.items[iIdx]?.quantity || 0}
                                                        onChange={(e) => updatePhaseItem(pIdx, iIdx, parseFloat(e.target.value))}
                                                        className="w-20 bg-white border border-slate-100 rounded-xl p-3 text-center font-black text-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {phases.length > 0 && (
                            <div className="pt-12 flex justify-center">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-20 py-6 rounded-3xl font-black text-[13px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-[1.02] hover:shadow-[0_40px_80px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:grayscale flex items-center gap-4 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang lưu dữ liệu...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} className="relative z-10" />
                                            <span className="relative z-10">Lưu Lịch Trình Giao Hàng</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
