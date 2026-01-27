
'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, MapPin, Phone, User, Image as ImageIcon, Clock } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProjectTrackingPage() {
    const params = useParams()
    const token = params.token as string

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProject = async () => {
            // Mock sending "Seen" signal
            // await fetch(`/api/public/project-tracking/${token}/seen`, { method: 'POST' })

            try {
                const res = await fetch(`/api/public/project-tracking/${token}`)
                const json = await res.json()
                if (res.ok) {
                    setData(json.data)
                } else {
                    setError(json.error?.message || 'Không tìm thấy dự án')
                }
            } catch (e) {
                setError('Lỗi kết nối')
            } finally {
                setLoading(false)
            }
        }
        fetchProject()
    }, [token])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Không thể truy cập</h1>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Link href="/" className="text-blue-600 font-bold hover:underline">Về trang chủ</Link>
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
    }

    if (!data) return null

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
            {/* Premium Journey Header */}
            <div className="bg-[#0c0f17] text-white pt-16 pb-24 px-6 rounded-b-[40px] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <MapPin className="w-96 h-96" />
                </div>
                <div className="max-w-2xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/20 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Live Monitoring</span>
                        </div>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN')}</span>
                    </div>

                    <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase leading-none italic">
                        {data.project.title}
                    </h1>

                    <p className="text-slate-400 font-bold flex items-center gap-2 text-sm mb-10 tracking-tight">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {data.project.address}
                    </p>

                    <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[32px] backdrop-blur-md border border-white/10 shadow-2xl group hover:bg-white/10 transition-all">
                        <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            {data.contractor.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Đơn vị quản lý thi công</p>
                            <p className="text-xl font-black text-white tracking-tight uppercase italic">{data.contractor.name}</p>
                        </div>
                        <a href={`tel:${data.contractor.phone}`} className="h-14 w-14 bg-emerald-500 text-white rounded-[20px] flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-90">
                            <Phone className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Operational Timeline - Paper-like Style */}
            <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-20">
                <div className="bg-white rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.06)] p-10 border border-slate-100 min-h-[500px]">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter italic">
                            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                            NHẬT KÝ CÔNG TRÌNH
                        </h2>
                        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cập nhật lúc</p>
                            <p className="text-[10px] font-black text-slate-600 mt-1">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-12 pb-10">
                        {data.timeline.length === 0 ? (
                            <div className="pl-10 py-20 text-center">
                                <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-[24px] mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-400 text-sm font-black uppercase tracking-widest italic border-t border-slate-50 pt-6">
                                    Dữ liệu đang được đồng bộ...
                                </p>
                            </div>
                        ) : (
                            data.timeline.map((item: any, i: number) => (
                                <div key={i} className="relative pl-10 group">
                                    {/* Timeline Dot with Pulse if it's the latest */}
                                    <div className={`absolute -left-[11px] top-0 w-5 h-5 bg-white border-[5px] rounded-full transition-all ${i === 0 ? 'border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-125' : 'border-slate-200 group-hover:border-blue-300'}`}></div>

                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                            {new Date(item.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {i === 0 && <span className="text-[9px] font-black text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Mới nhất</span>}
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight uppercase italic">{item.title}</h3>

                                    {item.description && (
                                        <div className="bg-slate-50/50 p-6 rounded-[24px] mb-6 border border-slate-50 group-hover:bg-white group-hover:border-blue-100 transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 bg-blue-500/20 rounded-bl-[40px] pointer-events-none">
                                                <ImageIcon className="w-12 h-12" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-600 italic leading-relaxed mb-4 relative z-10">
                                                "{item.description}"
                                            </p>
                                            <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-4 relative z-10">
                                                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    {item.workerName.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.workerName}</span>
                                            </div>
                                        </div>
                                    )}

                                    {item.image && (
                                        <div className="rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 group/img relative">
                                            <div className="absolute inset-0 bg-blue-600/0 group-hover/img:bg-blue-600/20 transition-all z-10 pointer-events-none flex items-center justify-center">
                                                <div className="opacity-0 group-hover/img:opacity-100 transition-all transform translate-y-4 group-hover/img:translate-y-0 text-white font-black text-[10px] uppercase tracking-widest bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">Phóng to ảnh</div>
                                            </div>
                                            <img
                                                src={item.image}
                                                alt="Progress"
                                                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-1000"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center mt-12 mb-8">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mb-4 animate-ping"></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Powered by SmartBuild Quantum v2.0</p>
            </div>
        </div>
    )
}
