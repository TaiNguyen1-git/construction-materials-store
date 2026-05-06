'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import { fetchWithAuth } from '@/lib/api-client'
import {
  Banknote, Calendar, User, Plus, RefreshCw, Trash2, Edit,
  CheckCircle, Clock, TrendingUp, TrendingDown, CreditCard,
  Briefcase, X, FileText, ChevronRight, Calculator
} from 'lucide-react'
import SideDrawer from '@/components/SideDrawer'

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
  period: string 
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

export default function PayrollManager() {
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
    overtimeRate: 150000,
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
        setPayrolls(Array.isArray(payrollData) ? payrollData : [])
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        const employeesData = data.data?.data || data.data || []
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
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
        overtimeRate: 150000,
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
        toast.success(editingPayroll ? 'Cập nhật thành công' : 'Tạo bảng lương thành công')
        setShowModal(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Lỗi lưu dữ liệu')
      }
    } catch {
      toast.error('Không thể kết nối server')
    }
  }

  const handleDelete = async () => {
    if (!deletingPayroll) return
    try {
      const response = await fetchWithAuth(`/api/payroll/${deletingPayroll.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Xóa bảng lương thành công')
        setDeletingPayroll(null)
        fetchData()
      }
    } catch {
      toast.error('Lỗi xóa dữ liệu')
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
        toast.success('Đã cập nhật trạng thái chi trả')
        fetchData()
      }
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const resetForm = () => {
    setForm({
      employeeId: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      baseSalary: 0,
      overtimeHours: 0,
      overtimeRate: 150000,
      bonuses: 0,
      deductions: 0,
      note: ''
    })
  }

  const calculateNet = () => {
    const overtime = form.overtimeHours * form.overtimeRate
    return form.baseSalary + overtime + form.bonuses - form.deductions
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Bảng Lương & Phúc Lợi</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Quản lý chi phí nhân sự và thu nhập hàng kỳ</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus size={14} /> Khởi tạo bảng lương
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Quỹ Lương', value: formatCurrency(payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0)), icon: Banknote, color: 'text-blue-600 bg-blue-50' },
          { label: 'Đã Chi Trả', value: payrolls.filter(p => p.isPaid).length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Chờ Thanh Toán', value: payrolls.filter(p => !p.isPaid).length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Số Nhân Sự', value: employees.length, icon: User, color: 'text-purple-600 bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-lg font-black text-slate-900">{stat.value}</div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={16} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Chu kỳ</th>
                <th className="px-4 py-4 text-right">Lương cơ bản</th>
                <th className="px-4 py-4 text-right">OT / Thưởng</th>
                <th className="px-4 py-4 text-right">Thực nhận</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</td></tr>
              ) : payrolls.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[11px] font-bold text-slate-400 italic">Chưa có bản ghi lương nào</td></tr>
              ) : payrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><User size={14} /></div>
                    <div>
                      <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{payroll.employee?.user?.name || '---'}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Mã NV: {payroll.employee?.employeeCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-600 uppercase tracking-widest">{payroll.period}</td>
                  <td className="px-4 py-4 text-right text-xs font-bold text-slate-500">{formatCurrency(payroll.baseSalary)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="text-xs font-black text-blue-600">+{formatCurrency((payroll.overtime || 0) + (payroll.bonuses || 0))}</div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-black text-slate-900">{formatCurrency(payroll.netPay)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${payroll.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {payroll.isPaid ? 'Đã thanh toán' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!payroll.isPaid && <button onClick={() => updateStatus(payroll.id, 'PAID')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={14} /></button>}
                      <button onClick={() => openModal(payroll)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit size={14} /></button>
                      <button onClick={() => setDeletingPayroll(payroll)} className="p-1.5 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SideDrawer
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingPayroll ? 'Cập Nhật Thu Nhập' : 'Khởi Tạo Bảng Lương'}
        subtitle="Thiết lập các khoản thu nhập và khấu trừ hàng kỳ"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
              Hủy
            </button>
            <button onClick={handleSubmit as any} className="flex-2 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              {editingPayroll ? 'Cập nhật thay đổi' : 'Xác nhận chi trả'}
            </button>
          </div>
        }
      >
        <div className="space-y-10">
           {/* Section: Period & Employee */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Đối tượng & Thời kỳ</h4>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nhân viên thụ hưởng</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all appearance-none" required>
                  <option value="">-- Chọn nhân sự --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name.toUpperCase()} ({emp.employeeCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Năm tài chính</label>
                  <input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tháng làm việc</label>
                  <select value={form.month} onChange={e => setForm({ ...form, month: parseInt(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all appearance-none">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>)}
                  </select>
                </div>
              </div>
           </div>

           {/* Section: Income details */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Các khoản thu nhập</h4>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Lương cơ bản (VND)</label>
                  <input type="number" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: parseFloat(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Thưởng hiệu suất</label>
                  <input type="number" value={form.bonuses} onChange={e => setForm({ ...form, bonuses: parseFloat(e.target.value) })} className="w-full px-5 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-sm font-bold outline-none transition-all" />
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Tăng ca (OT)</p>
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Số giờ</span>
                        <input type="number" value={form.overtimeHours} onChange={e => setForm({ ...form, overtimeHours: parseFloat(e.target.value) })} className="w-16 bg-white border border-blue-100 rounded-lg px-2 py-1 text-sm font-black text-blue-700 outline-none" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Đơn giá/giờ</span>
                        <input type="number" value={form.overtimeRate} onChange={e => setForm({ ...form, overtimeRate: parseFloat(e.target.value) })} className="w-24 bg-white border border-blue-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none" />
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-blue-400 uppercase mb-1">Thành tiền OT</p>
                   <p className="text-sm font-black text-blue-600">{formatCurrency(form.overtimeHours * form.overtimeRate)}</p>
                </div>
              </div>
           </div>

           {/* Section: Deductions */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <div className="w-1 h-4 bg-rose-600 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Các khoản khấu trừ</h4>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tổng khấu trừ / Phạt (VND)</label>
                <input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: parseFloat(e.target.value) })} className="w-full px-5 py-3.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl text-sm font-bold outline-none transition-all" />
              </div>
           </div>

           {/* Financial Summary Card */}
           <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl shadow-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <Calculator size={120} />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-end gap-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Tổng thu nhập thực nhận (NET)</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter">{formatCurrency(calculateNet())}</h3>
                    <div className="flex items-center gap-2 pt-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Sẵn sàng thanh toán cho nhân sự</span>
                    </div>
                 </div>
                 <div className="w-full sm:w-auto">
                    <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                       <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Chu kỳ lương</p>
                       <p className="text-xs font-black text-white uppercase">{form.month < 10 ? `0${form.month}` : form.month} / {form.year}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </SideDrawer>

      <ConfirmDialog isOpen={!!deletingPayroll} onClose={() => setDeletingPayroll(null)} onConfirm={handleDelete} title="XÓA BẢNG LƯƠNG" message="Bạn có chắc muốn xóa bản ghi lương này không?" />
    </div>
  )
}
