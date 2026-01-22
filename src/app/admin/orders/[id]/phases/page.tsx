
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Truck, Calendar, Package } from 'lucide-react'
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
                        scheduledDate: new Date(p.scheduledDate).toISOString()
                    }))
                })
            })

            if (res.ok) {
                toast.success('Đã lưu lịch trình giao hàng cuốn chiếu!')
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
        <div className="p-6 max-w-5xl mx-auto">
            <Toaster />
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft />
                </button>
                <h1 className="text-2xl font-bold">Lập Lịch Giao Hàng Cuốn Chiếu - #{order?.orderNumber}</h1>
            </div>

            {/* Existing Phases */}
            {existingPhases.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Truck className="text-blue-600" /> Các đợt đã lập
                    </h2>
                    <div className="grid gap-4">
                        {existingPhases.map((phase, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="font-bold text-blue-700 block text-lg">Đợt {phase.phaseNumber}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${phase.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                            phase.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                phase.status === 'DELIVERED' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                    'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            {phase.status === 'PENDING' ? 'Chờ giao' :
                                                phase.status === 'PROCESSING' ? 'Đang soạn' :
                                                    phase.status === 'SHIPPED' ? 'Đang giao' :
                                                        phase.status === 'DELIVERED' ? 'Đã giao' : 'Đã hủy'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {phase.status === 'PENDING' && (
                                            <button
                                                onClick={() => updatePhaseStatus(phase.id, 'SHIPPED')}
                                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm"
                                            >
                                                Giao hàng
                                            </button>
                                        )}
                                        {phase.status === 'SHIPPED' && (
                                            <button
                                                onClick={() => updatePhaseStatus(phase.id, 'DELIVERED')}
                                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 shadow-sm"
                                            >
                                                Hoàn thành
                                            </button>
                                        )}
                                        {['PENDING', 'PROCESSING'].includes(phase.status) && (
                                            <button
                                                onClick={() => updatePhaseStatus(phase.id, 'CANCELLED')}
                                                className="text-xs bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50"
                                            >
                                                Hủy
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                                    <span className="flex items-center gap-1"><Calendar size={14} className="text-gray-400" /> Dự kiến: <span className="font-bold text-gray-700">{new Date(phase.scheduledDate).toLocaleDateString('vi-VN')}</span></span>
                                </div>
                                <div className="space-y-1">
                                    {phase.items.map((item: any, j: number) => (
                                        <div key={j} className="text-sm flex justify-between">
                                            <span>{item.orderItem.product.name}</span>
                                            <span className="font-medium">{item.quantity} sản phẩm</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Phases */}
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="text-green-600" /> Thêm đợt giao hàng mới
                    </h2>
                    <button onClick={addPhase} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
                        <Plus size={18} /> Thêm đợt
                    </button>
                </div>

                {phases.map((phase, pIdx) => (
                    <div key={pIdx} className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 relative">
                        <button onClick={() => removePhase(pIdx)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                            <Trash2 size={20} />
                        </button>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đợt số</label>
                                <input type="number" readOnly value={phase.phaseNumber} className="w-full bg-white border border-gray-200 rounded-lg p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày giao dự kiến</label>
                                <input
                                    type="date"
                                    value={phase.scheduledDate}
                                    onChange={(e) => {
                                        const newPhases = [...phases]
                                        newPhases[pIdx].scheduledDate = e.target.value
                                        setPhases(newPhases)
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 border-b pb-2">Chọn số lượng giao trong đợt này:</h3>
                            {order?.orderItems.map((item, iIdx) => (
                                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Package size={18} className="text-gray-400" />
                                        <div>
                                            <p className="font-medium text-sm">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">Tổng: {item.quantity} SP</p>
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.quantity}
                                        value={phase.items[iIdx]?.quantity || 0}
                                        onChange={(e) => updatePhaseItem(pIdx, iIdx, parseFloat(e.target.value))}
                                        className="w-24 border border-gray-200 rounded-lg p-2 text-center font-bold"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {phases.length > 0 && (
                    <div className="pt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center gap-2"
                        >
                            {saving ? 'Đang lưu...' : 'Lưu lịch trình giao hàng'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
