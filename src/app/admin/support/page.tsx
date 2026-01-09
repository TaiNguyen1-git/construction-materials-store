'use client'

import { useState, useEffect } from 'react'
import {
    Headset,
    Search,
    User,
    Phone,
    Mail,
    Calendar,
    Monitor,
    Globe,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Shield,
    Info,
    Box,
    FileText,
    Download,
    Paperclip,
    Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupportManagementPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchRequests()

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchRequests(true)
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchRequests = async (isAuto = false) => {
        try {
            if (!isAuto) setLoading(true)
            else setIsRefreshing(true)

            const res = await fetch('/api/admin/support')
            const data = await res.json()
            if (data.success) {
                setRequests(data.data)
                // If the selected request was updated, refresh its detail
                if (selectedRequest) {
                    const updated = data.data.find((r: any) => r.id === selectedRequest.id)
                    if (updated && JSON.stringify(updated) !== JSON.stringify(selectedRequest)) {
                        setSelectedRequest(updated)
                    }
                }
            } else if (!isAuto) {
                toast.error(data.error?.message || 'Không thể tải yêu cầu hỗ trợ')
            }
        } catch (error) {
            if (!isAuto) toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã cập nhật trạng thái')
                setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r))
                if (selectedRequest?.id === id) {
                    setSelectedRequest({ ...selectedRequest, status: newStatus })
                }
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật')
        }
    }

    const filteredRequests = requests.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search) ||
        r.message.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">CHỜ XỬ LÝ</span>
            case 'IN_PROGRESS': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">ĐANG XỬ LÝ</span>
            case 'RESOLVED': return <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">ĐÃ GIẢI QUYẾT</span>
            case 'CLOSED': return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full">ĐÃ ĐÓNG</span>
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">{status}</span>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Headset className="w-6 h-6 text-indigo-600" />
                        Quản Lý Hỗ Trợ Khách Hàng
                    </h2>
                    <p className="text-sm text-gray-500">Xem và phản hồi các yêu cầu hỗ trợ từ khách hàng</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, SĐT..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh sách yêu cầu</span>
                            {isRefreshing && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full animate-pulse border border-indigo-100">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Đang cập nhật...</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fetchRequests()}
                            disabled={isRefreshing}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                        >
                            <Clock className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-20 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="text-xs text-gray-400 mt-4">Đang tải dữ liệu...</p>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-sm text-gray-400 font-medium tracking-tight">Không tìm thấy yêu cầu nào</p>
                            </div>
                        ) : (
                            filteredRequests.map(req => (
                                <button
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className={`w-full text-left p-5 border-b border-gray-50 transition-all hover:bg-indigo-50/30 group ${selectedRequest?.id === req.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-extrabold text-gray-900 text-[13px] truncate uppercase tracking-tight group-hover:text-indigo-700 transition-colors">{req.name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-500 font-bold mb-3 flex items-center gap-1.5">
                                        <Phone className="w-3 h-3" /> {req.phone}
                                    </div>
                                    <div className="line-clamp-2 text-xs text-gray-600 mb-4 font-medium italic bg-white/50 p-2 rounded-lg border border-gray-100 group-hover:border-indigo-100 transition-all">
                                        "{req.message}"
                                    </div>
                                    <div className="flex items-center justify-between">
                                        {getStatusBadge(req.status)}
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                            CHI TIẾT <ChevronRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
                    {selectedRequest ? (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-[22px] flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-100 transform rotate-3">
                                        {selectedRequest.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight leading-none">{selectedRequest.name}</h3>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {selectedRequest.phone}</div>
                                            {selectedRequest.email && <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {selectedRequest.email}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-auto">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">Trạng thái:</span>
                                    <select
                                        value={selectedRequest.status}
                                        onChange={(e) => updateStatus(selectedRequest.id, e.target.value)}
                                        className="text-xs border-2 border-gray-100 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600 shadow-sm"
                                    >
                                        <option value="PENDING">🕒 Đang chờ</option>
                                        <option value="IN_PROGRESS">⚡ Đang xử lý</option>
                                        <option value="RESOLVED">✅ Đã giải quyết</option>
                                        <option value="CLOSED">🔒 Đã đóng</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                {/* Message Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-5">
                                        <h4 className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <Clock className="w-4 h-4 text-indigo-400" /> Nội dung hỗ trợ
                                        </h4>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            <Calendar className="w-3.5 h-3.5" /> {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                    <div className="bg-indigo-50/30 p-8 rounded-[32px] border-2 border-indigo-100/50 relative shadow-inner">
                                        <div className="absolute -top-3 left-8 px-3 py-1 bg-indigo-600 text-[10px] font-black text-white rounded-full shadow-lg shadow-indigo-100 uppercase tracking-wider">
                                            Chi tiết nội dung
                                        </div>
                                        <p className="text-gray-900 text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                                            {selectedRequest.message}
                                        </p>
                                    </div>
                                </section>

                                {/* Attachments Section */}
                                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                                    <section>
                                        <h4 className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                                            <Paperclip className="w-4 h-4 text-indigo-400" /> Tệp đính kèm ({selectedRequest.attachments.length})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedRequest.attachments.map((file: any, index: number) => (
                                                <a
                                                    key={index}
                                                    href={file.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative flex items-center p-3 bg-white border border-gray-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all decoration-0"
                                                >
                                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-indigo-100">
                                                        {file.fileType === 'image' || file.fileType?.startsWith('image/') ? (
                                                            <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileText className="w-6 h-6 text-indigo-500" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                            {file.fileName}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                            {(file.fileSize / 1024).toFixed(1)} KB
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span className="uppercase">{file.fileName.split('.').pop()}</span>
                                                        </p>
                                                    </div>
                                                    <div className="ml-2 bg-indigo-50 p-1.5 rounded-lg text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Download className="w-4 h-4" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* System Info Section */}
                                <section>
                                    <h4 className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
                                        <Shield className="w-4 h-4 text-indigo-400" /> Thông tin kỹ thuật (Lead metadata)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-[24px] border border-gray-100 bg-gray-50/50 flex items-center gap-5 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                            <div className="bg-white p-3.5 rounded-[18px] shadow-sm text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Địa chỉ IP</div>
                                                <div className="text-sm font-black text-gray-900 font-mono">{selectedRequest.ipAddress || 'Not Captured'}</div>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-[24px] border border-gray-100 bg-gray-50/50 flex items-center gap-5 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                            <div className="bg-white p-3.5 rounded-[18px] shadow-sm text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Hệ điều hành</div>
                                                <div className="text-sm font-black text-gray-900 flex items-center gap-2 flex-wrap">
                                                    {selectedRequest.osName} {selectedRequest.osVersion !== 'Unknown' ? selectedRequest.osVersion : ''}
                                                    <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{selectedRequest.deviceType}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-[24px] border border-gray-100 bg-gray-50/50 flex items-center gap-5 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                            <div className="bg-white p-3.5 rounded-[18px] shadow-sm text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Info className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Trình duyệt</div>
                                                <div className="text-sm font-black text-gray-900">{selectedRequest.browserName} <span className="text-gray-400 text-xs font-medium">v{selectedRequest.browserVersion}</span></div>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-[24px] border border-gray-100 bg-gray-50/50 flex items-center gap-5 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                            <div className="bg-white p-3.5 rounded-[18px] shadow-sm text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Độ phân giải</div>
                                                <div className="text-sm font-black text-gray-900">{selectedRequest.screenRes || 'Resolution N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* User Agent & Page Context Section */}
                                <section className="bg-gray-900 rounded-[32px] p-8 space-y-6 shadow-2xl">
                                    <div>
                                        <h4 className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                                            Chuỗi User Agent (Gốc)
                                        </h4>
                                        <div className="p-5 rounded-2xl bg-black/40 text-indigo-300 font-mono text-[10px] leading-relaxed break-all border border-indigo-900/30">
                                            {selectedRequest.userAgent}
                                        </div>
                                    </div>

                                    {selectedRequest.pageUrl && (
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Trang gửi yêu cầu</div>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-500/20 p-2 rounded-lg">
                                                    < Globe className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <a href={selectedRequest.pageUrl} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-bold flex-1 truncate">
                                                    {selectedRequest.pageUrl}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-6">
                            <div className="relative">
                                <div className="w-32 h-32 bg-gray-50 rounded-[40px] flex items-center justify-center animate-pulse">
                                    <Headset className="w-16 h-16 text-gray-100" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-50">
                                    <Search className="w-5 h-5 text-gray-200" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-black text-gray-400 text-xl uppercase tracking-tighter">Đang chờ lựa chọn</p>
                                <p className="text-xs text-gray-400 font-medium">Vui lòng chọn một yêu cầu khách hàng từ danh sách bên trái</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
