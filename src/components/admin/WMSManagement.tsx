'use client'

import React, { useState, useEffect } from 'react'
import {
    Plus, Box, LayoutGrid, MapPin,
    ChevronRight, ArrowRight, Loader2,
    AlertTriangle, Check, CircleAlert, CircleDot, Droplets, Boxes, Warehouse
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

const RACK_TYPES: Record<string, { label: string, icon: any }> = {
    RACK: { label: 'Kệ Hàng', icon: LayoutGrid },
    OPEN_YARD: { label: 'Bãi Lộ Thiên', icon: MapPin },
    SILO: { label: 'Silo Chứa', icon: CircleDot },
    TANK: { label: 'Bồn Chứa', icon: Droplets },
    ZONE: { label: 'Khu Vực', icon: Boxes }
}

export default function WMSManagement() {
    const [racks, setRacks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddRack, setShowAddRack] = useState(false)
    const [newRack, setNewRack] = useState({ name: '', warehouse: 'Kho Chính', type: 'RACK' })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchWMS()
    }, [])

    const fetchWMS = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/inventory/wms')
            const data = await res.json()
            if (res.ok) setRacks(data.data || [])
        } catch (err) {
            toast.error('Không thể tải dữ liệu WMS')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRack = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const res = await fetchWithAuth('/api/inventory/wms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-rack', ...newRack })
            })
            if (res.ok) {
                toast.success('Đã tạo dãy kệ mới')
                setShowAddRack(false)
                fetchWMS()
            }
        } catch (err) {
            toast.error('Lỗi tạo kệ')
        } finally {
            setCreating(false)
        }
    }

    const handleCreateBin = async (rackId: string, rackType: string) => {
        const code = window.prompt('Nhập mã vị trí (Vd: A1-01):')
        if (!code) return

        let type = 'SHELF_BIN'
        if (rackType === 'OPEN_YARD') type = 'PILE'
        else if (rackType === 'SILO' || rackType === 'TANK') type = 'TANK_STORAGE'

        try {
            const res = await fetchWithAuth('/api/inventory/wms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-bin', rackId, binCode: code, type })
            })
            if (res.ok) {
                toast.success('Đã tạo vị trí lưu trữ mới')
                fetchWMS()
            }
        } catch (err) {
            toast.error('Lỗi tạo ô chứa')
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sơ Đồ Kho Chi Tiết</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Quản lý dãy kệ (Rack) và ô chứa (Bin)</p>
                </div>
                <button
                    onClick={() => setShowAddRack(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                    <Plus size={16} /> Thêm dãy kệ
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {racks.map((rack) => (
                    <div key={rack.id} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${rack.type === 'OPEN_YARD' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {rack.type && RACK_TYPES[rack.type] ? React.createElement(RACK_TYPES[rack.type].icon, { size: 24 }) : <LayoutGrid size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{rack.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rack.warehouse} • {RACK_TYPES[rack.type as string]?.label || rack.type}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCreateBin(rack.id, rack.type)}
                                className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                title="Thêm ô chứa"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {rack.bins.map((bin: any) => (
                                <div key={bin.id} className="bg-slate-50 rounded-[28px] p-5 border border-slate-100 group hover:border-blue-300 hover:bg-white transition-all">
                                    <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500">
                                        <span>Vị trí</span>
                                        <Box size={14} className={bin.stockItems.length > 0 ? 'text-blue-500' : 'text-slate-200'} />
                                    </div>
                                    <p className="text-lg font-black text-slate-900 mb-4">{bin.code}</p>

                                    <div className="space-y-2">
                                        {bin.stockItems.map((link: any) => (
                                            <div key={link.id} className="flex flex-col gap-1 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <p className="text-[9px] font-black text-slate-900 leading-tight truncate">{link.inventoryItem.product.name}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-medium text-slate-400">{link.inventoryItem.product.sku}</span>
                                                    <span className="text-[9px] font-black text-blue-600">{link.quantity} {link.inventoryItem.product.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {bin.stockItems.length === 0 && (
                                            <p className="text-[9px] text-slate-300 font-bold uppercase py-2">Trống</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showAddRack && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !creating && setShowAddRack(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-8 bg-slate-900 text-white">
                            <h3 className="text-2xl font-black tracking-tight uppercase">Thêm Dãy Kệ</h3>
                        </div>
                        <form onSubmit={handleCreateRack} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên dãy (Vd: Rack A1)</label>
                                <input
                                    type="text"
                                    required
                                    value={newRack.name}
                                    onChange={e => setNewRack({ ...newRack, name: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loại lưu trữ</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(RACK_TYPES).map(([key, data]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setNewRack({ ...newRack, type: key })}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${newRack.type === key ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                                        >
                                            {React.createElement(data.icon, { size: 20, className: newRack.type === key ? 'text-blue-600' : 'text-slate-400' })}
                                            <span className={`text-[10px] font-black uppercase ${newRack.type === key ? 'text-blue-600' : 'text-slate-400'}`}>{data.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kho chứa</label>
                                <select
                                    value={newRack.warehouse}
                                    onChange={e => setNewRack({ ...newRack, warehouse: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none"
                                >
                                    <option value="Kho Chính">Kho Chính</option>
                                    <option value="Kho Phụ">Kho Phụ</option>
                                    <option value="Bãi Lộ Thiên">Bãi Lộ Thiên</option>
                                    <option value="Kho Vật Liệu Nặng">Kho Vật Liệu Nặng</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddRack(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Hủy</button>
                                <button type="submit" disabled={creating} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
