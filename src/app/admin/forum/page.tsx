'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Trash2, Search, AlertTriangle, ShieldCheck, Flag, Filter, Lock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { fetchWithAuth } from '@/lib/api-client'

export default function AdminForumDashboard() {
    const [discussions, setDiscussions] = useState<any[]>([])
    const [stats, setStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('ALL') // ALL, APPROVED, PENDING_REVIEW, REJECTED, SPAM
    const [keyword, setKeyword] = useState('')

    const fetchQueue = async () => {
        setLoading(true)
        try {
            const url = new URL('/api/admin/forum', window.location.origin)
            url.searchParams.set('status', statusFilter)
            if (keyword) url.searchParams.set('keyword', keyword)

            const res = await fetchWithAuth(url.toString())
            const data = await res.json()
            if (data.success) {
                setDiscussions(data.data)
                setStats(data.stats)
            }
        } catch (error) {
            toast.error('Lỗi khi tải hàng đợi kiểm duyệt!')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQueue()
    }, [statusFilter])

    const handleAction = async (id: string, action: string) => {
        const confirmMsg = action === 'DELETE' ? 'Xóa vĩnh viễn bài này?' : 
                           action === 'APPROVED' ? 'Duyệt bài này hiện lên Web?' : 
                           'Khóa/Từ chối bài này?'
        
        if (!confirm(confirmMsg)) return

        const toastId = toast.loading('Đang xử lý...')
        try {
            const res = await fetchWithAuth('/api/admin/forum', {
                method: 'PUT',
                body: JSON.stringify({ discussionId: id, action })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Xử lý thành công!', { id: toastId })
                fetchQueue() // Tải lại bảng
            } else {
                toast.error(data.error || 'Có lỗi xảy ra', { id: toastId })
            }
        } catch (error) {
            toast.error('Lỗi server', { id: toastId })
        }
    }

    const pendingCount = stats.find(s => s.status === 'PENDING_REVIEW')?._count || 0
    const approvedCount = stats.find(s => s.status === 'APPROVED')?._count || 0

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý & Kiểm Duyệt Diễn Đàn</h1>
                    <p className="text-gray-500 mt-1">Lưới giám sát 3-Lớp: Kiểm duyệt Lọc AI và Tố Cáo từ Cộng đồng.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Cần Duyệt Gấp</p>
                            <h3 className="text-2xl font-black text-gray-900">{pendingCount} <span className="text-sm font-normal text-gray-400">bài bị Cờ báo cáo</span></h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500">An Toàn Trên Web</p>
                            <h3 className="text-2xl font-black text-gray-900">{approvedCount} <span className="text-sm font-normal text-gray-400">chủ đề sạch</span></h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setStatusFilter('ALL')} 
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >Tất Cả</button>
                    <button 
                        onClick={() => setStatusFilter('PENDING_REVIEW')} 
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1 ${statusFilter === 'PENDING_REVIEW' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-orange-500"></span>} Cần Duyệt Chờ Lệnh
                    </button>
                    <button 
                        onClick={() => setStatusFilter('APPROVED')} 
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${statusFilter === 'APPROVED' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >Đã Duyệt Đăng</button>
                    <button 
                        onClick={() => setStatusFilter('SPAM')} 
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${statusFilter === 'SPAM' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >Danh Sách Thùng Rác</button>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm vi phạm từ khóa..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchQueue()}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Data Grid / Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-bold text-gray-700">Chủ Đề & Nội Dung</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-700">Tác Giả</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-700 w-48">Trạng Thái (AI Lọc)</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right w-40">Hành Động Nhánh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        <div className="animate-pulse w-8 h-8 md:mx-auto border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                                        <p className="mt-2 text-sm font-semibold">Đang truy vấn Dữ liệu Cảnh Khuyển...</p>
                                    </td>
                                </tr>
                            ) : discussions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 flex flex-col items-center text-center text-gray-500 border-b-0 w-full min-w-full">
                                        <ShieldCheck className="w-12 h-12 text-gray-200 mb-3" />
                                        <p className="text-gray-900 font-bold mb-1">Cộng đồng đang sạch sẽ!</p>
                                        <p className="text-sm text-gray-400">Không tìm thấy yêu cầu cần xét duyệt nào trong hàng đợi.</p>
                                    </td>
                                </tr>
                            ) : discussions.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 align-top">
                                        <div className="max-w-md">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                {doc.category?.name} 
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                                    {format(new Date(doc.createdAt), 'dd MMMM yyyy HH:mm', { locale: vi })}
                                                </span>
                                            </div>
                                            <a href={`/forum/discussion/${doc.id}`} target="_blank" className="font-bold text-gray-900 mb-1 block hover:text-blue-600">
                                                {doc.title}
                                            </a>
                                            <p className="text-sm text-gray-500 line-clamp-2">{doc.content}</p>
                                            
                                            {/* AI Flag / Reports Warning */}
                                            {(doc.systemFlag || doc.reportCount > 0) && (
                                                <div className="mt-3 flex items-start gap-2 bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100">
                                                    <Flag className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <div className="text-xs font-medium">
                                                        {doc.systemFlag && <span className="block font-bold mb-0.5">Cảnh báo máy học: {doc.systemFlag}</span>}
                                                        {doc.reportCount > 0 && <span className="block">Bị cộng đồng Báo cáo {doc.reportCount} lần.</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{doc.author?.name}</span>
                                            <span className="text-xs text-gray-500">{doc.author?.email}</span>
                                            <span className="inline-flex max-w-max mt-1 text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {doc.author?.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {doc.status === 'PENDING_REVIEW' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-bold border border-orange-200">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Chờ Kiểm Duyệt
                                            </span>
                                        )}
                                        {doc.status === 'APPROVED' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold border border-emerald-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Công Khai Sạch
                                            </span>
                                        )}
                                        {doc.status === 'SPAM' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-bold border border-red-200">
                                                <Lock className="w-3.5 h-3.5" /> Vi Phạm Bị Khóa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <div className="flex flex-col gap-2 opacity-100">
                                            {doc.status !== 'APPROVED' && (
                                                <button onClick={() => handleAction(doc.id, 'APPROVED')} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded text-xs font-bold transition-colors">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Tick Sạch
                                                </button>
                                            )}
                                            {doc.status !== 'SPAM' && (
                                                <button onClick={() => handleAction(doc.id, 'SPAM')} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded text-xs font-bold transition-colors">
                                                    <Lock className="w-3.5 h-3.5" /> Khóa Cấm
                                                </button>
                                            )}
                                            <button onClick={() => handleAction(doc.id, 'DELETE')} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" /> Xóa Tro Cốt
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
} 
