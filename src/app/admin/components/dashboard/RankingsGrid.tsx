import React from 'react'
import { Trophy, Eye, ShoppingBag, Users, Building2, TrendingUp } from 'lucide-react'
import Image from 'next/image'

interface RankingsGridProps {
  rankings: {
    topViewedProducts: any[]
    topPurchasedProducts: any[]
    topViewedContractors: any[]
    topProjects: any[]
    topSearches?: any[]
    topInteractions?: any[]
  }
  formatCurrency: (amount: number) => string
  formatNumber: (val: number) => string
}

const RankingsGrid: React.FC<RankingsGridProps> = ({ rankings, formatCurrency, formatNumber }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
      {/* Top Viewed Products */}
      <RankingCard 
        title="Sản phẩm xem nhiều" 
        icon={<Eye size={18} />} 
        items={rankings.topViewedProducts}
        renderItem={(item) => (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ShoppingBag size={14} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{formatNumber(item.count)} lượt xem</p>
            </div>
          </div>
        )}
      />

      {/* Top Purchased Products */}
      <RankingCard 
        title="Bán chạy nhất" 
        icon={<TrendingUp size={18} />} 
        items={rankings.topPurchasedProducts}
        renderItem={(item) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Trophy size={16} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
              <p className="text-[10px] text-blue-600 font-black">{formatCurrency(item.revenue)}</p>
            </div>
            <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              {item.quantity}
            </div>
          </div>
        )}
      />

      {/* Top Viewed Contractors */}
      <RankingCard 
        title="Nhà thầu nổi bật" 
        icon={<Users size={18} />} 
        items={rankings.topViewedContractors}
        renderItem={(item) => (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Users size={14} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Đang thịnh hành</p>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
              <Eye size={10} />
              {item.count}
            </div>
          </div>
        )}
      />

      {/* Top Projects */}
      <RankingCard 
        title="Dự án trọng điểm" 
        icon={<Building2 size={18} />} 
        items={rankings.topProjects}
        renderItem={(item) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 truncate flex-1">{item.name}</p>
              <span className="text-[10px] font-black text-blue-600">{formatCurrency(item.budget)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400">{item.progress}%</span>
            </div>
          </div>
        )}
      />

      {/* Top Searches */}
      <RankingCard 
        title="Xu hướng tìm kiếm" 
        icon={<Eye size={18} className="text-orange-500 group-hover:text-white transition-colors duration-500" />} 
        items={rankings.topSearches || []}
        hoverColor="group-hover:bg-orange-600"
        renderItem={(item) => (
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 truncate flex-1">"{item.term}"</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
              <span className="text-[10px] font-black">{item.count}</span>
            </div>
          </div>
        )}
      />

      {/* Feature Usage */}
      <RankingCard 
        title="Tính năng phổ biến" 
        icon={<Trophy size={18} className="text-purple-500 group-hover:text-white transition-colors duration-500" />} 
        items={rankings.topInteractions || []}
        hoverColor="group-hover:bg-purple-600"
        renderItem={(item) => (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{item.type}</p>
              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${Math.min(100, (item.count / (rankings.topInteractions?.[0]?.count || 1)) * 100)}%` }}
                />
              </div>
            </div>
            <span className="ml-4 text-[10px] font-black text-purple-600">{formatNumber(item.count)}</span>
          </div>
        )}
      />
    </div>
  )
}

interface RankingCardProps {
  title: string
  icon: React.ReactNode
  items: any[]
  renderItem: (item: any) => React.ReactNode
  hoverColor?: string
}

const RankingCard: React.FC<RankingCardProps> = ({ title, icon, items, renderItem, hoverColor = 'group-hover:bg-blue-600' }) => (
  <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-500 group">
    <div className="flex items-center gap-2.5 mb-6">
      <div className={`p-2 rounded-xl bg-slate-50 text-slate-500 ${hoverColor} group-hover:text-white transition-all duration-500 shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>

    <div className="space-y-4">
      {items && items.length > 0 ? (
        items.map((item, idx) => (
          <div key={item.id || idx} className="relative group/item">
            {renderItem(item)}
            {idx < items.length - 1 && <div className="mt-4 border-b border-slate-50" />}
          </div>
        ))
      ) : (
        <div className="py-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase italic">Chưa có dữ liệu</p>
        </div>
      )}
    </div>
  </div>
)

export default RankingsGrid
