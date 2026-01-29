'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, Folder, Calendar, DollarSign, TrendingUp, Search, MapPin, Building2, ChevronRight, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: string
  endDate: string | null
  budget: number
  actualCost: number
  progress: number
  createdAt: string
  contractor: {
    user: {
      name: string
    }
  } | null
}

export default function AccountProjectsPage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    if (isAuthenticated) {
      fetchProjects()
    }
  }, [isLoading, isAuthenticated, router])

  const fetchProjects = async () => {
    try {
      setFetching(true)
      const res = await fetchWithAuth('/api/projects')
      if (res.ok) {
        const result = await res.json()
        setProjects(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setFetching(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading || fetching && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    budget: projects.reduce((acc, p) => acc + p.budget, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/account" className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-4 transition-colors font-semibold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại tài khoản
            </Link>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Folder className="h-8 w-8 text-primary-600" />
              Dự Án Của Tôi
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Quản lý và theo dõi các công trình xây dựng của bạn</p>
          </div>
          <Link
            href="/estimator"
            className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-lg hover:shadow-primary-200 flex items-center justify-center group"
          >
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Tạo Dự Án Mới
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Tổng Dự Án', value: stats.total, icon: Folder, color: 'blue' },
            { label: 'Đang Thực Hiện', value: stats.active, icon: TrendingUp, color: 'orange' },
            { label: 'Đã Hoàn Thành', value: stats.completed, icon: Calendar, color: 'green' },
            { label: 'Ngân Sách', value: formatCurrency(stats.budget), icon: DollarSign, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bạn chưa có dự án nào</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
              Sử dụng công cụ AI Dự Toán để tính toán vật liệu và khởi tạo dự án đầu tiên của bạn!
            </p>
            <Link
              href="/estimator"
              className="inline-flex items-center bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Khởi Tạo Ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      <Link href={`/account/projects/${project.id}`} className="after:absolute after:inset-0 text-inherit">
                        {project.name}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 font-medium">Cập nhật: {new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <Badge className={
                    project.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
                      project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }>
                    {project.status === 'IN_PROGRESS' ? 'Đang thi công' :
                      project.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang chuẩn bị'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl relative z-10">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Nhà thầu phụ trách</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-bold text-gray-700">
                        {project.contractor?.user.name || (
                          <Link href="/contractors" className="text-primary-600 hover:underline flex items-center gap-1 relative z-20">
                            Tìm nhà thầu ngay <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1 font-bold">
                      <span className="text-gray-500">Tiến độ thi công</span>
                      <span className="text-primary-600">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Ngân sách</p>
                      <p className="text-sm font-black text-gray-900">{formatCurrency(project.budget)}</p>
                    </div>
                    <div className="bg-primary-50 p-2 rounded-lg group-hover:bg-primary-600 transition-colors">
                      <ChevronRight className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
