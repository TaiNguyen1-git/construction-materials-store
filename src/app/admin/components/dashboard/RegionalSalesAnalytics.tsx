'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Map as MapIcon, 
  ChevronRight, 
  TrendingUp, 
  MapPin, 
  Target,
  ArrowUpRight,
  Filter,
  X
} from 'lucide-react'

interface RegionData {
  region: string
  salesCount: number
  revenue: number
  topProduct: string
  growth: number
  coordinates: { x: number; y: number }
}

const MOCK_REGIONS: RegionData[] = [
  { region: 'Quận 7 (Phú Mỹ Hưng)', salesCount: 1420, revenue: 2450000000, topProduct: 'Gạch ốp lát 80x80', growth: 12.5, coordinates: { x: 75, y: 80 } },
  { region: 'Quận 2 (Thạnh Mỹ Lợi)', salesCount: 1250, revenue: 1980000000, topProduct: 'Sắt thép Pomina', growth: 8.2, coordinates: { x: 85, y: 40 } },
  { region: 'Quận Bình Tân', salesCount: 980, revenue: 1240000000, topProduct: 'Xi măng Hà Tiên', growth: -2.3, coordinates: { x: 30, y: 70 } },
  { region: 'Quận 12', salesCount: 850, revenue: 1050000000, topProduct: 'Gỗ lát sàn', growth: 15.4, coordinates: { x: 40, y: 20 } },
  { region: 'TP. Thủ Đức', salesCount: 1680, revenue: 3200000000, topProduct: 'Thiết bị vệ sinh Toto', growth: 22.1, coordinates: { x: 80, y: 30 } },
]

