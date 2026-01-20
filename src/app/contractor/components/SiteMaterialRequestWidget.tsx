'use client'

import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, HardHat, AlertTriangle, ShoppingCart, Search, Loader2 } from 'lucide-react'
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

interface MatchSuggestion {
    id: string
    name: string
    price: number
    unit: string
    sku: string
    images: string[]
}

interface MatchResult {
    originalRequest: MaterialItem
    suggestions: MatchSuggestion[]
}

export default function SiteMaterialRequestWidget({ projectId }: { projectId: string }) {
    const [requests, setRequests] = useState<MaterialRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [mappingRequest, setMappingRequest] = useState<MaterialRequest | null>(null)
    const [matches, setMatches] = useState<MatchResult[]>([])
    const [mappingLoading, setMappingLoading] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState<Record<number, MatchSuggestion>>({})
    const [submittingToCart, setSubmittingToCart] = useState(false)

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

    const openMappingModal = async (request: MaterialRequest) => {
        setMappingRequest(request)
        setMappingLoading(true)
        setSelectedProducts({})
        try {
            const res = await fetchWithAuth('/api/contractors/procurement/match', {
                method: 'POST',
                body: JSON.stringify({ items: request.items })
            })
            if (res.ok) {
                const data = await res.json()
                setMatches(data.data)

                // Auto-select the first suggestion if available for UX
                const initialSelected: Record<number, MatchSuggestion> = {}
                data.data.forEach((match: MatchResult, index: number) => {
                    if (match.suggestions.length > 0) {
                        initialSelected[index] = match.suggestions[0]
                    }
                })
                setSelectedProducts(initialSelected)
            }
        } catch (err) {
            toast.error('Lỗi khi tải gợi ý vật tư')
        } finally {
            setMappingLoading(false)
        }
    }

    const handleAddToCart = async () => {
        if (!mappingRequest) return

        const itemsToCart = mappingRequest.items.map((item, index) => {
            const product = selectedProducts[index]
            if (!product) return null
            return {
                productId: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                quantity: item.quantity
            }
        }).filter(Boolean)

        if (itemsToCart.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sản phẩm khớp')
            return
        }

        setSubmittingToCart(true)
        try {
            const res = await fetchWithAuth('/api/contractors/procurement/add-to-cart', {
                method: 'POST',
                body: JSON.stringify({
                    items: itemsToCart,
                    requestId: mappingRequest.id
                })
            })

            if (res.ok) {
                toast.success('Đã thêm vào giỏ hàng và cập nhật yêu cầu!')
                setMappingRequest(null)
                fetchRequests()
            }
        } catch (err) {
            toast.error('Lỗi khi thêm vào giỏ hàng')
        } finally {
            setSubmittingToCart(false)
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
                                                request.status === 'ORDERED' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-500'
                                    }>
                                        {request.status === 'PENDING' ? 'Đang chờ' :
                                            request.status === 'APPROVED' ? 'Đã duyệt' :
                                                request.status === 'ORDERED' ? 'Đã tạo đơn' : 'Đã hủy'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                                <div className="space-y-2">
                                    {request.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-gray-800">{item.name}</span>
                                            <span className="font-black text-blue-600">{item.quantity} {item.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {request.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openMappingModal(request)}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-4 h-4" /> DUYỆT & TẠO ĐƠN
                                    </button>
                                    <button
                                        onClick={() => handleAction(request.id, 'REJECT')}
                                        className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm active:bg-red-50 active:text-red-500 transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {request.status === 'APPROVED' && (
                                <button
                                    onClick={() => openMappingModal(request)}
                                    className="w-full py-3 bg-green-50 text-green-600 rounded-2xl font-black text-sm border border-green-200 flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" /> TIẾP TỤC ĐẶT HÀNG
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Procurement Bridge Modal (Flow 1) */}
            {mappingRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                            <div>
                                <h4 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <ShoppingCart className="w-7 h-7 text-blue-600" />
                                    Cầu nối mua sắm
                                </h4>
                                <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest">Khớp nối vật tư thợ yêu cầu với cửa hàng</p>
                            </div>
                            <button onClick={() => setMappingRequest(null)} className="p-3 hover:bg-white rounded-full transition-colors shadow-sm">
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8">
                            {mappingLoading ? (
                                <div className="py-20 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                                    <p className="font-black text-gray-400 animate-pulse">Đang tìm sản phẩm phù hợp...</p>
                                </div>
                            ) : (
                                matches.map((match, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-orange-500 text-white rounded-lg">THỢ YÊU CẦU</Badge>
                                                <span className="font-black text-gray-900 text-lg">{match.originalRequest.name}</span>
                                                <span className="text-blue-600 font-black">({match.originalRequest.quantity} {match.originalRequest.unit})</span>
                                            </div>
                                        </div>

                                        <div className="grid gap-3">
                                            {match.suggestions.length > 0 ? (
                                                match.suggestions.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => setSelectedProducts(prev => ({ ...prev, [idx]: product }))}
                                                        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between hover:border-blue-400 group ${selectedProducts[idx]?.id === product.id
                                                                ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                                                                : 'border-gray-100 bg-white'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                                                                <img src={product.images[0] || '/placeholder-product.png'} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</p>
                                                                <p className="text-xs text-blue-600 font-black flex items-center gap-2">
                                                                    {product.price.toLocaleString('vi-VN')}đ / {product.unit}
                                                                    <span className="text-gray-300 font-normal">| SKU: {product.sku}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedProducts[idx]?.id === product.id
                                                                ? 'bg-blue-600 border-blue-600 shadow-lg'
                                                                : 'border-gray-200'
                                                            }`}>
                                                            {selectedProducts[idx]?.id === product.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 bg-red-50 rounded-3xl border border-dashed border-red-200 text-center">
                                                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                                    <p className="text-sm font-bold text-red-700">Không tìm thấy sản phẩm tương ứng trong cửa hàng.</p>
                                                    <button className="text-xs font-black text-blue-600 mt-2 hover:underline">TÌM KIẾM THỦ CÔNG</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => setMappingRequest(null)}
                                className="flex-1 py-4 bg-white text-gray-500 rounded-2xl font-black text-sm border border-gray-200 hover:bg-gray-100 transition-all"
                            >
                                ĐỂ SAU
                            </button>
                            <button
                                disabled={submittingToCart || mappingLoading || Object.keys(selectedProducts).length === 0}
                                onClick={handleAddToCart}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {submittingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                                XÁC NHẬN & VÀO GIỎ HÀNG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
