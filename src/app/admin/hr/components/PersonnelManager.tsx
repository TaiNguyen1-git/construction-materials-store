'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Users, Calendar, ClipboardList, ShieldAlert, Banknote, Eye, EyeOff } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'
import ConfirmDialog from '@/components/ConfirmDialog'
import SideDrawer from '@/components/SideDrawer'

import {
  Employee, WorkShift, Task
} from './personnel/types'

import EmployeeSection from './personnel/EmployeeSection'
import ShiftSection from './personnel/ShiftSection'
import TaskSection from './personnel/TaskSection'
import WorkerFraudSection from './personnel/WorkerFraudSection'

interface WorkerFraudReport {
    id: string
    workerName: string
    workerEmail: string
    projectName: string
    activityType: string
    photoUrl: string
    riskScore: number
    status: string
    createdAt: string
    rejectionReason?: string
}

export default function PersonnelManager() {
  const [expandedSections, setExpandedSections] = useState({
    employees: true,
    workerFraud: false,
    shifts: false,
    tasks: false
  })

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)

  // Worker Fraud state
  const [workerFraud, setWorkerFraud] = useState<WorkerFraudReport[]>([])
  const [workerFraudLoading, setWorkerFraudLoading] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeCode: '',
    department: '',
    position: '',
    baseSalary: 0,
    hireDate: new Date().toISOString().split('T')[0]
  })

  // Work Shifts state
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null)
  const [deletingShift, setDeletingShift] = useState<WorkShift | null>(null)
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    shiftType: 'REGULAR',
    notes: ''
  })

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    taskType: 'GENERAL',
    priority: 'MEDIUM',
    dueDate: '',
    status: 'PENDING'
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (expandedSections.shifts) fetchShifts()
  }, [expandedSections.shifts])

  useEffect(() => {
    if (expandedSections.tasks) fetchTasks()
  }, [expandedSections.tasks])

  useEffect(() => {
    if (expandedSections.workerFraud) fetchWorkerFraud()
  }, [expandedSections.workerFraud])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // ============ WORKER FRAUD FUNCTIONS ============
  const fetchWorkerFraud = async () => {
    try {
      setWorkerFraudLoading(true)
      const res = await fetchWithAuth('/api/admin/integrity/worker-fraud')
      if (res.ok) {
        const data = await res.json()
        setWorkerFraud(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching worker fraud:', error)
    } finally {
      setWorkerFraudLoading(false)
    }
  }

  const handleApproveFraud = async (id: string) => {
    if (!window.confirm('Xác nhận báo cáo này là gian lận chính xác? AI sẽ ghi nhận hành vi này của thợ.')) return
    try {
      const res = await fetchWithAuth('/api/admin/integrity/worker-fraud', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: id, status: 'APPROVED' })
      })
      if (res.ok) {
        toast.success('Đã xác nhận báo cáo gian lận')
        fetchWorkerFraud()
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleRejectFraud = async (id: string) => {
    const reason = window.prompt('Lý do bỏ qua báo cáo này (Ví dụ: Báo nhầm, Thiết bị lỗi...):')
    if (reason === null) return
    
    try {
      const res = await fetchWithAuth('/api/admin/integrity/worker-fraud', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: id, status: 'REJECTED', rejectionReason: reason || 'Bỏ qua bởi Admin' })
      })
      if (res.ok) {
        toast.success('Đã bỏ qua báo cáo')
        fetchWorkerFraud()
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  // ============ EMPLOYEES FUNCTIONS ============
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true)
      const response = await fetchWithAuth('/api/employees')
      if (response.ok) {
        const data = await response.json()
        const employeesData = data.data?.data || data.data || []
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setEmployeesLoading(false)
    }
  }

  const openEmployeeModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setEmployeeForm({
        name: employee.user.name,
        email: employee.user.email,
        password: '',
        phone: employee.phone || '',
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        baseSalary: employee.baseSalary,
        hireDate: employee.hireDate?.split('T')[0] || ''
      })
    } else {
      setEditingEmployee(null)
      // Auto-generate employee code
      let nextCode = 'NV001'
      if (employees.length > 0) {
        const maxId = employees.reduce((max, emp) => {
          const match = emp.employeeCode.match(/NV(\d+)/)
          if (match) {
            const num = parseInt(match[1])
            return num > max ? num : max
          }
          return max
        }, 0)
        nextCode = `NV${String(maxId + 1).padStart(3, '0')}`
      }
      setEmployeeForm({
        name: '', email: '', password: '', phone: '',
        employeeCode: nextCode, department: '', position: '',
        baseSalary: 0, hireDate: new Date().toISOString().split('T')[0]
      })
    }
    setShowPassword(false)
    setShowEmployeeModal(true)
  }

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        const response = await fetchWithAuth(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department: employeeForm.department,
            position: employeeForm.position,
            baseSalary: employeeForm.baseSalary
          })
        })
        if (response.ok) {
          toast.success('Cập nhật nhân viên thành công')
          setShowEmployeeModal(false)
          fetchEmployees()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể cập nhật nhân viên')
        }
      } else {
        const response = await fetchWithAuth('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeForm)
        })
        if (response.ok) {
          toast.success('Thêm nhân viên thành công')
          setShowEmployeeModal(false)
          fetchEmployees()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể thêm nhân viên')
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const handlePermanentDelete = async (employee: Employee) => {
    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa VĨNH VIỄN nhân viên ${employee.user.name}? Dữ liệu sẽ không thể khôi phục.`)) {
      try {
        const response = await fetchWithAuth(`/api/employees/${employee.id}?permanent=true`, { method: 'DELETE' })
        if (response.ok) {
          toast.success('Xóa vĩnh viễn nhân viên thành công')
          fetchEmployees()
        } else {
          toast.error('Không thể xóa nhân viên')
        }
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa')
      }
    }
  }

  const handleDeleteEmployee = async (permanent: boolean = false) => {
    if (!deletingEmployee) return
    if (permanent && !window.confirm('CẢNH BÁO: Hành động này sẽ xóa hoàn toàn dữ liệu nhân viên và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?')) {
      return
    }
    try {
      const url = permanent
        ? `/api/employees/${deletingEmployee.id}?permanent=true`
        : `/api/employees/${deletingEmployee.id}`
      const response = await fetchWithAuth(url, { method: 'DELETE' })
      if (response.ok) {
        toast.success(permanent ? 'Xóa vĩnh viễn nhân viên thành công' : 'Vô hiệu hóa nhân viên thành công')
        setDeletingEmployee(null)
        fetchEmployees()
      } else {
        toast.error('Không thể xóa nhân viên')
      }
    } catch (error) {
      toast.error('Không thể xóa nhân viên')
    }
  }

  // ============ SHIFTS FUNCTIONS ============
  const fetchShifts = async () => {
    try {
      setShiftsLoading(true)
      const response = await fetchWithAuth('/api/work-shifts')
      if (response.ok) {
        const data = await response.json()
        const shiftsData = data.data?.data || data.data || []
        setShifts(Array.isArray(shiftsData) ? shiftsData : [])
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
      toast.error('Không thể tải ca làm việc')
    } finally {
      setShiftsLoading(false)
    }
  }

  const openShiftModal = (shift?: WorkShift) => {
    if (shift) {
      setEditingShift(shift)
      setShiftForm({
        employeeId: shift.employeeId,
        date: typeof shift.date === 'string' ? shift.date.split('T')[0] : new Date(shift.date).toISOString().split('T')[0],
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType || 'REGULAR',
        notes: shift.notes || ''
      })
    } else {
      setEditingShift(null)
      setShiftForm({
        employeeId: employees[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        shiftType: 'REGULAR',
        notes: ''
      })
    }
    setShowShiftModal(true)
  }

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth(editingShift ? `/api/work-shifts/${editingShift.id}` : '/api/work-shifts', {
        method: editingShift ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftForm)
      })
      if (res.ok) {
        toast.success(`${editingShift ? 'Cập nhật' : 'Thêm'} ca làm việc thành công`)
        setShowShiftModal(false)
        fetchShifts()
      } else {
        const error = await res.json()
        toast.error(error.error?.message || 'Không thể lưu ca làm việc')
      }
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDeleteShift = async () => {
    if (!deletingShift) return
    try {
      const response = await fetchWithAuth(`/api/work-shifts/${deletingShift.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Xóa ca làm việc thành công')
        setDeletingShift(null)
        fetchShifts()
      } else {
        toast.error('Không thể xóa ca làm việc')
      }
    } catch {
      toast.error('Lỗi khi xóa ca làm việc')
    }
  }

  // ============ TASKS FUNCTIONS ============
  const fetchTasks = async () => {
    try {
      setTasksLoading(true)
      const response = await fetchWithAuth('/api/employee-tasks')
      if (response.ok) {
        const data = await response.json()
        const tasksData = data.data?.data || data.data || []
        setTasks(Array.isArray(tasksData) ? tasksData : [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Không thể tải công việc')
    } finally {
      setTasksLoading(false)
    }
  }

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setTaskForm({
        employeeId: task.employeeId || '',
        title: task.title,
        description: task.description || '',
        taskType: task.taskType || 'GENERAL',
        priority: task.priority,
        dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : new Date(task.dueDate).toISOString().split('T')[0]) : '',
        status: task.status
      })
    } else {
      setEditingTask(null)
      setTaskForm({
        employeeId: employees[0]?.id || '',
        title: '', description: '', taskType: 'GENERAL',
        priority: 'MEDIUM', dueDate: '', status: 'PENDING'
      })
    }
    setShowTaskModal(true)
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...taskForm, dueDate: taskForm.dueDate || undefined }
      const res = await fetchWithAuth(editingTask ? `/api/employee-tasks/${editingTask.id}` : '/api/employee-tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success(`${editingTask ? 'Cập nhật' : 'Thêm'} công việc thành công`)
        setShowTaskModal(false)
        fetchTasks()
      } else {
        const error = await res.json()
        toast.error(error.error?.message || 'Không thể lưu công việc')
      }
    } catch {
      toast.error('Lỗi khi lưu công việc')
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return
    try {
      const response = await fetchWithAuth(`/api/employee-tasks/${deletingTask.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Xóa công việc thành công')
        setDeletingTask(null)
        fetchTasks()
      } else {
        toast.error('Không thể xóa công việc')
      }
    } catch {
      toast.error('Lỗi khi xóa công việc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Nhân Viên</div>
            <div className="text-3xl font-black text-slate-900">{employees.length}</div>
            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tight mt-1">{employees.filter(e => e.isActive !== false).length} đang hoạt động</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-inner">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ca Làm Việc Hôm Nay</div>
            <div className="text-3xl font-black text-slate-900">
              {shifts.filter(s => {
                try { return new Date(s.date).toDateString() === new Date().toDateString() } catch { return false }
              }).length}
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
            <Calendar size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Công Việc Đang Chạy</div>
            <div className="text-3xl font-black text-slate-900">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-inner">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* Sections */}
      <EmployeeSection
        employees={employees} loading={employeesLoading}
        expanded={expandedSections.employees} onToggle={() => toggleSection('employees')}
        onAdd={() => openEmployeeModal()} onEdit={openEmployeeModal}
        onDelete={setDeletingEmployee} onPermanentDelete={handlePermanentDelete}
      />

      <WorkerFraudSection
        reports={workerFraud} loading={workerFraudLoading}
        expanded={expandedSections.workerFraud} onToggle={() => toggleSection('workerFraud')}
        onApprove={handleApproveFraud} onReject={handleRejectFraud}
      />

      <ShiftSection
        shifts={shifts} loading={shiftsLoading}
        expanded={expandedSections.shifts} onToggle={() => toggleSection('shifts')}
        onAdd={() => openShiftModal()} onEdit={openShiftModal} onDelete={setDeletingShift}
      />

      <TaskSection
        tasks={tasks} loading={tasksLoading}
        expanded={expandedSections.tasks} onToggle={() => toggleSection('tasks')}
        onAdd={() => openTaskModal()} onEdit={openTaskModal} onDelete={setDeletingTask}
      />

      {/* MODALS */}
      <SideDrawer
        isOpen={showEmployeeModal} 
        onClose={() => setShowEmployeeModal(false)}
        title={editingEmployee ? 'Cập Nhật Hồ Sơ' : 'Thêm Nhân Viên Mới'}
        subtitle="Quản lý thông tin định danh và vị trí công tác"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowEmployeeModal(false)}
              className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
            >
              Hủy
            </button>
            <button
              onClick={handleEmployeeSubmit}
              className="flex-2 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {editingEmployee ? 'Cập nhật hồ sơ' : 'Thêm nhân viên'}
            </button>
          </div>
        }
      >
        <div className="space-y-10">
          {/* Section: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Thông tin định danh</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Họ Và Tên</label>
                <input type="text" required value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mã Nhân Viên</label>
                <input type="text" required value={employeeForm.employeeCode} readOnly className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-black text-slate-400 outline-none cursor-not-allowed" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Hệ Thống</label>
                <input type="email" required value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} disabled={!!editingEmployee} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all disabled:opacity-50" placeholder="email@smartbuild.vn" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Số Điện Thoại</label>
                <input type="text" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" placeholder="090x xxx xxx" />
              </div>
            </div>

            {!editingEmployee && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <div className="p-2 bg-white rounded-xl text-amber-500 shadow-sm shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div className="flex-1 relative">
                  <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Mật Khẩu Tạm</label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={employeeForm.password} 
                    onChange={e => setEmployeeForm({ ...employeeForm, password: e.target.value })} 
                    className="bg-transparent border-none p-0 text-sm font-black text-amber-900 outline-none w-full placeholder:text-amber-300 pr-10" 
                    placeholder="Nhập mật khẩu khởi tạo..." 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 bottom-0 p-1 text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Position & Organization */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Tổ chức & Công tác</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phòng Ban</label>
                <input type="text" required value={employeeForm.department} onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" placeholder="VD: Kế toán, Kho..." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Chức Vụ</label>
                <input type="text" required value={employeeForm.position} onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" placeholder="VD: Trưởng phòng..." />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ngày Vào Làm</label>
              <input type="date" required value={employeeForm.hireDate} onChange={e => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" />
            </div>
          </div>

          {/* Section: Financial */}
          <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                <Banknote size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Thiết lập tài chính</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Lương và các khoản trợ cấp</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Lương Cơ Bản (VNĐ)</label>
                <FormattedNumberInput 
                  value={employeeForm.baseSalary} 
                  onChange={val => setEmployeeForm({ ...employeeForm, baseSalary: val })} 
                  suffix="đ" 
                  className="bg-white border-slate-100 text-slate-900 placeholder:text-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white rounded-2xl border border-indigo-100/50">
                    <p className="text-[7px] font-black text-slate-400 uppercase mb-1">BHXH & Thuế</p>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">Theo quy định</p>
                 </div>
                 <div className="p-4 bg-white rounded-2xl border border-indigo-100/50">
                    <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Loại hợp đồng</p>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">Chính thức</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* SHIFT MODAL */}
      <SideDrawer
        isOpen={showShiftModal} 
        onClose={() => setShowShiftModal(false)}
        title={editingShift ? 'Cập Nhật Ca Làm' : 'Phân Ca Làm Việc'}
        subtitle="Thiết lập thời gian và quy tắc chấm công"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowShiftModal(false)} className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
              Hủy
            </button>
            <button onClick={handleShiftSubmit} className="flex-2 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              {editingShift ? 'Cập nhật cấu hình' : 'Kích hoạt ca làm'}
            </button>
          </div>
        }
      >
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Thông tin ca trực</h4>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nhân Viên</label>
                <select required value={shiftForm.employeeId} onChange={e => setShiftForm({ ...shiftForm, employeeId: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all appearance-none">
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name.toUpperCase()} ({emp.employeeCode})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ngày Làm Việc</label>
                <input type="date" required value={shiftForm.date} onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Bắt đầu</h4>
                </div>
                <input type="time" required value={shiftForm.startTime} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <div className="w-1 h-4 bg-rose-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Kết thúc</h4>
                </div>
                <input type="time" required value={shiftForm.endTime} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-rose-200 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all" />
              </div>
           </div>

           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ghi chú công việc</label>
              <textarea rows={3} value={shiftForm.notes} onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all resize-none" placeholder="Mô tả nội dung ca trực..." />
           </div>
        </div>
      </SideDrawer>

      {/* TASK MODAL */}
      <SideDrawer
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Cập Nhật Nhiệm Vụ' : 'Giao Việc Mới'}
        subtitle="Phân bổ công việc và theo dõi tiến độ"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
              Hủy
            </button>
            <button onClick={handleTaskSubmit} className="flex-2 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-orange-600 to-rose-600 shadow-xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              {editingTask ? 'Cập nhật tiến độ' : 'Phát hành nhiệm vụ'}
            </button>
          </div>
        }
      >
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <div className="w-1 h-4 bg-orange-600 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nội dung nhiệm vụ</h4>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tiêu Đề Nhiệm Vụ</label>
                <input type="text" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all" placeholder="VD: Kiểm đếm hàng hóa, Xử lý khiếu nại..." />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Người Phụ Trách</label>
                <select required value={taskForm.employeeId} onChange={e => setTaskForm({ ...taskForm, employeeId: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all appearance-none">
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name.toUpperCase()} ({emp.employeeCode})</option>)}
                </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Độ Ưu Tiên</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl text-xs font-black uppercase tracking-widest outline-none transition-all appearance-none">
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung Bình</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn Cấp</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Hạn Hoàn Thành</label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all" />
              </div>
           </div>

           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mô Tả Chi Tiết</label>
              <textarea rows={4} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all resize-none" placeholder="Yêu cầu cụ thể của công việc..." />
           </div>
        </div>
      </SideDrawer>

      <ConfirmDialog
        isOpen={!!deletingEmployee} onClose={() => setDeletingEmployee(null)}
        title="Vô hiệu hóa nhân viên" message={`Bạn có chắc muốn vô hiệu hóa ${deletingEmployee?.user.name}? Nhân viên sẽ không thể đăng nhập vào hệ thống.`}
        onConfirm={() => handleDeleteEmployee(false)}
      />

      <ConfirmDialog
        isOpen={!!deletingShift} onClose={() => setDeletingShift(null)}
        title="Xóa ca làm việc" message="Bạn có chắc chắn muốn xóa ca làm việc này?"
        onConfirm={handleDeleteShift}
      />

      <ConfirmDialog
        isOpen={!!deletingTask} onClose={() => setDeletingTask(null)}
        title="Xóa công việc" message="Bạn có chắc chắn muốn xóa công việc này?"
        onConfirm={handleDeleteTask}
      />
    </div>
  )
}
