'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Play,
  Pause,
  Check,
  User,
  Package,
  FileText,
  Plus,
  ChevronRight,
  MessageCircle,
  TrendingUp,
  Map,
  ArrowLeft,
  Activity,
  Zap,
  ShieldCheck,
  Truck,
  Layers,
  ShoppingBag,
  Info
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import ProjectRoadmap from '@/components/ProjectRoadmap'
import Image from 'next/image'

interface Project {
  id: string
  name: string
  description: string | null
  contractorId: string | null
  status: string
  startDate: string
  endDate: string | null
  budget: number
  actualCost: number
  progress: number
  priority: string
  notes: string | null
  createdAt: string
  updatedAt: string
  taskCompletion: number
  totalTasks: number
  completedTasks: number
  totalMaterialCost: number
  customer: {
    user: {
      name: string
      email: string
    }
  }
  contractor: {
    user: {
      name: string
      email: string
    }
    displayName?: string
    avatar?: string
  } | null
  projectTasks: Task[]
  projectMaterials: Material[]
}

interface Task {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  estimatedHours: number | null
  actualHours: number | null
  progress: number
  notes: string | null
  createdAt: string
  updatedAt: string
  assignee: {
    user: {
      name: string
    } | null
  } | null
}

interface Material {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
  requestedAt: string
  deliveredAt: string | null
  notes: string | null
  product: {
    name: string
    sku: string
    price: number
    image?: string
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [fetchingMatch, setFetchingMatch] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)

      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        toast.error('Không thể tải dữ liệu dự án')
        router.push('/account/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Đã xảy ra lỗi kết nối')
      router.push('/account/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (project && !project.contractorId) {
      fetchRecommendations()
    }
  }, [project?.id, project?.contractorId])

  const fetchRecommendations = async () => {
    try {
      setFetchingMatch(true)
      const res = await fetch(`/api/contractors/matching?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setFetchingMatch(false)
    }
  }

  const handleChat = async (contractor: any) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: contractor.customerId,
          recipientName: contractor.displayName,
          projectId: project?.id,
          projectTitle: project?.name,
          initialMessage: `Chào ${contractor.displayName}, tôi muốn trao đổi về dự án "${project?.name}" của tôi.`
        })
      })

      if (res.ok) {
        router.push('/messages')
      }
    } catch (error) {
      toast.error('Không thể mở cuộc hội thoại')
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNING': return { label: 'Đang chuẩn bị', color: 'bg-slate-100 text-slate-700 border-slate-200' }
      case 'IN_PROGRESS': return { label: 'Đang thi công', color: 'bg-blue-50 text-blue-700 border-blue-100' }
      case 'ON_HOLD': return { label: 'Tạm dừng', color: 'bg-amber-50 text-amber-700 border-amber-100' }
      case 'COMPLETED': return { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
      default: return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">SmartBuild Pro Dashboard</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  const statusInfo = getStatusLabel(project.status)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Toaster position="top-right" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* PREMIUM BENTO HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-40"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Link href="/account/projects" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-slate-100">
                  <ArrowLeft size={18} />
                </Link>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
                {project.priority === 'HIGH' && (
                  <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                    Ưu tiên cao
                  </div>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                {project.name}
              </h1>
              <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
                {project.description || 'Hệ thống quản lý vật tư và tiến độ công trình thông minh cho SmartBuild.'}
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                  Cập nhật tiến độ
                </button>
                <Link
                  href="/products"
                  className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Đặt mua vật tư
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-primary-600 rounded-[40px] p-10 text-white flex flex-col justify-between shadow-2xl shadow-primary-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Tiến độ tổng thể</p>
              <div className="flex items-end gap-2">
                <span className="text-7xl font-black tracking-tighter leading-none">{project.taskCompletion}</span>
                <span className="text-3xl font-black opacity-50 pb-2">%</span>
              </div>
            </div>
            <div className="relative z-10 pt-8 space-y-4">
              <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${project.taskCompletion}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-80">
                <span>Khởi tạo</span>
                <span>Hoàn tất</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-[24px] border border-slate-200 shadow-sm w-fit max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Tổng quan', icon: Activity },
            { id: 'roadmap', label: 'Lộ trình', icon: Map },
            { id: 'tasks', label: `Công việc (${project.totalTasks})`, icon: Layers },
            { id: 'materials', label: `Vật tư (${project.projectMaterials.length})`, icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Financial Bento Card */}
              <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-8 h-fit">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Tình hình tài chính</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dự toán ngân sách</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chi phí thực tế</p>
                      <p className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(project.actualCost)}</p>
                      <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <TrendingUp size={12} className="text-emerald-500" />
                        Đã giải ngân {Math.round((project.actualCost / project.budget) * 100)}% ngân sách
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl text-center">
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(project.totalMaterialCost)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Vật tư</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl text-center">
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(project.actualCost - project.totalMaterialCost)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Nhân công/Khác</p>
                  </div>
                </div>
              </div>

              {/* Time & Contractor Bento Card */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Mốc thời gian</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bắt đầu thi công</p>
                        <p className="text-lg font-black text-slate-900">{new Date(project.startDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dự kiến bàn giao</p>
                        <p className="text-lg font-black text-slate-900">{project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Đối tác thực hiện</h3>
                  {project.contractor ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center text-2xl font-black text-slate-400 overflow-hidden relative border border-slate-200">
                          {project.contractor.avatar ? (
                            <Image src={project.contractor.avatar} alt="Contractor" fill className="object-cover" />
                          ) : (
                            project.contractor.user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900 leading-tight mb-1">{project.contractor.user.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Đã xác minh</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleChat(project.contractor)}
                          className="w-full flex items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                          <MessageCircle size={16} /> Liên hệ trực tiếp
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <User size={32} />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Chưa chọn đối tác</p>
                      <Link href="/contractors" className="text-primary-600 font-black text-[10px] uppercase tracking-widest hover:text-primary-700">Tìm nhà thầu ngay →</Link>
                    </div>
                  )}
                </div>

                {/* AI Summary Bento Card */}
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity size={180} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Zap size={20} className="text-primary-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">SmartBuild AI phân tích</p>
                        <h3 className="text-xl font-black tracking-tight">Trạng thái công trình</h3>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 leading-relaxed font-medium text-slate-300 text-sm italic">
                      "Dựa trên dữ liệu giải ngân ({Math.round((project.actualCost / project.budget) * 100)}%), công trình đang bám sát tiến độ dự kiến. Các hạng mục phần thô đã hoàn tất 90%. Nên bắt đầu đặt mua vật tư hoàn thiện trong 7 ngày tới để tối ưu chi phí vận chuyển."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="bg-white rounded-[40px] p-2 border border-slate-200 shadow-sm overflow-hidden">
              <ProjectRoadmap
                estimateId={project.id}
                projectType={project.description?.toLowerCase().includes('sơn') ? 'painting' : project.description?.toLowerCase().includes('lát') ? 'flooring' : 'general'}
                area={project.budget / 1000000}
                materials={project.projectMaterials.map(m => ({ name: m.product.name, quantity: m.quantity, unit: 'pcs' }))}
                startDate={project.startDate}
              />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hạng mục công việc</h3>
                  <p className="text-slate-500 font-medium">Chi tiết {project.totalTasks} đầu việc đã lên kế hoạch</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100">
                  <Plus size={16} /> Thêm hạng mục mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Công việc</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tiến độ</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hạn định</th>
                      <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.projectTasks.map((task) => (
                      <tr key={task.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-10 py-8">
                          <p className="font-black text-slate-900 tracking-tight transition-colors group-hover:text-primary-600">{task.name}</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">{task.description}</p>
                        </td>
                        <td className="px-6 py-8">
                          <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                            {task.status === 'COMPLETED' ? 'Xong' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chờ'}
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-700 ${task.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{task.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                            <Clock size={14} className="text-slate-300" />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-'}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <button className="p-2 text-slate-300 hover:text-slate-900 transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              {/* Material Stats Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Package size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900">{project.projectMaterials.length}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại vật tư</p>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Truck size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900">{project.projectMaterials.filter(m => m.status === 'DELIVERED').length}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã giao đến</p>
                  </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(project.totalMaterialCost)}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị vật tư</p>
                  </div>
                </div>
              </div>

              {/* Material Visual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {project.projectMaterials.map((material) => (
                  <div key={material.id} className="bg-white rounded-[32px] p-6 border border-slate-200 group hover:border-primary-600 hover:shadow-xl transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 relative overflow-hidden border border-slate-100">
                            {material.product.image ? (
                              <Image src={material.product.image} alt={material.product.name} fill className="object-cover" />
                            ) : (
                              <Package size={24} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 leading-none mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{material.product.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: {material.product.sku}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${material.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                          {material.status === 'DELIVERED' ? 'Đã giao' : 'Đã đặt'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Số lượng</p>
                          <p className="text-lg font-black text-slate-900">{material.quantity}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thành tiền</p>
                          <p className="text-lg font-black text-primary-600">{formatCurrency(material.totalPrice)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${material.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {material.status === 'DELIVERED' ? `Giao ngày ${new Date(material.deliveredAt!).toLocaleDateString('vi-VN')}` : 'Đang xử lý vận chuyển'}
                        </span>
                      </div>
                      <Link href={`/products/${material.product.sku}`} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-primary-600 transition-all">
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Empty Action Card */}
                <Link href="/products" className="bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center group hover:bg-white hover:border-primary-600 transition-all cursor-pointer min-h-[260px]">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                    <Plus size={32} />
                  </div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight mb-1">Đặt thêm vật tư</h4>
                  <p className="text-xs font-medium text-slate-400 max-w-[180px]">Bổ sung nguyên liệu còn thiếu cho hạng mục hiện tại</p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FIXED FOOTER QUICK ACTIONS (Mobile ready) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-[28px] shadow-2xl border border-white/10 flex items-center gap-8">
        <button className="flex items-center gap-2 text-white hover:text-primary-400 transition-colors">
          <Plus size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Báo cáo mới</span>
        </button>
        <div className="w-px h-6 bg-white/10"></div>
        <button className="flex items-center gap-2 text-white hover:text-primary-400 transition-colors">
          <Info size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Trợ giúp nhanh</span>
        </button>
      </div>
    </div>
  )
}

function MoreVertical(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

function ExternalLink(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}