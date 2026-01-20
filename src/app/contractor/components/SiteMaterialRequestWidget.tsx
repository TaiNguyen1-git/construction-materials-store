'use client'

import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, HardHat, AlertTriangle } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

interface MaterialItem {
    name: string
    quantity: number
    unit: string
}

interface MaterialRequest {
    id: string
    workerName: string
    items: MaterialItem[]
    notes: string | null
    status: string
    priority: string
    createdAt: string
}

export default function SiteMaterialRequestWidget({ projectId }: { projectId: string }) {
    const [requests, setRequests] = useState<MaterialRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [projectId])

    const fetchRequests = async () => {
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${projectId}/material-requests`)
            if (res.ok) {
                const data = await res.json()
                setRequests(data.data || [])
            }
        } catch (err) {
            console.error('Error fetching material requests:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${projectId}/material-requests/${requestId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' })
            })

            if (res.ok) {
                toast.success(action === 'APPROVE' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu')
                fetchRequests()
            }
        } catch (err) {
            toast.error('Lỗi khi thực hiện thao tác')
        }
    }

    if (loading) return <div className="p-12 text-center text-gray-400">Đang tải yêu cầu...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-6 h-6 text-orange-500" />
                    Vật tư phát sinh từ công trường
                </h3>
                <Badge className="bg-orange-100 text-orange-700">{requests.filter(r => r.status === 'PENDING').length} Chờ duyệt</Badge>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                    <HardHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold italic">Không có yêu cầu vật tư nào từ hiện trường.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                        <HardHat className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900">{request.workerName}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(request.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {request.priority === 'HIGH' && (
                                        <Badge className="bg-red-500 text-white animate-pulse">CẦN GẤP</Badge>
                                    )}
                                    <Badge className={
                                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            request.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-500'
                                    }>
                                        {request.status === 'PENDING' ? 'Đang chờ' :
                                            request.status === 'APPROVED' ? 'Đã duyệt' : 'Đã hủy'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                                <p className="text-xs font-black text-gray-400 uppercase mb-3 tracking-wider">Danh mục yêu cầu:</p>
                                <div className="space-y-2">
                                    {request.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-gray-800">{item.name}</span>
                                            <span className="font-black text-blue-600">{item.quantity} {item.unit}</span>
                                        </div>
                                    ))}
                                </div>
                                {request.notes && (
                                    <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 italic">
                                        <span className="font-bold text-gray-700 not-italic">Lưu ý: </span>
                                        {request.notes}
                                    </div>
                                )}
                            </div>

                            {request.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(request.id, 'APPROVE')}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> DUYỆT & TẠO ĐƠN
                                    </button>
                                    <button
                                        onClick={() => handleAction(request.id, 'REJECT')}
                                        className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm active:bg-red-50 active:text-red-500 transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
