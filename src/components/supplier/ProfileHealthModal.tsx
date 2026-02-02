'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AlertCircle, CheckCircle2, XCircle, ArrowRight, Building2, Package, Banknote } from 'lucide-react'
import Link from 'next/link'

interface HealthData {
    isComplete: boolean
    missingFields: string[]
    productCount: number
    hasProducts: boolean
}

export default function ProfileHealthModal() {
    const [health, setHealth] = useState<HealthData | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Skip check on profile or product edit pages to avoid loop
        if (pathname === '/supplier/profile' || pathname === '/supplier/products') {
            setIsVisible(false)
            return
        }

        const checkHealth = async () => {
            try {
                const res = await fetch('/api/supplier/profile/health')
                const data = await res.json()
                if (data.success) {
                    setHealth(data.data)
                    if (!data.data.isComplete) {
                        setIsVisible(true)
                    } else {
                        setIsVisible(false)
                    }
                }
            } catch (error) {
                console.error('Failed to check profile health')
            }
        }

        checkHealth()
    }, [pathname])

    if (!isVisible || !health) return null

    const fieldLabels: Record<string, string> = {
        taxId: 'Mã số thuế',
        bankName: 'Tên ngân hàng',
        bankAccountNumber: 'Số tài khoản ngân hàng',
        bankAccountName: 'Tên chủ tài khoản',
        address: 'Địa chỉ kho hàng',
        city: 'Thành phố/Tỉnh'
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="flex items-center gap-4 mb-2">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-2xl font-black uppercase tracking-tight italic">Hồ sơ chưa hoàn thiện</h2>
                    </div>
                    <p className="text-amber-50 font-medium opactiy-90">Vui lòng cập nhật đầy đủ thông tin để kích hoạt toàn bộ tính năng bán hàng.</p>
                </div>

                <div className="p-10 space-y-8">
                    {/* Progress indicator */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl border ${health.missingFields.length === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <Building2 className={`w-5 h-5 ${health.missingFields.length === 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                                {health.missingFields.length === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                            </div>
                            <p className="font-bold text-slate-900">Thông tin pháp lý</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {health.missingFields.length === 0 ? 'Đã hoàn tất' : `${health.missingFields.length} trường còn thiếu`}
                            </p>
                        </div>

                        <div className={`p-5 rounded-2xl border ${health.hasProducts ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <Package className={`w-5 h-5 ${health.hasProducts ? 'text-emerald-600' : 'text-slate-400'}`} />
                                {health.hasProducts ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                            </div>
                            <p className="font-bold text-slate-900">Sản phẩm cung cấp</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {health.hasProducts ? `${health.productCount} sản phẩm` : 'Chưa có sản phẩm'}
                            </p>
                        </div>
                    </div>

                    {/* Detailed list */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Danh sách cần bổ sung:</h3>
                        <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
                            {health.missingFields.map(field => (
                                <div key={field} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                    {fieldLabels[field] || field}
                                </div>
                            ))}
                            {!health.hasProducts && (
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                    Cần đăng tải ít nhất 01 sản phẩm
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link
                            href="/supplier/profile"
                            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-amber-200 active:scale-95"
                        >
                            <Banknote className="w-4 h-4" /> Cập nhật hồ sơ
                        </Link>
                        <Link
                            href="/supplier/products"
                            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                        >
                            <Package className="w-4 h-4" /> Đăng sản phẩm <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
