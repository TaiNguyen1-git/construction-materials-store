'use client'

import React, { useState } from 'react'
import { 
  ShieldCheck, Save, RotateCcw, Users, Lock, CheckCircle2, 
  AlertCircle, Package, ShoppingCart, Wallet, Settings as SettingsIcon,
  Search, ChevronRight
} from 'lucide-react'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/permissions'
import { toast } from 'react-hot-toast'

const MODULES = [
  { id: 'ORDERS', name: 'Đơn Hàng & Dự Án', icon: ShoppingCart, permissions: ['ORD_VIEW', 'ORD_CREATE', 'ORD_EDIT_PRICE', 'ORD_DELETE', 'ORD_PRINT', 'ORD_APPROVE_DEPOSIT'] },
  { id: 'OPS', name: 'Vận Hành & Cửa Hàng', icon: Wallet, permissions: ['OPS_DISPATCH', 'OPS_CASH_CONFIRM', 'OPS_EXPENSE_CREATE', 'OPS_QUOTE_CREATE'] },
  { id: 'INVENTORY', name: 'Kho & Tồn Kho', icon: Package, permissions: ['INV_VIEW', 'INV_EDIT', 'INV_STOCK_IN_OUT'] },
  { id: 'SYSTEM', name: 'Hệ Thống & Bảo Mật', icon: SettingsIcon, permissions: ['SYS_AUDIT_VIEW', 'SYS_USER_MANAGE', 'SYS_SETTINGS'] },
]

export default function RoleManager() {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vai Trò & Bảo Mật</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Cấu hình ma trận quyền hạn hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-blue-200 transition-all"><RotateCcw size={14} /> Mặc định</button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">{isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />} Lưu thay đổi</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-slate-50 p-4 rounded-[28px] border border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 px-2"><Users size={14} /> Vai trò</h3>
            <div className="space-y-1.5">
              {Object.keys(ROLE_PERMISSIONS).map(role => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    activeRole === role ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-tight">{roleLabels[role] || role}</span>
                  <ChevronRight size={14} className={activeRole === role ? 'opacity-100' : 'opacity-20'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
           {activeRole === 'MANAGER' ? (
             <div className="bg-blue-50 border border-blue-100 p-12 rounded-[40px] text-center space-y-4 shadow-inner">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg"><Lock className="w-8 h-8 text-blue-600" /></div>
                <h2 className="text-xl font-black text-blue-900 tracking-tight uppercase">Full System Access</h2>
                <p className="text-xs font-bold text-blue-400 max-w-sm mx-auto leading-relaxed">Vai trò <b>Quản Lý</b> có toàn quyền hạn mặc định và không thể giới hạn.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {MODULES.map(module => (
                 <div key={module.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 group">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-2.5 bg-slate-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><module.icon size={18} /></div>
                       <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{module.name}</h3>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quyền hạn module</p>
                       </div>
                    </div>
                    <div className="space-y-2">
                      {module.permissions.map(perm => (
                        <label 
                          key={perm} 
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                            currentPermissions[activeRole]?.includes(perm) ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/30 border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                               currentPermissions[activeRole]?.includes(perm) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                             }`}>
                                {currentPermissions[activeRole]?.includes(perm) && <CheckCircle2 size={10} className="text-white" />}
                             </div>
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{perm}</span>
                          </div>
                          <input type="checkbox" className="hidden" checked={currentPermissions[activeRole]?.includes(perm)} onChange={() => togglePermission(activeRole, perm)} />
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
