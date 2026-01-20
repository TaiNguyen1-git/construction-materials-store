
'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Copy, ExternalLink, Package, Check, X, Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ContractorTeamPage() {
    const [activeTab, setActiveTab] = useState<'LINKS' | 'REQUESTS'>('REQUESTS')
    const [data, setData] = useState<any>({ projects: [], requests: [], reports: [] })
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/contractors/team-dashboard')
            const json = await res.json()
            if (res.ok) {
                setData(json.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleGenerateToken = async (projectId: string) => {
        try {
            const res = await fetch(`/api/contractors/projects/${projectId}/report-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE' })
            })
            if (res.ok) {
                toast.success('Đã tạo link mới')
                fetchData() // Refresh to see token
            }
        } catch (e) {
            toast.error('Lỗi tạo link')
        }
    }

    const copyLink = (token: string) => {
        const link = `${window.location.origin}/report/${token}`
        navigator.clipboard.writeText(link)
        toast.success('Đã copy link báo cáo')
    }

    const handleApproveRequest = async (id: string, items: any[]) => {
        // Here we would call an API, but for demo UI we'll just toast
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Đang thêm vào giỏ hàng...',
                success: 'Đã thêm vật tư vào giỏ hàng!',
                error: 'Lỗi'
            }
        )
        // Optimistic update
        setData({
            ...data,
            requests: data.requests.filter((r: any) => r.id !== id)
        })
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" /> Quản lý Đội thợ & Vật tư
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('REQUESTS')}
                    className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'REQUESTS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Package className="w-4 h-4" />
                    Yêu cầu Vật tư
                    {data.requests.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{data.requests.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('LINKS')}
                    className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'LINKS' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <ExternalLink className="w-4 h-4" />
                    Link Báo cáo / QR
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : (
                <>
                    {activeTab === 'REQUESTS' && (
                        <div className="space-y-4">
                            {data.requests.length === 0 ? (
                                <div className="text-center p-12 bg-gray-50 rounded-xl text-gray-500">
                                    Không có yêu cầu vật tư nào cần duyệt
                                </div>
                            ) : (
                                data.requests.map((req: any) => (
                                    <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Mới</span>
                                                    <span className="text-sm font-bold text-gray-900">{req.project?.title || 'Dự án chưa đặt tên'}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Yêu cầu bởi <span className="font-bold text-gray-900">{req.workerName}</span> • {new Date(req.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                                    <X className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleApproveRequest(req.id, req.items)}
                                                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" /> Duyệt & Thêm vào Giỏ
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Danh sách vật tư</h4>
                                            <div className="space-y-2">
                                                {req.items.map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                        <span className="font-medium text-gray-700">{item.name}</span>
                                                        <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{item.quantity} {item.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {req.notes && (
                                                <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600 italic">
                                                    "{req.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'LINKS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.projects.map((project: any) => (
                                <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-gray-900 line-clamp-1" title={project.name}>{project.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {project.status === 'IN_PROGRESS' ? 'Đang thi công' : project.status}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                                        {project.activeToken ? (
                                            <>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Mã Token Dự Án</p>
                                                <p className="font-mono text-xl font-bold text-blue-600 tracking-wider mb-2">{project.activeToken}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic py-2">Chưa có link báo cáo</p>
                                        )}
                                    </div>

                                    {project.activeToken ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyLink(project.activeToken)}
                                                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" /> Copy Link
                                            </button>
                                            <Link
                                                href={`/report/${project.activeToken}`}
                                                target="_blank"
                                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                title="Mở thử"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateToken(project.id)}
                                            className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Tạo Link Báo Cáo
                                        </button>
                                    )}
                                </div>
                            ))}
                            {data.projects.length === 0 && (
                                <div className="col-span-full text-center p-12 text-gray-400">
                                    Bạn chưa có dự án nào đang chạy.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
