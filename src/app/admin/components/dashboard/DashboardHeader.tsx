import React from 'react'
import { Calendar, Clock, FileText, RefreshCw } from 'lucide-react'

interface DashboardHeaderProps {
  onSendReport: () => void
  onRefresh: () => void
  isSendingReport: boolean
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onSendReport, 
  onRefresh, 
  isSendingReport 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
      <div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
          Hệ thống <span className="text-blue-600 italic">Vận hành</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
            <Calendar size={12} />
            {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Clock size={12} /> Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSendReport}
          disabled={isSendingReport}
          className="group flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95 shadow-sm"
        >
          {isSendingReport 
            ? <RefreshCw className="animate-spin text-blue-600" size={16} /> 
            : <FileText className="text-blue-600 group-hover:scale-110 transition-transform" size={16} />
          }
          Xuất Báo Cáo
        </button>
        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-2xl font-black transition-all active:rotate-180 shadow-lg shadow-blue-600/20"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  )
}

export default DashboardHeader
