'use client'

import { useState, useEffect } from 'react'
import { Truck, MapPin, Phone, Package, Send, CheckCircle2, Loader2, Camera, Navigation, AlertCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function DriverDeliveryPage() {
    const params = useParams()
    const token = params.token as string

    const [step, setStep] = useState(1) // 1: Info, 2: Proof, 3: Success
    const [loading, setLoading] = useState(false)
    const [delivery, setDelivery] = useState<any>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [notes, setNotes] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDeliveryInfo = async () => {
            try {
                const res = await fetch(`/api/public/delivery/${token}`)
                const data = await res.json()
                if (res.ok) {
                    setDelivery(data.data)
                    if (data.data.status === 'DELIVERED') {
                        setStep(3)
                    }
                } else {
                    setError(data.error?.message || 'Không tìm thấy vận đơn')
                }
            } catch (err) {
                setError('Lỗi kết nối máy chủ')
            }
        }
        fetchDeliveryInfo()

        // Flow 3: Start real-time tracking pings
        let interval: NodeJS.Timeout
        if (navigator.geolocation) {
            interval = setInterval(() => {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    await fetch(`/api/public/delivery/${token}/ping`, {
                        method: 'POST',
                        body: JSON.stringify({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        })
                    })
                })
            }, 15000) // Ping every 15s to save battery but keep UX smooth
        }
        return () => clearInterval(interval)
    }, [token])

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreview(url)
        }
    }

    const handleComplete = async () => {
        if (!preview) {
            toast.error('Vui lòng chụp ảnh bằng chứng giao hàng')
            return
        }

        setLoading(true)
        try {
            // Get location if possible
            let lat = null, lng = null
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject)
                })
                lat = pos.coords.latitude
                lng = pos.coords.longitude
            } catch (e) {
                console.warn('Geolocation failed', e)
            }

            const res = await fetch(`/api/public/delivery/${token}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proofImageUrl: preview,
                    evidenceNotes: notes,
                    lat,
                    lng
                })
            })

            const data = await res.json()
            if (res.ok) {
                setStep(3)
            } else {
                toast.error(data.error?.message || 'Lỗi khi xác nhận giao hàng')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Lỗi xác thực</h1>
                <p className="text-gray-500 mb-6">{error}</p>
            </div>
        )
    }

    if (!delivery && !error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">ĐÃ HOÀN THÀNH!</h1>
                <p className="text-gray-600 mb-8 font-medium">Bạn đã hoàn thành việc giao đơn hàng. Thông tin đã được gửi đến khách hàng & quản lý.</p>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 w-full mb-8">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Mã đơn hàng</p>
                    <p className="text-xl font-black text-green-700">#{delivery.orderNumber}</p>
                </div>
                <p className="text-xs text-gray-400 font-bold italic">Cảm ơn tài xế, chúc bạn lái xe an toàn!</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col max-w-lg mx-auto shadow-2xl relative">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white rounded-b-[2.5rem] shadow-xl sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl leading-tight">GIAO HÀNG</h2>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Đơn hàng #{delivery.orderNumber}</p>
                        </div>
                    </div>
                    <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        {delivery.status === 'SHIPPED' ? 'Đang giao' : delivery.status}
                    </div>
                </div>
            </div>

            {step === 1 ? (
                <div className="flex-1 p-5 space-y-4">
                    {/* Address Card */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <MapPin className="w-5 h-5 text-red-500" />
                            <h3 className="font-black text-gray-900">ĐỊA CHỈ GIAO HÀNG</h3>
                        </div>
                        <p className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">
                            {typeof delivery.shippingAddress === 'string'
                                ? delivery.shippingAddress
                                : `${delivery.shippingAddress?.street || ''}, ${delivery.shippingAddress?.district || ''}, ${delivery.shippingAddress?.city || ''}`}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(typeof delivery.shippingAddress === 'string' ? delivery.shippingAddress : delivery.shippingAddress?.street + ' ' + delivery.shippingAddress?.city)}`}
                                target="_blank"
                                className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-4 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-sm"
                            >
                                <Navigation className="w-4 h-4" /> CHỈ ĐƯỜNG
                            </a>
                            <a
                                href={`tel:${delivery.customerPhone}`}
                                className="flex items-center justify-center gap-2 bg-green-100 text-green-700 py-4 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-sm"
                            >
                                <Phone className="w-4 h-4" /> GỌI KHÁCH
                            </a>
                        </div>
                    </div>

                    {/* Customer & Items Card */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-orange-500" />
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-wider">Chi tiết đơn hàng</h3>
                            </div>
                            <p className="text-sm font-black text-blue-600">{(delivery.totalAmount || 0).toLocaleString()}đ</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {delivery.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-xl">
                                    <span className="font-bold text-gray-800">{item.name}</span>
                                    <span className="font-black text-blue-600">x{item.quantity} {item.unit}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-lg"
                        >
                            <Send className="w-6 h-6" /> XÁC NHẬN ĐÃ ĐẾN
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-5">
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-6">
                        <div className="mb-2">
                            <h3 className="font-black text-gray-900 text-xl mb-1">Xác nhận giao hàng</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bước cuối cùng: Chụp ảnh bằng chứng</p>
                        </div>

                        {/* Camera Preview */}
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhoto}
                                className="hidden"
                                id="camera-input"
                                required
                            />
                            <label
                                htmlFor="camera-input"
                                className={`w-full h-80 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-inner ${preview ? 'border-blue-500' : 'border-gray-200 bg-gray-50'}`}
                            >
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-active:scale-90 transition-transform shadow-lg shadow-blue-50">
                                            <Camera className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-black text-blue-600">CHỤP ẢNH VẬT TƯ ĐÃ GIAO</span>
                                        <span className="text-[10px] text-gray-400 mt-2 font-bold leading-tight px-10 text-center uppercase tracking-wider">(Vui lòng chụp rõ hiện trường bàn giao)</span>
                                    </>
                                )}
                            </label>
                            {preview && (
                                <button
                                    onClick={() => setPreview(null)}
                                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg font-bold text-xs"
                                >
                                    Chụp lại
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú giao hàng (nếu có)</label>
                            <textarea
                                placeholder="Vd: Khách gửi bảo vệ, Hàng bị móp 1 bao..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 text-sm focus:outline-none transition-all font-bold text-gray-900"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl active:scale-[0.98] transition-all text-sm"
                            >
                                QUAY LẠI
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={loading || !preview}
                                className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-sm disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'XÁC NHẬN GIAO XONG'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Info for safety */}
            <div className="bg-slate-800 p-4 flex items-center justify-between text-white/50 text-[10px] font-bold uppercase tracking-widest">
                <span>Hỗ trợ kỹ thuật: 0123.456.789</span>
                <span>SmartBuild Driver Portal</span>
            </div>
        </div>
    )
}
