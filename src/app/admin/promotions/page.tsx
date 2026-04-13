'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit, Trash2, Ticket, Calendar, 
  Percent, DollarSign, Clock, CheckCircle, XCircle,
  AlertCircle
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Promotion {
  id: string
  code: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number | null
  startDate: string
  endDate: string
  usageLimit?: number | null
  usedCount: number
  isActive: boolean
  createdAt: string
}

export default function PromotionManagementPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: null as number | null,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    usageLimit: null as number | null,
    isActive: true
  })

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      const response = await fetchWithAuth('/api/promotions')
      const data = await response.json()
      if (data.success) {
        setPromotions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch promotions', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo)
      setFormData({
        code: promo.code,
        description: promo.description || '',
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: promo.minOrderAmount,
        maxDiscountAmount: promo.maxDiscountAmount || null,
        startDate: format(new Date(promo.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(promo.endDate), 'yyyy-MM-dd'),
        usageLimit: promo.usageLimit || null,
        isActive: promo.isActive
      })
    } else {
      setEditingPromo(null)
      setFormData({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: null,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        usageLimit: null,
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPromo ? `/api/promotions/${editingPromo.id}` : '/api/promotions'
      const method = editingPromo ? 'PUT' : 'POST'

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Lỗi hệ thống')

      fetchPromotions()
      setIsModalOpen(false)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const filteredPromotions = promotions.filter(p =>
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const isUpcoming = (startDate: string) => new Date(startDate) > new Date()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hệ Thống Khuyến Mãi</h2>
          <p className="text-slate-500 mt-1">Quản lý mã giảm giá và chương trình ưu đãi toàn sàn</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tạo Mã Mới
        </button>
      </div>

      {/* Global Stats or Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc mô tả..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
            <div className="flex flex-col items-center px-4 border-r border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đang chạy</span>
                <span className="text-xl font-black text-blue-600">{promotions.filter(p => p.isActive && !isExpired(p.endDate) && !isUpcoming(p.startDate)).length}</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sắp tới</span>
                <span className="text-xl font-black text-amber-500">{promotions.filter(p => p.isActive && isUpcoming(p.startDate)).length}</span>
            </div>
            <div className="flex flex-col items-center px-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đã hết hạn</span>
                <span className="text-xl font-black text-slate-400">{promotions.filter(p => isExpired(p.endDate)).length}</span>
            </div>
        </div>
      </div>

      {/* Grid view for Vouchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            {/* Ticket Header */}
            <div className={`p-4 ${promo.isActive ? (isExpired(promo.endDate) ? 'bg-slate-50' : (isUpcoming(promo.startDate) ? 'bg-amber-50' : 'bg-blue-50')) : 'bg-red-50'} flex justify-between items-start border-b border-dashed border-slate-200 relative`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${promo.isActive ? 'bg-white' : 'bg-red-100 text-red-600 shadow-sm'}`}>
                        <Ticket className={`w-6 h-6 ${promo.isActive ? 'text-blue-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <div className="text-xl font-black text-slate-900 tracking-wider uppercase">{promo.code}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            {promo.discountType === 'PERCENTAGE' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                            Giảm {promo.discountValue.toLocaleString()}{promo.discountType === 'PERCENTAGE' ? '%' : 'đ'}
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end">
                    <button 
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isExpired(promo.endDate) ? 'bg-slate-200 text-slate-600' :
                        (isUpcoming(promo.startDate) ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')
                    }`}>
                        {isExpired(promo.endDate) ? 'HẾT HẠN' : (isUpcoming(promo.startDate) ? 'SẮP TỚI' : 'ĐANG CHẠY')}
                    </span>
                </div>

                {/* Decorative punched holes */}
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-slate-100 rounded-full border border-slate-200 shadow-inner"></div>
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-slate-100 rounded-full border border-slate-200 shadow-inner"></div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 line-clamp-2 h-10 font-medium italic">
                    {promo.description || "Không có mô tả cho mã này."}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Đơn tối thiểu</span>
                        <div className="text-sm font-bold text-slate-800">{promo.minOrderAmount.toLocaleString()}đ</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Giảm tối đa</span>
                        <div className="text-sm font-bold text-slate-800">{promo.maxDiscountAmount ? `${promo.maxDiscountAmount.toLocaleString()}đ` : 'Không giới hạn'}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                        <span className="text-slate-400">Lượt dùng</span>
                        <span className="text-slate-900">{promo.usedCount} / {promo.usageLimit || '∞'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${promo.usedCount >= (promo.usageLimit || 999999) ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(100, (promo.usedCount / (promo.usageLimit || promo.usedCount || 1)) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <div className="flex-1 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Hết hạn: {format(new Date(promo.endDate), 'dd/MM/yyyy')}</span>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest">Đang tải khuyến mãi...</p>
        </div>
      )}

      {/* Modal - Same Premium Style */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {editingPromo ? 'Cập Nhật Mã' : 'Tạo Mã Giảm Giá'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">Cấu hình các thông số cho chương trình ưu đãi của bạn</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
                <XCircle className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-0 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Mã Code (In Hoa)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black text-blue-600 placeholder-slate-300 transition-all"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: GIAMGIA50K"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Loại Giảm Giá</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, discountType: 'PERCENTAGE'})}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.discountType === 'PERCENTAGE' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                      PHẦN TRĂM (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, discountType: 'FIXED'})}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.discountType === 'FIXED' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                      SỐ TIỀN CỐ ĐỊNH (đ)
                    </button>
                  </div>
                </div>

                <div className="col-span-2 overflow-hidden">
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Mô tả chương trình</label>
                    <textarea
                      rows={2}
                      className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all resize-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="VD: Ưu đãi đặc biệt khi thanh toán qua ngân hàng..."
                    />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Giá Trị Giảm</label>
                  <input
                    type="number"
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Đơn Hàng Tối Thiểu</label>
                  <input
                    type="number"
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                    value={formData.minOrderAmount}
                    onChange={e => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Giảm Tối Đa (Nếu %)</label>
                  <input
                    type="number"
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                    value={formData.maxDiscountAmount || ''}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || null })}
                    placeholder="Không giới hạn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Lượt Sử Dụng Tối Đa</label>
                  <input
                    type="number"
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                    value={formData.usageLimit || ''}
                    onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || null })}
                    placeholder="Không giới hạn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Ngày Kết Thúc</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-all">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <div>
                        <span className="text-sm font-black text-slate-700 uppercase">Kích hoạt mã này ngay bây giờ</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mã sẽ chỉ có hiệu lực nếu trong thời gian chương trình</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95"
                >
                  {editingPromo ? 'Cập Nhật Voucher' : 'Kích Hoạt Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