export default function RegionalSalesAnalytics({ formatCurrency }: { formatCurrency: (v: number) => string }) {
  const [selectedRegion, setSelectedRegion] = useState<RegionData>(MOCK_REGIONS[0])
  const [showFullReport, setShowFullReport] = useState(false)

  return (
    <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden flex flex-col lg:flex-row h-full group">
      {/* Map Visualization Side */}
      <div className="lg:w-2/3 p-10 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 opacity-[0.03] pattern-grid-lg"></div>
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <MapIcon className="w-7 h-7 text-blue-600" />
              Điểm Nóng Bán Hàng
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Phân tích theo khu vực địa lý</p>
          </div>
          <button className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Mock Map Representation */}
        <div className="relative aspect-square max-h-[500px] mx-auto bg-white/50 rounded-full border-4 border-dashed border-slate-200/50 flex items-center justify-center p-12">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                 <MapIcon className="w-full h-full text-slate-400" />
            </div>

            {MOCK_REGIONS.map((item) => (
                <motion.button
                    key={item.region}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => setSelectedRegion(item)}
                    className="absolute"
                    style={{ left: `${item.coordinates.x}%`, top: `${item.coordinates.y}%` }}
                >
                    <div className="relative group/pin">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            selectedRegion.region === item.region ? 'bg-blue-600 shadow-lg shadow-blue-500/40 ring-4 ring-blue-100' : 'bg-white shadow-md'
                        }`}>
                             <MapPin className={`w-4 h-4 ${selectedRegion.region === item.region ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        {/* Tooltip on Map */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/pin:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                            {item.region}
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>

        <div className="absolute bottom-8 left-10 flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Doanh thu cực đại</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Vùng tiềm năng</span>
            </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="lg:w-1/3 p-10 flex flex-col border-l border-slate-100">
          <div className="mb-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Chi tiết khu vực</h3>
              <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 ring-4 ring-white shadow-inner">
                      <p className="text-xl font-black text-slate-900 mb-2">{selectedRegion.region}</p>
                      <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-600">Sản phẩm top: <b className="text-slate-900">{selectedRegion.topProduct}</b></span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white border border-slate-100 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doanh thu</p>
                          <p className="font-black text-slate-900">{formatCurrency(selectedRegion.revenue)}</p>
                      </div>
                      <div className="p-5 bg-white border border-slate-100 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tăng trưởng</p>
                          <p className={`font-black flex items-center gap-1 ${selectedRegion.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {selectedRegion.growth}%
                             <TrendingUp className={`w-3 h-3 ${selectedRegion.growth < 0 ? 'rotate-90' : ''}`} />
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex-1 space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Các vùng khác</h4>
               {MOCK_REGIONS.filter(r=>r.region !== selectedRegion.region).slice(0, 3).map(region => (
                   <button 
                    key={region.region}
                    onClick={() => setSelectedRegion(region)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group/region"
                   >
                       <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover/region:bg-white transition-colors">
                               <MapPin className="w-5 h-5 text-slate-400" />
                           </div>
                           <div className="text-left leading-tight">
                               <p className="text-sm font-bold text-slate-700">{region.region}</p>
                               <p className="text-[10px] text-slate-400">{formatCurrency(region.revenue)}</p>
                           </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover/region:opacity-100 transition-all mr-2" />
                   </button>
               ))}
          </div>

          <button 
            onClick={() => setShowFullReport(true)}
            className="mt-8 w-full py-5 bg-blue-600 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 ring-4 ring-blue-50"
          >
              Xem báo cáo vùng đầy đủ
              <ArrowUpRight className="w-5 h-5" />
          </button>
      </div>

      {/* Full Report Modal */}
      <AnimatePresence>
        {showFullReport && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowFullReport(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
             />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden p-12 border border-white/20"
             >
                <div className="flex justify-between items-center mb-12">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Báo Cáo: {selectedRegion.region}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Phân tích chuyên sâu dữ liệu xây dựng 2026</p>
                   </div>
                   <button onClick={() => setShowFullReport(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                      <X className="w-6 h-6 text-slate-400" />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="col-span-2 space-y-8">
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-blue-600" /> Tỷ lệ mặt hàng tiêu thụ
                         </h3>
                         <div className="space-y-4">
                            {[
                               { name: 'Gạch ốp lát', share: 45, color: 'bg-blue-600' },
                               { name: 'Xi măng Hà Tiên', share: 30, color: 'bg-indigo-500' },
                               { name: 'Sắt thép Hòa Phát', share: 15, color: 'bg-emerald-500' },
                               { name: 'Sơn & Chống thấm', share: 10, color: 'bg-slate-300' },
                            ].map(item => (
                               <div key={item.name} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                                     <span>{item.name}</span>
                                     <span>{item.share}%</span>
                                  </div>
                                  <div className="h-4 bg-white rounded-full overflow-hidden border border-slate-200 p-1">
                                     <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${item.share}%` }} transition={{ delay: 0.3, duration: 1 }}
                                        className={`h-full rounded-full ${item.color}`}
                                     />
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[32px] shadow-xl shadow-blue-500/30">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Tiềm năng tháng tới</p>
                         <p className="text-2xl font-black tracking-tight">{formatCurrency(selectedRegion.revenue * 1.15)}</p>
                         <div className="mt-4 flex items-center gap-2 text-[10px] font-black bg-white/20 w-fit px-3 py-1.5 rounded-full uppercase tracking-tighter">
                            <ArrowUpRight className="w-3 h-3" /> Tăng trưởng dự báo +15%
                         </div>
                      </div>

                      <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 space-y-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Dự Án Cao Cấp</h4>
                         {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 items-center">
                               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">0{i}</div>
                               <div className="text-[11px] font-bold text-slate-600 tracking-tight">Khu đô thị {['Skyline', 'Riverside', 'GreenPark'][i-1]}</div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400 italic font-bold leading-relaxed max-w-sm">Dữ liệu được tổng hợp từ lịch trình xe giao hàng và báo cáo doanh thu tại chỗ.</p>
                    <button className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                       Xuất file PDF chi tiết
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
