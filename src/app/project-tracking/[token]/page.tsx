
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Image / Info */}
            <div className="bg-slate-900 text-white pt-10 pb-20 px-6 rounded-b-[3rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <MapPin className="w-64 h-64" />
                </div>
                <div className="max-w-2xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full tracking-widest">Đang Thi Công</span>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2 leading-tight">{data.project.title}</h1>
                    <p className="text-slate-300 font-medium flex items-center gap-2 text-sm mb-6">
                        <MapPin className="w-4 h-4" /> {data.project.address}
                    </p>

                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {data.contractor.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Đơn vị thi công</p>
                            <p className="font-bold text-white">{data.contractor.name}</p>
                        </div>
                        <a href={`tel:${data.contractor.phone}`} className="ml-auto bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors">
                            <Phone className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="max-w-2xl mx-auto px-6 -mt-10 relative z-20">
                <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100 min-h-[500px]">
                    <h2 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        NHẬT KÝ CÔNG TRÌNH
                    </h2>

                    <div className="relative border-l-2 border-gray-100 ml-3 space-y-10 pb-10">
                        {data.timeline.length === 0 ? (
                            <div className="pl-8 text-gray-400 text-sm italic">
                                Chưa có cập nhật nào. Công trình đang chuẩn bị khởi công.
                            </div>
                        ) : (
                            data.timeline.map((item: any, i: number) => (
                                <div key={i} className="relative pl-8">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-0 w-5 h-5 bg-white border-4 border-blue-500 rounded-full"></div>

                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                        {new Date(item.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>

                                    <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>

                                    {item.description && (
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100">
                                            "{item.description}"
                                            <span className="block mt-1 text-[10px] font-bold text-gray-400 uppercase">- {item.workerName}</span>
                                        </p>
                                    )}

                                    {item.image && (
                                        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 group">
                                            <img
                                                src={item.image}
                                                alt="Progress"
                                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center mt-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
                Powered by SmartBuild Tracking
            </div>
        </div>
    )
}
