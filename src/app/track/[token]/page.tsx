'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Truck, MapPin, Package, Clock, Phone, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function CustomerTrackingPage() {
    const params = useParams()
    const token = params.token as string

    const [delivery, setDelivery] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const res = await fetch(`/api/public/delivery/${token}`)
                const data = await res.json()
                if (res.ok) {
                    setDelivery(data.data)
                } else {
                    setError(data.error?.message || 'Không tìm thấy thông tin đơn hàng')
                }
            } catch (err) {
                setError('Lỗi kết nối máy chủ')
            } finally {
                setLoading(false)
            }
        }

        fetchTracking()
        const interval = setInterval(fetchTracking, 15000) // Refresh every 15s
        return () => clearInterval(interval)
    }, [token])

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Đang kết nối GPS...</p>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin</h1>
            <p className="text-gray-500 mb-6">{error}</p>
        </div>
    )

    const isDelivered = delivery.status === 'DELIVERED'

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto shadow-2xl relative">
            {/* Top Branding */}
            <div className="bg-white p-6 pb-20 rounded-b-[3rem] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <img src="/logo.png" className="h-8 grayscale opacity-50" alt="Logo" />
                    <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Trực tiếp
                    </div>
                </div>

                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                    {isDelivered ? 'ĐÃ GIAO XONG!' : 'ĐƠN HÀNG ĐANG ĐẾN'}
                </h1>
                <p className="text-gray-500 font-bold mb-2">Đơn hàng #{delivery.orderNumber}</p>
                <div className="flex items-center gap-2 text-blue-600 font-black text-xs">
                    <Clock className="w-4 h-4" />
                    Dự kiến đến: 10-15 phút
                </div>
            </div>

            {/* Tracking Card */}
            <div className="px-6 -mt-14 space-y-4 pb-12">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isDelivered ? 'bg-green-500 shadow-green-100' : 'bg-blue-600 shadow-blue-100'}`}>
                            {isDelivered ? <CheckCircle2 className="w-7 h-7 text-white" /> : <Truck className="w-7 h-7 text-white animate-bounce-slow" />}
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Trạng thái</p>
                            <p className="text-xl font-black text-gray-900">{isDelivered ? 'Giao hàng thành công' : 'Đang trên đường giao'}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6 relative ml-3">
                        <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-gray-100" />

                        <div className="flex gap-4 relative">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 z-10" />
                            <div>
                                <p className="text-xs font-black text-gray-900">Đã rời kho</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{delivery.shippedAt ? new Date(delivery.shippedAt).toLocaleTimeString() : '--:--'}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 relative">
                            <div className={`w-2 h-2 rounded-full mt-1.5 z-10 ${isDelivered ? 'bg-green-500' : 'bg-blue-600 animate-ping'}`} />
                            <div>
                                <p className="text-xs font-black text-gray-900 uppercase tracking-wider">{isDelivered ? 'Đã giao tới nơi' : 'Vị trí hiện tại'}</p>
                                <p className="text-[10px] text-gray-400 font-bold">
                                    {delivery.currentLat ? `${delivery.currentLat.toFixed(4)}, ${delivery.currentLng.toFixed(4)}` : 'Đang cập nhật GPS...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isDelivered && (
                        <div className="mt-10 p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-800">Cần liên hệ nhanh với tài xế?</p>
                            <a href="tel:0123456789" className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg">
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Delivery Proof Card (only if delivered) */}
                {isDelivered && delivery.proofImageUrl && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
                        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                            🏠 HÌNH ẢNH BÀN GIAO
                        </h3>
                        <div className="aspect-video rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                            <img src={delivery.proofImageUrl} className="w-full h-full object-cover" alt="Proof" />
                        </div>
                        {delivery.evidenceNotes && (
                            <p className="mt-4 text-sm text-gray-600 font-bold italic text-center">"{delivery.evidenceNotes}"</p>
                        )}
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <MapPin className="w-5 h-5 text-red-500" />
                        <h3 className="font-black text-gray-900 uppercase text-xs tracking-wider">Địa điểm nhận hàng</h3>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{typeof delivery.shippingAddress === 'string' ? delivery.shippingAddress : delivery.shippingAddress?.street}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto p-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Được vận hành bởi SmartBuild Logistics
            </div>
        </div>
    )
}
