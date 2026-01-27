'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import { fetchWithAuth } from '@/lib/api-client'
import {
  Banknote,
  Calendar,
  User,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  Briefcase,
  X,
  FileText,
  DollarSign,
  ChevronRight,
  Calculator
} from 'lucide-react'

interface Employee {
  id: string
  employeeCode: string
  user: { name: string; email: string }
  department: string
  position: string
  baseSalary: number
}

interface Payroll {
  id: string
  employee?: Employee
  employeeId: string
  period: string // Format: YYYY-MM
  baseSalary: number
  bonuses: number
  penalties: number
  overtime: number
  grossPay: number
  netPay: number
  isPaid: boolean
  hoursWorked: number
  overtimeHours: number
  createdAt: string
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [deletingPayroll, setDeletingPayroll] = useState<Payroll | null>(null)

  const [form, setForm] = useState({
    employeeId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    baseSalary: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    bonuses: 0,
    deductions: 0,
    note: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [payrollRes, employeesRes] = await Promise.all([
        fetchWithAuth('/api/payroll'),
        fetchWithAuth('/api/employees')
      ])

      if (payrollRes.ok) {
        const data = await payrollRes.json()
        const payrollData = data.data?.data || data.data || []
        const payrollArray = Array.isArray(payrollData) ? payrollData : []
        setPayrolls(payrollArray)
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        const employeesData = data.data?.data || data.data || []
        const employeesArray = Array.isArray(employeesData) ? employeesData : []
        setEmployees(employeesArray)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (payroll?: Payroll) => {
    if (payroll) {
      setEditingPayroll(payroll)
      const periodParts = payroll.period.split('-')
      setForm({
        employeeId: payroll.employeeId,
        year: parseInt(periodParts[0]),
        month: parseInt(periodParts[1]),
        baseSalary: payroll.baseSalary,
        overtimeHours: payroll.overtimeHours,
        overtimeRate: 0,
        bonuses: payroll.bonuses,
        deductions: 0,
        note: ''
      })
    } else {
      setEditingPayroll(null)
      resetForm()
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPayroll ? `/api/payroll/${editingPayroll.id}` : '/api/payroll'
      const method = editingPayroll ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        toast.success(editingPayroll ? 'Cập nhật payroll thành công' : 'Tạo payroll thành công')
        setShowModal(false)
        setEditingPayroll(null)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể lưu payroll')
      }
    } catch (error) {
      console.error('Error saving payroll:', error)
      toast.error('Không thể lưu payroll')
    }
  }

  const handleDelete = async () => {
    if (!deletingPayroll) return

    try {
      const response = await fetchWithAuth(`/api/payroll/${deletingPayroll.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa payroll thành công')
        setDeletingPayroll(null)
        fetchData()
      } else {
        const error = await response.json()
        const errorMessage = error.error || error.details || 'Không thể xóa payroll'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting payroll:', error)
      toast.error('Không thể xóa payroll')
    }
  }

  const updateStatus = async (payrollId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/payroll/${payrollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success('Cập nhật trạng thái bảng lương thành công')
        fetchData()
      } else {
        const error = await response.json()
        const errorMessage = error.error || error.details || 'Không thể cập nhật bảng lương'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error updating payroll:', error)
      toast.error('Không thể cập nhật bảng lương')
    }
  }

  const resetForm = () => {
    setForm({
      employeeId: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      baseSalary: 0,
      overtimeHours: 0,
      overtimeRate: 150000, // Default OT rate
      bonuses: 0,
      deductions: 0,
      note: ''
    })
  }

  const calculateGross = () => {
    const overtime = form.overtimeHours * form.overtimeRate
    return form.baseSalary + overtime + form.bonuses
  }

  const calculateNet = () => {
    return calculateGross() - form.deductions
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Summary Metrics
  const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)
  const paidCount = payrolls.filter(p => p.isPaid).length
  const pendingCount = payrolls.filter(p => !p.isPaid).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="bg-blue-600 text-white p-2 rounded-2xl"><Banknote size={24} /></span>
            Quản Lý Lương & Phúc Lợi
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Kho Dữ Liệu Lương Thưởng Nhân Viên</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="bg-white text-slate-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} />
            Khởi tạo bảng lương
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng quỹ lương', value: formatCurrency(totalPayroll), icon: CreditCard, color: 'bg-emerald-50 text-emerald-600', sub: 'Tổng Chi Phí Tháng' },
          { label: 'Đã thanh toán', value: paidCount, icon: CheckCircle, color: 'bg-blue-50 text-blue-600', sub: 'Lương Đã Trả' },
          { label: 'Chờ thanh toán', value: pendingCount, icon: Clock, color: 'bg-amber-50 text-amber-600', sub: 'Giải Ngân Chờ Duyệt' },
          { label: 'Sản lượng nhân sự', value: employees.length, icon: Briefcase, color: 'bg-purple-50 text-purple-600', sub: 'Nhân Sự Hoạt Động' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <div className={`font-black text-slate-900 ${typeof stat.value === 'string' ? 'text-xl' : 'text-2xl'}`}>{stat.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Layer */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5 text-left">Hồ sơ nhân viên</th>
                <th className="px-6 py-5 text-left">Chu kỳ lương</th>
                <th className="px-4 py-5 text-right">Mức lương cơ bản</th>
                <th className="px-4 py-5 text-right">OT / Thưởng</th>
                <th className="px-4 py-5 text-right">Thực lãnh (Net)</th>
                <th className="px-4 py-5 text-center">Tình trạng</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Payroll Data...</span>
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <FileText size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chưa có dữ liệu bảng lương trong kỳ này</p>
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{payroll.employee?.user?.name || 'Unknown Staff'}</div>
                          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {payroll.employee?.employeeCode || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={12} className="text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-widest">{payroll.period}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-600">{formatCurrency(payroll.baseSalary || 0)}</span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="text-xs font-black text-blue-600">+{formatCurrency((payroll.overtime || 0) + (payroll.bonuses || 0))}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Adjustments</div>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(payroll.netPay || 0)}</span>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {payroll.isPaid ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                          <CheckCircle size={10} />
                          Đã Thanh Toán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                          <Clock size={10} />
                          Queue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!payroll.isPaid && (
                          <button
                            onClick={() => updateStatus(payroll.id, 'PAID')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="Mark as Paid"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => openModal(payroll)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeletingPayroll(payroll)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Concept */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-3xl shadow-2xl rounded-[40px] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  {editingPayroll ? 'Cấu hình bản ghi lương' : 'Khởi tạo chi trả mới'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Compensation data configuration</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all hover:scale-110 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Selection */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nhân sự thụ hưởng</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none appearance-none"
                      required
                    >
                      <option value="">-- Click to select staff member --</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.user.name.toUpperCase()} ({employee.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Period Configuration */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Năm ngân sách</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kỳ chi trả (Tháng)</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
                    ))}
                  </select>
                </div>

                {/* Financial Data */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mức lương cơ sở</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">VND</span>
                    <input
                      type="number"
                      value={form.baseSalary}
                      onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thưởng hiệu suất</label>
                  <input
                    type="number"
                    value={form.bonuses}
                    onChange={(e) => setForm({ ...form, bonuses: parseFloat(e.target.value) })}
                    className="w-full px-5 py-4 bg-emerald-50/50 border-none rounded-2xl text-sm font-black text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giờ tăng ca</label>
                  <input
                    type="number"
                    value={form.overtimeHours}
                    onChange={(e) => setForm({ ...form, overtimeHours: parseFloat(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Khấu trừ / Phạt</label>
                  <input
                    type="number"
                    value={form.deductions}
                    onChange={(e) => setForm({ ...form, deductions: parseFloat(e.target.value) })}
                    className="w-full px-5 py-4 bg-red-50/50 border-none rounded-2xl text-sm font-black text-red-600 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Advanced Calculation Preview */}
              <div className="bg-slate-900 p-8 rounded-[32px] overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-20 text-white group-hover:scale-110 transition-transform">
                  <Calculator size={64} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Calculated Net Income</span>
                    <div className="text-3xl font-black text-white tracking-tighter">{formatCurrency(calculateNet())}</div>
                  </div>
                  <div className="h-12 w-px bg-slate-800 hidden md:block"></div>
                  <div className="space-y-1 text-center md:text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Adjustment</span>
                    <div className="text-xl font-black text-emerald-400">+{formatCurrency(calculateGross() - form.baseSalary)}</div>
                  </div>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Authorize & Finalize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPayroll}
        onClose={() => setDeletingPayroll(null)}
        onConfirm={handleDelete}
        title="Xác nhận gỡ bỏ bản ghi"
        message={`Hệ thống sẽ xóa vĩnh viễn dữ liệu lương của nhân sự tại kỳ ${deletingPayroll?.period}. Thao tác này đòi hỏi quyền quản trị tối cao.`}
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  )
}