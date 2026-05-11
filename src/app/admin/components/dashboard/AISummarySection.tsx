import React from 'react'
import { LayoutGrid, Zap, TrendingUp, ArrowUpRight, FileText } from 'lucide-react'

interface AISummarySectionProps {
  aiSummary: string
  aiSummaryLoading: boolean
  onFetchAISummary: () => void
  predictive?: {
    next30DaysRevenue: number
    confidence: number
    trend: 'increasing' | 'decreasing' | 'stable'
    reasoning?: string
  }
  supportStats?: {
    pendingTickets: number
    pendingChats: number
    totalViews: number
    pendingContractors: number
  }
  formatCurrency: (amount: number) => string
  formatNumber: (val: number) => string
}

const AISummarySection: React.FC<AISummarySectionProps> = ({
  aiSummary,
  aiSummaryLoading,
  onFetchAISummary,
  predictive,
  supportStats,
  formatCurrency,
  formatNumber
}) => {
  return (
    <div className="lg:col-span-7 bg-white rounded-[40px] p-10 relative overflow-hidden group border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] h-full">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-700 group-hover:bg-blue-600/10"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <LayoutGrid size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">SmartBuild Analytics</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tóm lược vận hành hệ thống</p>
            </div>
          </div>
          <button
            onClick={onFetchAISummary}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
          >
            <Zap size={16} />
          </button>
        </div>

        <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100/50 relative group/insight">
          <div className="absolute -top-3 -left-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
              <FileText size={14} className="text-blue-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-700 leading-relaxed">
            {aiSummaryLoading ? (
              <span className="flex items-baseline gap-2">
                <span className="h-4 w-4 bg-blue-600/20 rounded-full animate-ping"></span>
                Đang tổng hợp dữ liệu...
              </span>
            ) : (
              aiSummary || 'Tín hiệu kinh doanh ổn định. Hệ thống không ghi nhận bất thường nào trong 24 giờ qua.'
            )}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          {predictive && (
            <div className="col-span-2 md:col-span-1 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dự báo doanh thu (30d)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900 tracking-tighter">
                  {formatCurrency(predictive.next30DaysRevenue)}
                </span>
                <div className={`flex items-center text-[10px] font-black ${predictive.trend === 'increasing' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {predictive.trend === 'increasing' ? <ArrowUpRight size={12} /> : <TrendingUp size={12} />}
                </div>
              </div>
            </div>
          )}

          {supportStats && (
            <>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hỗ trợ & Chats</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${supportStats.pendingTickets > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`}></div>
                    <span className="text-lg font-black tracking-tighter text-slate-900">
                      {formatNumber(supportStats.pendingTickets)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tickets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${supportStats.pendingChats > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
                    <span className="text-lg font-black tracking-tighter text-slate-900">
                      {formatNumber(supportStats.pendingChats)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Chats mới</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Đối tác chờ duyệt</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black tracking-tighter ${supportStats.pendingContractors > 0 ? 'text-rose-500' : 'text-slate-900'}`}>
                    {formatNumber(supportStats.pendingContractors)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Yêu cầu</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Lượt xem Web</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 tracking-tighter">
                    {formatNumber(supportStats.totalViews)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Views</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tin cậy AI</span>
                <div className="flex items-center gap-2">
                   <span className="text-xl font-black text-slate-900 tracking-tighter">
                    {((predictive?.confidence || 0) * 100).toFixed(0)}%
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[40px] overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(predictive?.confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AISummarySection
