'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, Settings, Award, Percent, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

const TIER_LABELS = ['Đồng (Bronze)', 'Bạc (Silver)', 'Vàng (Gold)', 'Bạch Kim (Platinum)', 'Kim Cương (Diamond)']
const TIER_KEYS = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
const TIER_COLORS = ['bg-amber-50 border-amber-200', 'bg-slate-50 border-slate-200', 'bg-yellow-50 border-yellow-200', 'bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200']

export default function RulesConfig() {
    const [rule, setRule] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchRules() }, [])

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/admin/loyalty/rules')
            const data = await res.json()
            if (data.success) setRule(data.data)
        } catch { toast.error('Lỗi tải cấu hình') }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/loyalty/rules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rule)
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã lưu cấu hình thành công')
                setRule(data.data)
            } else toast.error('Có lỗi xảy ra')
        } catch { toast.error('Lỗi kết nối') }
        finally { setSaving(false) }
    }

    const update = (key: string, value: any) => setRule((prev: any) => ({ ...prev, [key]: value }))

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
    if (!rule) return <div className="text-center py-20 text-slate-400">Không có dữ liệu</div>

    return (
        <div className="space-y-8">
            {/* General Rules */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600"><Settings size={20} /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tighter">Quy Tắc Tích Điểm</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấu hình tỷ lệ tích điểm cơ bản</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tỷ lệ tích điểm (điểm / 1.000đ)</label>
                        <input type="number" step="0.1" min="0" value={rule.pointsPerAmount} onChange={(e) => update('pointsPerAmount', parseFloat(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-bold" />
                        <p className="text-[10px] text-slate-400 mt-1">VD: 1 = Mỗi 1.000đ được 1 điểm</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cách làm tròn</label>
                        <select value={rule.roundingMode} onChange={(e) => update('roundingMode', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-bold">
                            <option value="FLOOR">Làm tròn xuống</option>
                            <option value="CEIL">Làm tròn lên</option>
                            <option value="ROUND">Làm tròn gần nhất</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Thời hạn điểm (tháng)</label>
                        <input type="number" min="0" value={rule.expirationMonths || ''} onChange={(e) => update('expirationMonths', e.target.value ? parseInt(e.target.value) : null)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-bold" placeholder="Để trống = không hết hạn" />
                    </div>
                </div>
            </div>

            {/* Tier Thresholds + Multipliers */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600"><Award size={20} /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tighter">Cấu Hình Hạng Thành Viên</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngưỡng điểm, hệ số nhân và ưu đãi</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="text-left py-3 px-4">Hạng</th>
                                <th className="text-center py-3 px-4">Ngưỡng điểm</th>
                                <th className="text-center py-3 px-4">Hệ số nhân</th>
                                <th className="text-center py-3 px-4">Giảm giá (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TIER_KEYS.map((key, i) => (
                                <tr key={key} className={`border-t border-slate-50 ${TIER_COLORS[i]}`}>
                                    <td className="py-3 px-4 font-bold text-slate-700">{TIER_LABELS[i]}</td>
                                    <td className="py-3 px-4">
                                        <input type="number" min="0" value={rule[`${key}Threshold`]} onChange={(e) => update(`${key}Threshold`, parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center font-bold bg-white focus:ring-2 focus:ring-blue-500" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <input type="number" step="0.1" min="1" value={rule[`${key}Multiplier`]} onChange={(e) => update(`${key}Multiplier`, parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center font-bold bg-white focus:ring-2 focus:ring-blue-500" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <input type="number" step="0.5" min="0" value={rule[`${key}Discount`]} onChange={(e) => update(`${key}Discount`, parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center font-bold bg-white focus:ring-2 focus:ring-blue-500" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Referral & Early Payment */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600"><Percent size={20} /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tighter">Ưu Đãi Đặc Biệt</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới thiệu và thanh toán sớm</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Điểm thưởng giới thiệu</label>
                        <input type="number" min="0" value={rule.referralPoints} onChange={(e) => update('referralPoints', parseInt(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-bold" />
                        <p className="text-[10px] text-slate-400 mt-1">Điểm cộng cho người giới thiệu khi KH mới đăng ký</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Hệ số thưởng thanh toán sớm</label>
                        <input type="number" step="0.1" min="1" value={rule.earlyPaymentBonus} onChange={(e) => update('earlyPaymentBonus', parseFloat(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-bold" />
                        <p className="text-[10px] text-slate-400 mt-1">VD: 1.5 = Cộng thêm 50% điểm khi thanh toán công nợ sớm</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm uppercase tracking-wider disabled:opacity-50">
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                </button>
            </div>
        </div>
    )
}
