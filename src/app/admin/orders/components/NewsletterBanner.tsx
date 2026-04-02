import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mail, CheckCircle2, ChevronDown } from 'lucide-react'

const NewsletterBanner: React.FC = () => {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [targetSegment, setTargetSegment] = useState<'ALL' | 'VIP' | 'NEW' | 'B2B' | 'CUSTOM'>('ALL')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])

  const SEGMENTS = {
    ALL: { name: 'Tất cả khách hàng', count: 450, icon: '🌍' },
    VIP: { name: 'Khách hàng VIP (Loyal)', count: 65, icon: '💎' },
    NEW: { name: 'Khách hàng mới (30 ngày)', count: 120, icon: '🆕' },
    B2B: { name: 'Dự án & Đối tác B2B', count: 85, icon: '🏗️' },
    CUSTOM: { name: 'Danh sách đã chọn', count: selectedEmails.length, icon: '🎯' }
  }

  const MOCK_LEADS = [
    { email: 'thanh.nguyen@smartbuild.vn', date: '2026-03-28', status: 'Active' },
    { email: 'hoang.le@vinconstruction.com', date: '2026-03-29', status: 'Active' },
    { email: 'anh.tuan@decorplus.vn', date: '2026-03-25', status: 'Unsubscribed' },
    { email: 'mai.lan@buildinghub.vn', date: '2026-03-22', status: 'Active' },
    { email: 'phuc.dang@betong.vn', date: '2026-03-15', status: 'Active' },
    { email: 'nam.tran@quangtrung.com', date: '2026-03-12', status: 'Active' },
    { email: 'linh.vu@decor.vn', date: '2026-03-10', status: 'Active' },
    { email: 'quan.nguyen@smart.vn', date: '2026-03-05', status: 'Unsubscribed' },
  ]

  const filteredLeads = MOCK_LEADS.filter(l => l.email.toLowerCase().includes(searchQuery.toLowerCase()))
  const ITEMS_PER_PAGE = 5
  const totalPages = Math.ceil(450 / ITEMS_PER_PAGE)
  const displayLeads = filteredLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const toggleSelect = (email: string) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email])
  }

  const toggleSelectAll = () => {
     const currentEmails = displayLeads.map(l => l.email)
     const allSelected = currentEmails.every(e => selectedEmails.includes(e))
     if (allSelected) {
        setSelectedEmails(prev => prev.filter(e => !currentEmails.includes(e)))
     } else {
        setSelectedEmails(prev => Array.from(new Set([...prev, ...currentEmails])))
     }
  }

  const handleLaunch = async () => {
    setIsLaunching(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsLaunching(false)
    setShowCreateModal(false)
    toast.success(`Chiến dịch đã được khởi chạy tới ${SEGMENTS[targetSegment].count} khách hàng!`, {
      icon: '🚀',
      duration: 5000,
      style: { background: '#333', color: '#fff', borderRadius: '16px', fontWeight: 'black' }
    })
  }

  return (
    <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 rounded-[32px] p-8 text-white shadow-2xl shadow-blue-500/30 overflow-hidden relative mb-10 group border border-white/10">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
      <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-8">
        <div className="flex-1 text-center xl:text-left">
          <div className="flex items-center justify-center xl:justify-start gap-4 mb-3">
             <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 ring-1 ring-white/10">
               <Mail className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-2xl font-black tracking-tight">Hệ thống Email Marketing</h2>
          </div>
          <p className="text-blue-100/80 max-w-2xl text-sm font-medium leading-relaxed">
            Hệ thống ghi nhận <span className="text-white font-black bg-white/10 px-2 py-1 rounded-lg">450 khách hàng</span> đang chờ báo giá. 
            Hãy kích hoạt chiến dịch <span className="text-yellow-300 font-bold underline decoration-yellow-300/40">Bảng giá tháng 4</span> để tối ưu hóa doanh thu ngay bây giờ!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <button 
            onClick={() => setShowListModal(true)}
            className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/20"
          >
            Quản lý danh sách
          </button>
          <button 
             onClick={() => {
                setTargetSegment('ALL')
                setShowCreateModal(true)
             }}
             className="px-8 py-4 bg-white/10 border border-white/30 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
          >
            Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {/* List Management Modal */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowListModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 30 }}
               className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-3xl overflow-hidden flex flex-col max-h-[85vh]"
             >
                <div className="p-10 pb-6 flex justify-between items-center bg-white z-10 border-b border-slate-50">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-inner">
                         <Mail className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Cơ Sở Dữ Liệu Email</h3>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {selectedEmails.length > 0 ? `Đã chọn ${selectedEmails.length} khách khách` : `Tổng cộng 450 khách hàng đăng ký`}
                         </p>
                      </div>
                   </div>
                   <button onClick={() => setShowListModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                   </button>
                </div>

                <div className="px-10 mt-6 mb-6">
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm Email khách hàng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                      />
                   </div>
                </div>

                <div className="px-10 flex-1 overflow-y-auto pb-6 scrollbar-elegant">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-slate-100">
                            <th className="py-4 w-10">
                               <input type="checkbox" checked={displayLeads.length > 0 && displayLeads.every(l => selectedEmails.includes(l.email))} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            </th>
                            <th className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</th>
                            <th className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Subscriber Date</th>
                            <th className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {displayLeads.map((lead, idx) => (
                            <tr key={idx} className={`group hover:bg-blue-50/50 transition-colors ${selectedEmails.includes(lead.email) ? 'bg-blue-50/30' : ''}`}>
                               <td className="py-4">
                                  <input type="checkbox" checked={selectedEmails.includes(lead.email)} onChange={() => toggleSelect(lead.email)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                               </td>
                               <td className="py-4 text-sm font-bold text-slate-700">{lead.email}</td>
                               <td className="py-4 text-xs font-bold text-slate-400">{lead.date}</td>
                               <td className="py-4 text-right">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                     lead.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                     {lead.status}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-10 py-4 flex items-center justify-between border-t border-slate-100 bg-white shadow-sm">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Trang {currentPage} / {totalPages}
                   </div>
                   <div className="flex gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all"
                      >
                         Trang Trước
                      </button>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all"
                      >
                         Trang Sau
                      </button>
                   </div>
                </div>

                <div className="p-8 pb-10 flex items-center justify-between bg-slate-50/50 border-t border-white gap-4">
                   <div className="flex gap-3">
                      <button 
                        onClick={() => toast.success('Đang khởi tạo file CSV...', { icon: '📊' })}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                      >
                         Xuất (CSV)
                      </button>
                      <button 
                        onClick={() => setSelectedEmails([])}
                        className={`px-6 py-3 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all ${selectedEmails.length === 0 ? 'hidden' : 'block'}`}
                      >
                         Bỏ chọn
                      </button>
                   </div>

                   <button 
                     disabled={selectedEmails.length === 0}
                     onClick={() => {
                        setShowListModal(false)
                        setTargetSegment('CUSTOM')
                        setShowCreateModal(true)
                     }}
                     className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                   >
                      <Send className="w-3.5 h-3.5" />
                      Gửi Email cho {selectedEmails.length} khách đã chọn
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Campaign Editor Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowCreateModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 30 }}
               className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-3xl overflow-hidden p-10 border border-slate-100"
             >
                <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                         <Mail className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Soạn Chiến Dịch Marketing</h3>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">🎯 Đối tượng: {SEGMENTS[targetSegment].name}</p>
                      </div>
                   </div>
                   <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tiêu đề chiến dịch</label>
                       <input 
                         type="text" 
                         defaultValue="🔥 Ưu đãi Báo giá Vật liệu Xây dựng Tháng 04/2026"
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                       />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phân khúc khách hàng (Targeting)</label>
                       <div className="grid grid-cols-2 gap-3">
                          {Object.entries(SEGMENTS).map(([key, data]) => {
                             if (key === 'CUSTOM' && selectedEmails.length === 0) return null
                             return (
                                <button
                                   key={key}
                                   onClick={() => setTargetSegment(key as any)}
                                   className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                                      targetSegment === key ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-100 hover:border-blue-200 bg-slate-50/50'
                                   }`}
                                >
                                   <span className="text-lg">{data.icon}</span>
                                   <div className="leading-none">
                                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter mb-1">{data.name}</p>
                                      <p className="text-[9px] font-bold text-slate-400">{data.count} Khách hàng</p>
                                   </div>
                                </button>
                             )
                          })}
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mẫu Email (Template)</label>
                       <div className="relative group">
                          <div className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer group-hover:border-blue-400 transition-all shadow-sm">
                             <span className="text-sm font-bold text-slate-700">Mẫu Báo Giá Đa Cấp & Dự Án (.html)</span>
                             <ChevronDown className="w-4 h-4 text-slate-400" />
                          </div>
                       </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => toast('Đã gửi bản xem trước tới hòm thư cá nhân!', { icon: '👁️' })}
                        className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                         Gửi thử
                      </button>
                      <button 
                        onClick={handleLaunch}
                        disabled={isLaunching}
                        className="flex-[2] px-4 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:shadow-none"
                      >
                         {isLaunching ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : (
                            <>
                               <Send className="w-4 h-4" />
                               Khởi chạy tới {SEGMENTS[targetSegment].count} khách
                            </>
                         )}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NewsletterBanner
