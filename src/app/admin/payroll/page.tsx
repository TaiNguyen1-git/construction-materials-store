'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'

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
        fetch('/api/payroll'),
        fetch('/api/employees')
      ])

      if (payrollRes.ok) {
        const data = await payrollRes.json()
        const payrollData = data.data?.data || data.data || []
        const payrollArray = Array.isArray(payrollData) ? payrollData : []
        console.log('Fetched payrolls:', payrollArray.length)
        setPayrolls(payrollArray)
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        const employeesData = data.data?.data || data.data || []
        const employeesArray = Array.isArray(employeesData) ? employeesData : []
        console.log('Fetched employees for payroll:', employeesArray.length)
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

      const response = await fetch(url, {
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
      const response = await fetch(`/api/payroll/${deletingPayroll.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa payroll thành công')
        setDeletingPayroll(null)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể xóa payroll')
      }
    } catch (error) {
      console.error('Error deleting payroll:', error)
      toast.error('Không thể xóa payroll')
    }
  }

  const updateStatus = async (payrollId: string, status: string) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success(`Payroll ${status.toLowerCase()}`)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update payroll')
      }
    } catch (error) {
      console.error('Error updating payroll:', error)
      toast.error('Failed to update payroll')
    }
  }

  const resetForm = () => {
    setForm({
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
  }

  const calculateGross = () => {
    const overtime = form.overtimeHours * form.overtimeRate
    return form.baseSalary + overtime + form.bonuses
  }

  const calculateNet = () => {
    return calculateGross() - form.deductions
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Tạo Payroll
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll) => (
                <tr key={payroll.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payroll.employee?.user?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payroll.employee?.employeeCode || payroll.employeeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payroll.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(payroll.baseSalary || 0).toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(payroll.netPay || 0).toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payroll.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payroll.isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(payroll)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      {!payroll.isPaid && (
                        <button
                          onClick={() => updateStatus(payroll.id, 'PAID')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Đánh dấu đã trả
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingPayroll(payroll)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Payroll Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.user.name} - {employee.employeeCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                  <input
                    type="number"
                    value={form.baseSalary}
                    onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overtime Hours</label>
                  <input
                    type="number"
                    value={form.overtimeHours}
                    onChange={(e) => setForm({ ...form, overtimeHours: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overtime Rate</label>
                  <input
                    type="number"
                    value={form.overtimeRate}
                    onChange={(e) => setForm({ ...form, overtimeRate: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonuses</label>
                  <input
                    type="number"
                    value={form.bonuses}
                    onChange={(e) => setForm({ ...form, bonuses: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deductions</label>
                <input
                  type="number"
                  value={form.deductions}
                  onChange={(e) => setForm({ ...form, deductions: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  rows={3}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-600">
                  <p>Gross Salary: ${calculateGross().toLocaleString()}</p>
                  <p className="font-medium">Net Salary: ${calculateNet().toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create Payroll
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
        title="Xóa Payroll"
        message={`Bạn có chắc muốn xóa payroll tháng ${deletingPayroll?.period}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />
    </div>
  )
}