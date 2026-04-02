'use client'

import React, { useState } from 'react'
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Users, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Package,
  ShoppingCart,
  Wallet,
  Settings as SettingsIcon,
  Search
} from 'lucide-react'
import { PERMISSIONS, ROLE_PERMISSIONS, Permission } from '@/lib/permissions'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

const MODULES = [
  { id: 'ORDERS', name: 'Đơn Hàng & Dự Án', icon: ShoppingCart, permissions: ['ORD_VIEW', 'ORD_CREATE', 'ORD_EDIT_PRICE', 'ORD_DELETE', 'ORD_PRINT', 'ORD_APPROVE_DEPOSIT'] },
  { id: 'OPS', name: 'Vận Hành & Cửa Hàng', icon: Wallet, permissions: ['OPS_DISPATCH', 'OPS_CASH_CONFIRM', 'OPS_EXPENSE_CREATE', 'OPS_QUOTE_CREATE'] },
  { id: 'INVENTORY', name: 'Kho & Tồn Kho', icon: Package, permissions: ['INV_VIEW', 'INV_EDIT', 'INV_STOCK_IN_OUT'] },
  { id: 'SYSTEM', name: 'Hệ Thống & Bảo Mật', icon: SettingsIcon, permissions: ['SYS_AUDIT_VIEW', 'SYS_USER_MANAGE', 'SYS_SETTINGS'] },
]

export default function RoleManagementPage() {
  const [activeRole, setActiveRole] = useState<string>('EMPLOYEE')
  const [currentPermissions, setCurrentPermissions] = useState<Record<string, string[]>>({
    ...ROLE_PERMISSIONS
  })
  const [isSaving, setIsSaving] = useState(false)

  const togglePermission = (role: string, perm: string) => {
    setCurrentPermissions(prev => {
      const perms = prev[role] || []
      const newPerms = perms.includes(perm) 
        ? perms.filter(p => p !== perm) 
        : [...perms, perm]
      return { ...prev, [role]: newPerms }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Mock API call
    await new Promise(r => setTimeout(r, 1000))
    setIsSaving(false)
    toast.success(`Đã cập nhật quyền hạn cho vai trò ${activeRole}!`)
  }

  const handleReset = () => {
    if (confirm('Khôi phục về cài đặt mặc định cho vai trò này?')) {
      setCurrentPermissions(prev => ({
        ...prev,
        [activeRole]: ROLE_PERMISSIONS[activeRole] || []
      }))
    }
  }

  const roleLabels: Record<string, string> = {
    MANAGER: 'Quản Lý Cửa Hàng',
    EMPLOYEE: 'Nhân Viên Bán Hàng',
    ACCOUNTANT: 'Kế Toán / Thu Ngân',
    WAREHOUSE_STAFF: 'Nhân Viên Kho'
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl text-white shadow-xl shadow-indigo-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight text-responsive">Quản Lý Vai Trò & Quyền Hạn</h1>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 bg-slate-100/50 px-3 py-1 rounded-lg inline-block">
            Cấu hình ma trận bảo mật hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Khôi phục mặc định
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Side Selection */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" /> Vai trò người dùng
            </h3>
            <div className="space-y-2">
              {Object.keys(ROLE_PERMISSIONS).map(role => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    activeRole === role ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-sm font-bold truncate">{roleLabels[role] || role}</span>
                  {activeRole === role ? <CheckCircle2 className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
               <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">
                    Mọi thay đổi sẽ có hiệu lực ngay lập tức sau khi nhân viên làm mới trình duyệt.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-9 space-y-6">
           {activeRole === 'MANAGER' ? (
             <div className="bg-indigo-50 border border-indigo-100 p-12 rounded-[40px] text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-indigo-100">
                    <Lock className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-indigo-900 tracking-tight uppercase tracking-[0.2em]">Full System Access</h2>
                <p className="text-sm font-bold text-indigo-400 max-w-md mx-auto leading-relaxed">
                  Vai trò <b>Quản Lý Cửa Hàng</b> mặc định có toàn bộ quyền hạn trong hệ thống và không thể bị giới hạn.
                </p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {MODULES.map(module => (
                 <div key={module.id} className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 hover:shadow-2xl hover:shadow-slate-200/80 transition-all group">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="p-3 bg-slate-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                          <module.icon className="w-6 h-6" />
                       </div>
                       <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">{module.name}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thiết lập quyền module</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                      {module.permissions.map(perm => (
                        <label 
                          key={perm} 
                          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                            currentPermissions[activeRole]?.includes(perm) ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-50' : 'bg-slate-50/50 border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                               currentPermissions[activeRole]?.includes(perm) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                             }`}>
                                {currentPermissions[activeRole]?.includes(perm) && <CheckCircle2 className="w-3 h-3 text-white" />}
                             </div>
                             <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{perm}</span>
                          </div>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={currentPermissions[activeRole]?.includes(perm)}
                            onChange={() => togglePermission(activeRole, perm)}
                          />
                        </label>
                      ))}
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
  )
}
