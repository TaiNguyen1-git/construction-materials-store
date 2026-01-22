
'use client'

import { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { ShieldAlert, CheckCircle, XCircle, Search, MessageSquare, ExternalLink, Clock } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'

const Spinner = () => (
    <div className="flex justify-center items-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
)

export default function AdminDisputePage() {
    const [disputes, setDisputes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDispute, setSelectedDispute] = useState<any>(null)
    const [resolution, setResolution] = useState('')
    const [processing, setProcessing] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchDisputes()
    }, [])

    const filteredDisputes = disputes.filter(dis => {
        const query = searchTerm.toLowerCase()
        return (
            dis.customer?.user?.name?.toLowerCase().includes(query) ||
            dis.contractor?.name?.toLowerCase().includes(query) ||
            dis.order?.orderNumber?.toLowerCase().includes(query) ||
            dis.reason?.toLowerCase().includes(query)
        )
    })

    const fetchDisputes = async () => {
        try {
            const res = await fetchWithAuth('/api/disputes')
            if (res.ok) setDisputes(await res.json())
        } catch (error) {
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (status: 'RESOLVED' | 'REJECTED') => {
        if (!resolution) {
            toast.error('Vui lòng nhập hướng giải quyết')
            return
        }

        setProcessing(true)
        try {
            const meRes = await fetchWithAuth('/api/auth/me')
            const me = await meRes.json()

            const res = await fetchWithAuth('/api/disputes', {
                method: 'PUT',
                body: JSON.stringify({
                    disputeId: selectedDispute.id,
                    resolution,
                    status,
                    adminId: me.id
                })
            })

            if (res.ok) {
                toast.success('Đã cập nhật quyết định giải quyết!')
                setSelectedDispute(null)
                setResolution('')
                fetchDisputes()
            }
        } catch (error) {
            toast.error('Lỗi hệ thống')
        } finally {
            setProcessing(false)
        }
    }

    const getDisputeTypeLabel = (type: string) => {
        switch (type) {
            case 'CUSTOMER_TO_STORE': return 'Khách -> Cửa hàng'
            case 'CUSTOMER_TO_CONTRACTOR': return 'Khách -> Nhà thầu'
            case 'CONTRACTOR_TO_CUSTOMER': return 'Nhà thầu -> Khách'
            case 'CONTRACTOR_TO_STORE': return 'Nhà thầu -> Cửa hàng'
            default: return type
        }
    }

    if (loading) return <Spinner />

    return (
        <div className="p-6">
            <Toaster />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldAlert className="text-red-600" /> Quản Lý Tranh Chấp & Khiếu Nại
                    </h1>
                    <p className="text-gray-500">Xem xét và giải quyết các vấn đề giữa các bên</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo mã đơn, tên..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {filteredDisputes.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <Search className="mx-auto text-gray-200 mb-4" size={48} />
                            <p className="text-gray-400">Không tìm thấy khiếu nại nào phù hợp</p>
                        </div>
                    ) : (
                        filteredDisputes.map((dis, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedDispute(dis)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedDispute?.id === dis.id
                                    ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100'
                                    : 'bg-white border-gray-100 hover:shadow-lg'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center font-bold text-gray-600 shadow-inner">
                                            {dis.type.startsWith('CUSTOMER')
                                                ? (dis.customer?.user?.name?.charAt(0) || 'C')
                                                : (dis.contractor?.name?.charAt(0) || 'K')
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                {dis.type.startsWith('CUSTOMER') ? dis.customer?.user?.name : dis.contractor?.name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {getDisputeTypeLabel(dis.type)}
                                                </p>
                                                {dis.order && (
                                                    <p className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        #{dis.order.orderNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${dis.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                        dis.status === 'UNDER_REVIEW' ? 'bg-orange-100 text-orange-700' :
                                            dis.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {dis.status === 'OPEN' ? 'Mới' :
                                            dis.status === 'UNDER_REVIEW' ? 'Đang duyệt' :
                                                dis.status === 'RESOLVED' ? 'Đã xử lý' : 'Từ chối'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-red-600 font-bold text-sm italic bg-red-50/50 px-2 py-0.5 rounded border border-red-100">“{dis.reason}”</span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 italic mb-4">
                                    {dis.description}
                                </p>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 uppercase tracking-tighter">
                                        <Clock size={12} /> {new Date(dis.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                    {dis.evidence?.length > 0 && (
                                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg text-gray-500 font-bold flex items-center gap-1">
                                            📷 {dis.evidence.length} ẢNH
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="lg:col-span-1">
                    {selectedDispute ? (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl sticky top-24 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4">
                                <MessageSquare size={20} className="text-blue-600" /> Bảng Phân Xử
                            </h2>

                            <div className="space-y-6">
                                <section>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Thông tin các bên</label>
                                    <div className="space-y-2">
                                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                            <p className="text-[9px] font-bold text-blue-800 uppercase mb-1">Bên khiếu nại (Creator)</p>
                                            <p className="font-bold text-gray-900">
                                                {selectedDispute.type.startsWith('CUSTOMER')
                                                    ? selectedDispute.customer?.user?.name
                                                    : selectedDispute.contractor?.name}
                                            </p>
                                        </div>
                                        <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                                            <p className="text-[9px] font-bold text-red-800 uppercase mb-1">Bên bị khiếu nại (Target)</p>
                                            <p className="font-bold text-gray-900">
                                                {selectedDispute.type.endsWith('STORE') ? 'Cửa hàng (Store)' :
                                                    selectedDispute.type.endsWith('CONTRACTOR') ? selectedDispute.contractor?.name :
                                                        selectedDispute.customer?.user?.name}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nội dung sự việc</label>
                                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed italic border-l-4 border-red-500">
                                        {selectedDispute.description}
                                    </div>
                                </section>

                                {selectedDispute.evidence?.length > 0 && (
                                    <section>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Bằng chứng hình ảnh ({selectedDispute.evidence.length})</label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {selectedDispute.evidence.map((ev: any, i: number) => (
                                                <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group relative">
                                                    <img src={ev.imageUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink className="text-white" size={20} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {selectedDispute.status !== 'RESOLVED' && selectedDispute.status !== 'REJECTED' ? (
                                    <section className="pt-6 border-t border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Quyết định của Admin</label>
                                        <textarea
                                            value={resolution}
                                            onChange={e => setResolution(e.target.value)}
                                            rows={3}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Nhập phương án giải quyết cuối cùng..."
                                        ></textarea>

                                        <div className="grid grid-cols-2 gap-3 mt-6">
                                            <button
                                                onClick={() => handleResolve('RESOLVED')}
                                                disabled={processing}
                                                className="bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:-translate-y-1"
                                            >
                                                <CheckCircle size={18} /> Đồng ý
                                            </button>
                                            <button
                                                onClick={() => handleResolve('REJECTED')}
                                                disabled={processing}
                                                className="bg-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200 hover:-translate-y-1"
                                            >
                                                <XCircle size={18} /> Bác bỏ
                                            </button>
                                        </div>
                                    </section>
                                ) : (
                                    <section className="pt-6 border-t border-gray-100">
                                        <div className={`p-4 rounded-xl border ${selectedDispute.status === 'RESOLVED' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                            <p className={`text-[10px] font-black uppercase mb-1 ${selectedDispute.status === 'RESOLVED' ? 'text-green-800' : 'text-red-800'}`}>
                                                {selectedDispute.status === 'RESOLVED' ? 'Đã Chấp Thuận' : 'Đã Từ Chối'}
                                            </p>
                                            <p className={`text-sm italic ${selectedDispute.status === 'RESOLVED' ? 'text-green-700' : 'text-red-700'}`}>
                                                “{selectedDispute.resolution}”
                                            </p>
                                        </div>
                                    </section>
                                )}

                                {selectedDispute.order && (
                                    <a
                                        href={`/admin/orders?search=${selectedDispute.order.orderNumber}`}
                                        target="_blank"
                                        className="w-full flex items-center justify-center gap-2 text-xs text-blue-600 font-black py-4 hover:bg-blue-50 border-2 border-dashed border-blue-50 rounded-xl transition-all uppercase tracking-widest mt-4"
                                    >
                                        Chi tiết đơn hàng #{selectedDispute.order.orderNumber} <ExternalLink size={14} />
                                    </a>
                                )}

                                <div className="pt-8 border-t border-gray-100">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <MessageSquare size={16} className="text-gray-400" /> Nhật ký đối chất
                                    </h3>

                                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedDispute.comments?.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic text-center py-4">Chưa có thảo luận nào</p>
                                        ) : (
                                            selectedDispute.comments?.map((comment: any, idx: number) => (
                                                <div key={idx} className={`p-3 rounded-xl border ${comment.author.role === 'ADMIN' ? 'bg-blue-50 border-blue-100 ml-4' : 'bg-gray-50 border-gray-100 mr-4'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black uppercase text-gray-500">{comment.author.name}</span>
                                                        <span className="text-[9px] text-gray-400">{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            placeholder="Nhập nội dung phản hồi hoặc điều hướng các bên..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                            rows={2}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    const content = e.currentTarget.value.trim()
                                                    if (!content) return

                                                    const textarea = e.currentTarget
                                                    try {
                                                        const meRes = await fetchWithAuth('/api/auth/me')
                                                        const me = await meRes.json()

                                                        const res = await fetchWithAuth('/api/disputes/comments', {
                                                            method: 'POST',
                                                            body: JSON.stringify({
                                                                disputeId: selectedDispute.id,
                                                                authorId: me.id,
                                                                content
                                                            })
                                                        })

                                                        if (res.ok) {
                                                            textarea.value = ''
                                                            fetchDisputes()
                                                            // Optional: refresh selectedDispute locally
                                                            const newComment = await res.json()
                                                            setSelectedDispute({
                                                                ...selectedDispute,
                                                                comments: [...(selectedDispute.comments || []), newComment]
                                                            })
                                                        }
                                                    } catch (err) {
                                                        toast.error('Không gửi được phản hồi')
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-medium">Enter để gửi</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50/50 p-20 text-center rounded-3xl border-2 border-dashed border-gray-200 sticky top-24">
                            <ShieldAlert className="mx-auto text-gray-200 mb-4" size={64} />
                            <p className="text-gray-400 font-bold italic tracking-tight">Chọn một khiếu nại từ danh sách <br /> để bắt đầu xử lý</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
