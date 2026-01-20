'use client'

/**
 * Worker Public Report Page - Production Version
 * Access via Magic Link/QR Code - No Login Required
 */

import { useState, useEffect } from 'react'
import { Camera, Send, CheckCircle2, Loader2, HardHat, MapPin, AlertCircle, Package, Plus, Trash2, ChevronRight } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function WorkerReportPage() {
    const params = useParams()
    const token = params.token as string

    const [activeTab, setActiveTab] = useState<'PHOTO' | 'MATERIAL'>('PHOTO')
    const [step, setStep] = useState(1) // 1: Form, 2: Success
    const [loading, setLoading] = useState(false)
    const [projectInfo, setProjectInfo] = useState<any>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [workerName, setWorkerName] = useState('')
    const [notes, setNotes] = useState('')
    const [selectedMilestone, setSelectedMilestone] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Material Request State
    const [materialItems, setMaterialItems] = useState<{ id: number; name: string; quantity: string; unit: string }[]>([
        { id: 1, name: '', quantity: '', unit: 'bao' }
    ])

    useEffect(() => {
        const fetchProjectInfo = async () => {
            try {
                const res = await fetch(`/api/public/project-info/${token}`)
                const data = await res.json()
                if (res.ok) {
                    setProjectInfo(data.data)
                } else {
                    setError(data.error?.message || 'Link không hợp lệ')
                }
            } catch (err) {
                setError('Lỗi kết nối máy chủ')
            }
        }
        fetchProjectInfo()
    }, [token])

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreview(url)
        }
    }

    const handleSubmitPhoto = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!preview) {
            toast.error('Vui lòng chụp ảnh')
            return
        }
        if (!workerName) {
            toast.error('Vui lòng nhập tên của bạn')
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
                    photoUrl: preview,
                    milestoneId: selectedMilestone || null
                })
            })

            const data = await res.json()
            if (res.ok) {
                setStep(2)
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitMaterials = async (e: React.FormEvent) => {
        e.preventDefault()
        const validItems = materialItems.filter(item => item.name && item.quantity)
        if (validItems.length === 0) {
            toast.error('Vui lòng nhập ít nhất 1 loại vật tư')
            return
        }
        if (!workerName) {
            toast.error('Vui lòng nhập tên của bạn')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/public/material-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    workerName,
                    items: validItems,
                    notes,
                    priority: 'MEDIUM'
                })
            })

            const data = await res.json()
            if (res.ok) {
                setStep(2)
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const addMaterialItem = () => {
        setMaterialItems([...materialItems, { id: Date.now(), name: '', quantity: '', unit: 'bao' }])
    }

    const removeMaterialItem = (id: number) => {
        if (materialItems.length > 1) {
            setMaterialItems(materialItems.filter(i => i.id !== id))
        }
    }

    const updateMaterialItem = (id: number, field: string, value: string) => {
        setMaterialItems(materialItems.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Không thể truy cập</h1>
                <p className="text-gray-500 mb-6">{error}</p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400">
                    Mã Token: {token}
                </div>
            </div>
        )
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-lg shadow-green-200">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">ĐÃ GỬI THÀNH CÔNG!</h1>
                <p className="text-gray-600 mb-8">
                    {activeTab === 'PHOTO'
                        ? 'Ảnh chủa bạn đã được gửi đến chủ thầu và khách hàng. Cảm ơn!'
                        : 'Yêu cầu vật tư đã được gửi. Chúng tôi sẽ xử lý sớm nhất.'}
                </p>

                {/* Growth Hack: Claim Profile Widget */}
                <div className="bg-white p-5 rounded-2xl shadow-xl w-full mb-6 relative overflow-hidden border border-blue-100">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <div className="flex items-start gap-3 text-left">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <HardHat className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Bạn là thợ chuyên nghiệp?</h3>
                            <p className="text-xs text-gray-500 mt-1">Lưu lại lịch sử làm việc này vào hồ sơ để tăng uy tín và nhận thêm việc mới.</p>
                        </div>
                    </div>
                    <Link
                        href={`/worker/claim-profile?token=${token}&name=${workerName}`}
                        className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        Tạo Hồ Sơ Thợ Ngay <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <button
                    onClick={() => { setStep(1); setPreview(null); setNotes(''); }}
                    className="w-full py-4 bg-white text-blue-600 font-bold rounded-2xl shadow-md border border-blue-100"
                >
                    Gửi thêm nội dung khác
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto shadow-2xl relative">
            {/* Header Mini */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white rounded-b-[2.5rem] shadow-xl sticky top-0 z-50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                            <HardHat className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl leading-tight">SITE PORTAL</h2>
                            <p className="text-[10px] uppercase font-bold text-blue-100 tracking-widest opacity-80">Công trường thông minh</p>
                        </div>
                    </div>
                    {projectInfo && (
                        <div className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            Dự án: {projectInfo.projectName}
                        </div>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-blue-800/40 p-1 rounded-2xl backdrop-blur-sm border border-white/10">
                    <button
                        onClick={() => setActiveTab('PHOTO')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'PHOTO' ? 'bg-white text-blue-700 shadow-md scale-[1.02]' : 'text-blue-100'}`}
                    >
                        <Camera className="w-4 h-4" /> BÁO CÁO ẢNH
                    </button>
                    <button
                        onClick={() => setActiveTab('MATERIAL')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'MATERIAL' ? 'bg-white text-blue-700 shadow-md scale-[1.02]' : 'text-blue-100'}`}
                    >
                        <Package className="w-4 h-4" /> CẦN VẬT TƯ
                    </button>
                </div>
            </div>

            <div className="flex-1 p-5 -mt-2">
                <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 mb-4">

                    {/* Common Info: Name */}
                    <div className="mb-6">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Họ tên của bạn</label>
                        <input
                            type="text"
                            placeholder="Vd: Thợ Tuấn, Đội hồ..."
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 text-sm focus:outline-none transition-all font-bold text-gray-900"
                            value={workerName}
                            onChange={(e) => setWorkerName(e.target.value)}
                            required
                        />
                    </div>

                    {activeTab === 'PHOTO' ? (
                        <form onSubmit={handleSubmitPhoto} className="space-y-6">
                            {/* Milestone Selection (The Smart Release flow) */}
                            {projectInfo?.milestones && projectInfo.milestones.length > 0 && (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giai đoạn thi công</label>
                                    <select
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 text-sm focus:outline-none transition-all font-bold text-gray-900 appearance-none bg-[url('data:image/svg+xml;chatset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_1.5rem_center] bg-no-repeat"
                                        value={selectedMilestone}
                                        onChange={(e) => setSelectedMilestone(e.target.value)}
                                    >
                                        <option value="">-- Chọn giai đoạn (không bắt buộc) --</option>
                                        {projectInfo.milestones.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-[10px] text-blue-500 font-bold italic">Chọn giai đoạn sẽ giúp khách hàng giải ngân tiền nhanh hơn cho nhà thầu.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                    Hình ảnh thực tế
                                    {preview && <button type="button" onClick={() => setPreview(null)} className="text-[10px] text-red-500 font-black underline">CHỤP LẠI</button>}
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
                                        className={`w-full h-80 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-inner ${preview ? 'border-blue-500' : 'border-gray-200 bg-gray-50'}`}
                                    >
                                        {preview ? (
                                            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-active:scale-90 transition-transform shadow-lg shadow-blue-50">
                                                    <Camera className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <span className="text-sm font-black text-blue-600">CHẠM ĐỂ CHỤP HÌNH</span>
                                                <span className="text-[10px] text-gray-400 mt-2 font-bold">(Ảnh công việc đã hoàn thành)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú (tùy chọn)</label>
                                <textarea
                                    placeholder="Vd: Đã hoàn thiện sơn lót..."
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 text-sm focus:outline-none transition-all font-bold text-gray-900"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-lg disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> GỬI BÁO CÁO</>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitMaterials} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Danh sách vật tư còn thiếu</label>
                                <div className="space-y-3">
                                    {materialItems.map((item, index) => (
                                        <div key={item.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    placeholder="Tên vật tư (vd: Xi măng)"
                                                    className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold placeholder:font-medium placeholder:text-gray-300 outline-none"
                                                    value={item.name}
                                                    onChange={(e) => updateMaterialItem(item.id, 'name', e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Số lượng"
                                                        className="w-2/3 bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                                                        value={item.quantity}
                                                        onChange={(e) => updateMaterialItem(item.id, 'quantity', e.target.value)}
                                                    />
                                                    <select
                                                        className="w-1/3 bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                                                        value={item.unit}
                                                        onChange={(e) => updateMaterialItem(item.id, 'unit', e.target.value)}
                                                    >
                                                        <option value="bao">Bao</option>
                                                        <option value="khối">Khối (m3)</option>
                                                        <option value="kg">KG</option>
                                                        <option value="viên">Viên</option>
                                                        <option value="tấm">Tấm</option>
                                                        <option value="cuộn">Cuộn</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeMaterialItem(item.id)}
                                                className="p-2 text-red-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addMaterialItem}
                                    className="w-full mt-4 py-3 bg-white border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black text-xs flex items-center justify-center gap-2 active:bg-blue-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> THÊM LOẠI KHÁC
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú yêu cầu</label>
                                <textarea
                                    placeholder="Vd: Đang cần gấp trong sáng nay để kịp đổ sàn..."
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 text-sm focus:outline-none transition-all font-bold text-gray-900"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-orange-600 text-white font-black rounded-[2rem] shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-lg disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Package className="w-6 h-6" /> GỬI YÊU CẦU NGAY</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-8 text-center bg-gray-100 rounded-t-[3rem]">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hệ thống SmartBuild Verified</span>
                </div>
                <p className="text-[9px] text-gray-300 font-medium px-10">Mọi báo cáo được lưu trữ kèm vị trí và thời gian thực để đảm bảo tính minh bạch giữa các bên.</p>
            </div>
        </div>
    )
}
