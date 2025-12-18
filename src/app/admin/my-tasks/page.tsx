'use client'

import { useState, useEffect } from 'react'
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertCircle,
    Upload,
    MessageSquare,
    Calendar,
    CheckCheck,
    Image as ImageIcon,
    FileText,
    Loader2,
    X
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'

interface Task {
    id: string
    title: string
    description: string
    status: string
    priority: string
    dueDate: string
    taskType: string
    proofUrl?: string
    proofNotes?: string
    submittedAt?: string
}

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofNotes, setProofNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const headers = getAuthHeaders()
            const response = await fetch('/api/tasks/my-tasks', { headers })
            const result = await response.json()
            if (result.success) {
                setTasks(result.data)
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProofFile(file)
            // Only create preview URL for images and videos
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
            } else {
                // For documents, just set a placeholder
                setPreviewUrl('document')
            }
        }
    }

    const handleSubmitProof = async () => {
        if (!selectedTask || !proofFile) return

        try {
            setSubmitting(true)

            // 1. Upload file
            const formData = new FormData()
            formData.append('file', proofFile)

            const uploadRes = await fetch('/api/upload/secure', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            })

            const uploadResult = await uploadRes.json()
            if (!uploadRes.ok) throw new Error(uploadResult.error || 'Upload failed')

            // 2. Submit task completion
            const submitRes = await fetch('/api/tasks/my-tasks', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    taskId: selectedTask.id,
                    proofUrl: `/api/files/${uploadResult.fileId}`, // Assuming a path to access files
                    proofNotes
                })
            })

            if (submitRes.ok) {
                alert('Đã gửi minh chứng thành công! Đang chờ quản lý duyệt.')
                setSelectedTask(null)
                setProofFile(null)
                setProofNotes('')
                setPreviewUrl(null)
                fetchTasks()
            }
        } catch (error: any) {
            alert('Lỗi: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-5 h-5 text-gray-400" />
            case 'IN_PROGRESS': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            case 'AWAITING_REVIEW': return <CheckCheck className="w-5 h-5 text-yellow-500" />
            case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-green-500" />
            default: return <AlertCircle className="w-5 h-5 text-red-400" />
        }
    }

    const getPriorityBadge = (priority: string) => {
        const colors = {
            LOW: 'bg-gray-100 text-gray-600',
            MEDIUM: 'bg-blue-100 text-blue-600',
            HIGH: 'bg-orange-100 text-orange-600',
            URGENT: 'bg-red-100 text-red-600'
        }
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${(colors as any)[priority]}`}>
                {priority}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Công việc của tôi</h2>
                    <p className="text-gray-500">Xem và cập nhật trạng thái các công việc được giao</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-xl">
                    <span className="text-sm font-medium text-blue-700">
                        {tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length} công việc đang thực hiện
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-gray-100">
                    <ClipboardList className="w-20 h-20 text-gray-100 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Bạn chưa có công việc nào</h3>
                    <p className="text-gray-500">Khi Admin giao việc, các đầu việc sẽ xuất hiện ở đây.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`bg-white p-5 rounded-2xl shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${selectedTask?.id === task.id ? 'border-blue-500' : 'border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(task.status)}
                                        <h4 className="font-bold text-gray-900">{task.title}</h4>
                                    </div>
                                    {getPriorityBadge(task.priority)}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                    {task.description || 'Không có mô tả'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Hạn: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </div>
                                    <span className={`font-bold ${task.status === 'COMPLETED' ? 'text-green-600' :
                                        task.status === 'AWAITING_REVIEW' ? 'text-yellow-600' : 'text-blue-600'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:sticky lg:top-6 h-fit">
                        {selectedTask ? (
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-black text-gray-900">{selectedTask.title}</h3>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mô tả chi tiết</span>
                                        <p className="text-gray-700 mt-1 leading-relaxed">
                                            {selectedTask.description || 'Không có mô tả thêm.'}
                                        </p>
                                    </div>

                                    {selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'AWAITING_REVIEW' ? (
                                        <div className="pt-6 border-t border-gray-50">
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Upload className="w-5 h-5 text-blue-600" />
                                                Nộp minh chứng hoàn thành
                                            </h4>

                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    {previewUrl ? (
                                                        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-blue-100 bg-gray-50">
                                                            {previewUrl === 'document' ? (
                                                                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                                                                    <FileText className="w-16 h-16 text-blue-500 mb-3" />
                                                                    <p className="font-bold text-gray-800">{proofFile?.name}</p>
                                                                    <p className="text-sm text-gray-500">{proofFile ? (proofFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
                                                                </div>
                                                            ) : proofFile?.type.startsWith('video/') ? (
                                                                <video src={previewUrl} controls className="w-full h-full object-contain" />
                                                            ) : (
                                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            )}
                                                            <button
                                                                onClick={() => { setProofFile(null); setPreviewUrl(null); }}
                                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                                            <div className="flex gap-3 mb-3">
                                                                <ImageIcon className="w-10 h-10 text-gray-300" />
                                                                <FileText className="w-10 h-10 text-gray-300" />
                                                            </div>
                                                            <span className="text-sm text-gray-500 font-medium text-center px-4">Bấm để tải ảnh, video hoặc tài liệu (PDF, Word, Excel)</span>
                                                            <span className="text-xs text-gray-400 mt-1">Tối đa 10MB</span>
                                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />
                                                        </label>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú kết quả</label>
                                                    <textarea
                                                        value={proofNotes}
                                                        onChange={(e) => setProofNotes(e.target.value)}
                                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                                        placeholder="Nhập ghi chú công việc (nếu có)..."
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleSubmitProof}
                                                    disabled={!proofFile || submitting}
                                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Đang gửi tài liệu...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCheck className="w-5 h-5" />
                                                            Xác nhận hoàn thành & Gửi duyệt
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-6 border-t border-gray-50">
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    Minh chứng đã nộp
                                                </h4>
                                                {selectedTask.proofUrl && (
                                                    <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-sm">
                                                        <img src={selectedTask.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-600 italic">
                                                    "{selectedTask.proofNotes || 'Không có ghi chú.'}"
                                                </p>
                                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                                    <Clock className="w-3 h-3" />
                                                    Gửi lúc: {selectedTask.submittedAt ? new Date(selectedTask.submittedAt).toLocaleString('vi-VN') : 'N/A'}
                                                </div>
                                            </div>

                                            {selectedTask.status === 'AWAITING_REVIEW' && (
                                                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                                                    <p className="text-sm text-yellow-700">
                                                        Công việc đang được Quản lý kiểm tra. Bạn sẽ nhận được thông báo sau khi được duyệt.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 p-10">
                                <MessageSquare className="w-12 h-12 mb-4" />
                                <p className="font-medium">Chọn một công việc để xem chi tiết và nộp minh chứng</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
