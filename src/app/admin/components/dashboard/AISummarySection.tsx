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
  formatCurrency: (amount: number) => string
}

const AISummarySection: React.FC<AISummarySectionProps> = ({
  aiSummary,
  aiSummaryLoading,
  onFetchAISummary,
  predictive,
  formatCurrency
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {predictive && (
            <>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-wrap break-words">Dự báo doanh thu (30d)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency(predictive.next30DaysRevenue)}
                  </span>
                  <div className={`flex items-center text-[10px] font-black ${predictive.trend === 'increasing' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {predictive.trend === 'increasing' ? <ArrowUpRight size={12} /> : <TrendingUp size={12} />}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-wrap break-words">Chỉ số tin cậy</span>
                  <span className={`text-xs font-black leading-none ${predictive.confidence >= 0.7 ? 'text-emerald-500' :
                    predictive.confidence >= 0.5 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {(predictive.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${predictive.confidence >= 0.7 ? 'bg-emerald-500' :
                      predictive.confidence >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${predictive.confidence * 100}%` }}
                  ></div>
                </div>
                {predictive.reasoning && (
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight truncate hover:whitespace-normal transition-all" title={predictive.reasoning}>
                    {predictive.reasoning}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AISummarySection
