'use client'

/**
 * Worker Public Report Page - Production Version
 * Access via Magic Link/QR Code - No Login Required
 */

import { useState, useEffect } from 'react'
import { Camera, Send, CheckCircle2, Loader2, HardHat, MapPin, AlertCircle, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function WorkerReportPage() {
    const params = useParams()
    const token = params.token as string

    const [step, setStep] = useState(1) // 1: Form, 2: Success
    const [loading, setLoading] = useState(false)
    const [project, setProject] = useState<any>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [workerName, setWorkerName] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Optional: Fetch project info to show on header
    useEffect(() => {
        // Since it's a public page, we'll need a way to verify token and get minimal info
        // For now, we'll just show the token in the placeholder
    }, [token])

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // In a real app, you'd upload this to S3/Cloudinary first
            // For this project, we'll simulate the upload and use a mock URL
            const url = URL.createObjectURL(file)
            setPreview(url)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!preview) {
            toast.error('Vui lòng chụp ảnh')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/public/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    workerName,
                    notes,
                    photoUrl: preview // In real app, this would be the S3 URL
                })
            })

            const data = await res.json()
            if (res.ok) {
                setStep(2)
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
                setError(data.error?.message)
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
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Link không hợp lệ</h1>
                <p className="text-gray-500 mb-6">{error}</p>
            </div>
        )
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-blue-200">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">ĐÃ GỬI BÁO CÁO!</h1>
                <p className="text-gray-600 mb-8">Ảnh của bạn đã được gửi đến chủ thầu thành công. Cảm ơn sự cố gắng của bạn!</p>
                <button
                    onClick={() => { setStep(1); setPreview(null); setNotes(''); }}
                    className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-2xl shadow-sm"
                >
                    Gửi thêm ảnh khác
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl relative">
            {/* Header Mini */}
            <div className="bg-blue-600 p-6 text-white rounded-b-[2rem] shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <HardHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-lg leading-tight">SMARTBUILD WORKER</h2>
                        <p className="text-[10px] uppercase font-bold text-blue-200 tracking-widest">Báo cáo công trường nhanh</p>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-100">
                    <MapPin className="w-3 h-3" />
                    Khu vực: Công trình dự án #{token.slice(0, 6)}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 -mt-4">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-6">

                    {/* Chụp ảnh */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                            1. Chụp hình thực tế
                            {preview && <button type="button" onClick={() => setPreview(null)} className="text-xs text-red-500 font-bold">Chụp lại</button>}
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhoto}
                                className="hidden"
                                id="camera-input"
                                required={!preview}
                            />
                            <label
                                htmlFor="camera-input"
                                className={`w-full h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${preview ? 'border-blue-500' : 'border-gray-300 bg-gray-50'
                                    }`}
                            >
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-active:scale-90 transition-transform">
                                            <Camera className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-500">NHẤN ĐỂ CHỤP ẢNH</span>
                                        <span className="text-[10px] text-gray-400 mt-1 italic">(Yêu cầu ảnh tại công trường)</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Tên thợ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Bạn là ai?</label>
                        <input
                            type="text"
                            placeholder="Nhập tên của bạn (vd: Thợ Tuấn, Đội điện...)"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                            value={workerName}
                            onChange={(e) => setWorkerName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">3. Mô tả nhanh (nếu có)</label>
                        <textarea
                            placeholder="Vd: Đã hoàn thiện sơn lót, hôm nay làm tăng ca..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                GỬI BÁO CÁO NGAY
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Footer */}
            <div className="p-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Được bảo mật bởi hệ thống SmartBuild
            </div>
        </div>
    )
}
