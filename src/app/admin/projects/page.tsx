'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api-client'
import {
  Plus, Search, Filter, Calendar, Coins, CheckCircle, Clock,
  AlertCircle, Eye, Edit, Trash2, Check, X, User,
  Building2, Phone, Mail, Play, Pause, XCircle,
  SlidersHorizontal, ChevronRight, Hash, ArrowRight,
  ShieldCheck, Loader2, MoreVertical
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string
  endDate: string | null
  budget: number
  actualCost: number
  progress: number
  priority: string
  createdAt: string
  updatedAt: string
  taskCompletion: number
  totalTasks: number
  completedTasks: number
  moderationStatus: string
  isVerified: boolean
  isPublic: boolean
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  customer?: {
    user: {
      name: string
      email: string
    }
  }
}

const stripMarkdown = (str: string) => {
  if (!str) return 'Không có mô tả'
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/#+\s/g, '')
    .trim()
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    moderationStatus: ''
  })
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0,
    priority: 'MEDIUM'
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.moderationStatus) params.append('moderationStatus', filters.moderationStatus)

      const response = await fetchWithAuth(`/api/projects?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.data || data.projects || []) // Fallback in case of different pagination wrappers
      } else {
        toast.error('Không thể tải danh sách dự án')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Không thể tải danh sách dự án')
    } finally {
      setLoading(false)
    }
  }

  const handleModeration = async (projectId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setFormLoading(true)
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ moderationStatus: status })
      })

      if (response.ok) {
        toast.success(status === 'APPROVED' ? 'Đã duyệt dự án' : 'Đã từ chối dự án')
        fetchProjects()
      } else {
        toast.error('Cập nhật trạng thái thất bại')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setFormLoading(false)
    }
  }

  // Modern UI color mapping
  const getStatusIconAndColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return { icon: Clock, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'Kế Hoạch' }
      case 'IN_PROGRESS':
        return { icon: Play, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Đang Làm' }
      case 'ON_HOLD':
        return { icon: Pause, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Đang Dừng' }
      case 'COMPLETED':
        return { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Hoàn Thành' }
      case 'CANCELLED':
        return { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Đã Hủy' }
      default:
        return { icon: AlertCircle, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: status }
    }
  }

  const getModerationIconAndColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Đã Duyệt' }
      case 'PENDING':
        return { icon: Clock, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Chờ Duyệt' }
      case 'REJECTED':
        return { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Từ Chối' }
      default:
        return { icon: AlertCircle, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: status || 'PENDING' }
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress > 0) return 'bg-amber-500'
    return 'bg-slate-200'
  }

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setForm({
        name: project.name,
        description: project.description || '',
        status: project.status,
        startDate: project.startDate.split('T')[0],
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: project.budget,
        priority: project.priority
      })
    } else {
      setEditingProject(null)
      setForm({
        name: '',
        description: '',
        status: 'PLANNING',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        budget: 0,
        priority: 'MEDIUM'
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
      const method = editingProject ? 'PUT' : 'POST'
      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(form)
      })

      if (response.ok) {
        toast.success(editingProject ? 'Cập nhật thành công!' : 'Tạo mới thành công!')
        closeModal()
        fetchProjects()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể lưu dự án')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProject) return
    setFormLoading(true)
    try {
      const response = await fetchWithAuth(`/api/projects/${deletingProject.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Xóa dự án thành công')
        setDeletingProject(null)
        fetchProjects()
      } else {
        toast.error('Không thể xóa dự án')
      }
    } catch {
      toast.error('Lỗi hệ thống')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    if (filters.status && project.status !== filters.status) return false
    if (filters.priority && project.priority !== filters.priority) return false
    if (filters.moderationStatus && project.moderationStatus !== filters.moderationStatus) return false

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const customerName = project.customer?.user.name.toLowerCase() || ''
      const guestInfo = (project.guestName || '') + (project.guestPhone || '') + (project.guestEmail || '')
      return (
        project.name.toLowerCase().includes(searchLower) ||
        customerName.includes(searchLower) ||
        guestInfo.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm Dự án</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Quản lý, phê duyệt và giám sát toàn bộ dự án từ Khách hàng & Nhà thầu.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center gap-2 transform active:scale-95"
        >
          <Plus className="h-5 w-5" /> Thêm Dự Án
        </button>
      </div>

      {/* Modern Filter Panel */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-sm">Bộ Lọc Điệu Kiện</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tìm kiếm từ khóa</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-100 focus:border-blue-500 focus:bg-white bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                placeholder="Tên, Email, SĐT..."
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tiến độ</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-100 focus:border-blue-500 focus:bg-white bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all cursor-pointer appearance-none"
            >
              <option value="">Tất Cả</option>
              <option value="PLANNING">Lên Kế Hoạch</option>
              <option value="IN_PROGRESS">Đang Thực Hiện</option>
              <option value="ON_HOLD">Tạm Dừng</option>
              <option value="COMPLETED">Hoàn Thành</option>
              <option value="CANCELLED">Đã Hủy</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái duyệt</label>
            <select
              value={filters.moderationStatus}
              onChange={(e) => setFilters({ ...filters, moderationStatus: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-100 focus:border-blue-500 focus:bg-white bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all cursor-pointer appearance-none"
            >
              <option value="">Tất Cả</option>
              <option value="PENDING">Chờ Duyệt (Pending)</option>
              <option value="APPROVED">Đã Duyệt (Approved)</option>
              <option value="REJECTED">Bị Từ Chối (Rejected)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: '', priority: '', moderationStatus: '' })}
              className="w-full h-[50px] px-4 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" /> Đặt Lại
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-400 font-bold text-sm">Đang tải dữ liệu dự án...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Trống Trơn!</h3>
          <p className="text-slate-500 font-medium max-w-sm">Không tìm thấy dự án nào khớp với điều kiện lọc. Vui lòng thử lại với các thông số khác.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">Thông Tin Dự Án</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">Khách Hàng</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">Trạng Thái</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">Tài Chính & Tiến Độ</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap text-right">Tác Vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => {
                  const s = getStatusIconAndColor(project.status)
                  const m = getModerationIconAndColor(project.moderationStatus || 'PENDING')
                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-6 min-w-[320px] align-top">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-black text-lg">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{project.name}</div>
                            <div className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                              {stripMarkdown(project.description || '')}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                <Hash className="w-3 h-3" /> {project.id.slice(-6).toUpperCase()}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(project.startDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top whitespace-nowrap">
                        {project.customer ? (
                          <div>
                            <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                              {project.customer.user.name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3" /> {project.customer.user.email}
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                              <User className="w-3 h-3" /> Đã Xác Thực
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                              {project.guestName || 'Khách Vãng Lai'}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3" /> {project.guestPhone || project.guestEmail || 'N/A'}
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" /> Nhận Từ Khách Ngoài
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6 align-top">
                        <div className="flex flex-col gap-2 w-max">
                          {/* Moderation Status */}
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${m.bg} ${m.text} ${m.border}`}>
                            <m.icon className="w-3.5 h-3.5" />
                            {m.label}
                          </div>
                          {/* Core Status */}
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
                            <s.icon className="w-3.5 h-3.5" />
                            {s.label}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top min-w-[200px]">
                        <div className="mb-4">
                          <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-emerald-500" />
                            {formatCurrency(project.budget)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                            Đã Chi: {formatCurrency(project.actualCost || 0)}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            <span>Tiến Độ CV</span>
                            <span className="text-blue-600">{project.taskCompletion}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(project.taskCompletion)}`}
                              style={{ width: `${project.taskCompletion || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 mt-2 text-right">
                            {project.completedTasks || 0} / {project.totalTasks || 0} Tasks
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Primary Quick Action */}
                          {project.moderationStatus === 'PENDING' ? (
                            <button
                              onClick={() => handleModeration(project.id, 'APPROVED')}
                              className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Duyệt Nhanh</span>
                            </button>
                          ) : (
                            <Link
                              href={`/admin/projects/${project.id}`}
                              className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                              title="Xem Chi Tiết"
                            >
                              <Eye className="w-4 h-4 align-middle" />
                            </Link>
                          )}

                          {/* Secondary Actions Dropdown */}
                          <div className="relative group">
                            <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 hover:bg-slate-200 text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-1.5 group-focus-within:opacity-100 group-focus-within:visible">
                              {project.moderationStatus === 'PENDING' && (
                                <>
                                  <Link
                                    href={`/admin/projects/${project.id}`}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Xem Chi Tiết
                                  </Link>
                                  <button
                                    onClick={() => handleModeration(project.id, 'REJECTED')}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" /> Từ Chối Dự Án
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => openModal(project)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" /> Sửa Thông Tin
                              </button>
                              <div className="h-px bg-slate-100 mx-1 my-1"></div>
                              <button
                                onClick={() => setDeletingProject(project)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa Dự Án
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProject ? 'SỬA THÔNG TIN DỰ ÁN' : 'TẠO MỚI DỰ ÁN'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Tên Dự Án *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-300"
              placeholder="VD: Thi công chuỗi siêu thị X..."
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Mô Tả Nhanh</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all resize-none min-h-[100px] placeholder:font-medium placeholder:text-slate-300"
              placeholder="Mô tả sơ bộ về quy mô, yêu cầu vật tư..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Ngân Sách Ước Tính (VNĐ) *</label>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  type="text"
                  value={form.budget ? new Intl.NumberFormat('vi-VN').format(form.budget) : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setForm({ ...form, budget: parseInt(val) || 0 })
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-emerald-700 font-black focus:border-emerald-500 outline-none transition-all"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Độ Ưu Tiên</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="LOW">Mức Thấp</option>
                <option value="MEDIUM">Trung Bình</option>
                <option value="HIGH">Ưu Tiên Cao</option>
                <option value="URGENT">Khẩn Cấp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Thời gian bắt đầu *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Thời gian kết thúc (Dự kiến)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Trạng Thái Dự Án</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="PLANNING">Đang Lên Kế Hoạch</option>
              <option value="IN_PROGRESS">Đang Triển Khai Thi Công</option>
              <option value="ON_HOLD">Đang Tạm Dừng Hoạt Động</option>
              <option value="COMPLETED">Đã Hoàn Thành Toàn Bộ</option>
              <option value="CANCELLED">Đã Bị Hủy Bỏ</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              disabled={formLoading}
              className="px-6 py-3.5 border-2 border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-800 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingProject ? 'Lưu Cập Nhật' : 'Phát Hành Dự Án')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
        title="XÓA DỰ ÁN NÀY?"
        message={`Cảnh báo: Hành động xóa dự án "${deletingProject?.name}" sẽ không thể khôi phục lại dữ liệu.`}
        confirmText="QUYẾT ĐỊNH XÓA"
        type="danger"
        loading={formLoading}
      />
    </div>
  )
}