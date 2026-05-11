import React from 'react'
import { HeadphonesIcon, MessageCircle, Eye, ShieldAlert, Users } from 'lucide-react'

interface SupportAndTrafficStatsProps {
  stats: {
    pendingTickets: number
    pendingChats: number
    totalViews: number
    pendingContractors: number
  }
  formatNumber: (val: number) => string
}

const SupportAndTrafficStats: React.FC<SupportAndTrafficStatsProps> = ({
  stats,
  formatNumber
}) => {
  const statCards = [
    {
      title: 'Hỗ trợ chờ xử lý',
      value: formatNumber(stats.pendingTickets),
      icon: HeadphonesIcon,
      color: 'bg-orange-50 text-orange-600',
      trend: stats.pendingTickets > 5 ? 'Quá tải' : 'Bình thường',
      sub: 'Tickets'
    },
    {
      title: 'Tin nhắn chưa đọc',
      value: formatNumber(stats.pendingChats),
      icon: MessageCircle,
      color: 'bg-emerald-50 text-emerald-600',
      trend: 'Trực tiếp',
      sub: 'Chats'
    },
    {
      title: 'Lượt xem sản phẩm',
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: 'bg-purple-50 text-purple-600',
      trend: 'Tương tác',
      sub: 'Lượt xem'
    },
    {
      title: 'Đối tác chờ duyệt',
      value: formatNumber(stats.pendingContractors),
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-600',
      trend: 'Kiểm duyệt',
      sub: 'Nhà thầu'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
        >
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 line-clamp-1">{stat.title}</dt>
                <dd className="font-extrabold text-slate-900 tracking-tighter text-2xl line-clamp-1">
                  {stat.value}
                </dd>
              </div>
              <div className={`p-4 rounded-2xl ${stat.color} transition-all duration-500 group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
              <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                stat.trend === 'Quá tải' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {stat.trend}
              </div>
              <div className="text-[10px] font-bold text-slate-300 uppercase italic tracking-tighter">{stat.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SupportAndTrafficStats
