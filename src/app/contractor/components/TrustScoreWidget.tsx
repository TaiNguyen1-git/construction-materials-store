'use client'

import { ShieldCheck, Star, Zap, Award, CheckCircle2 } from 'lucide-react'

interface TrustScoreWidgetProps {
    score: number
    completedProjects: number
    verified: boolean
}

export default function TrustScoreWidget({ score, completedProjects, verified }: TrustScoreWidgetProps) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden relative group">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Chỉ số Tín nhiệm (Trust)</h3>
                    {verified ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Đã xác minh
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <Award className="w-3.5 h-3.5" />
                            Chờ xác thực
                        </div>
                    )}
                </div>

                <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">{score}</span>
                    <span className="text-xl font-bold text-gray-400 pb-1.5">/100</span>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Độ hài lòng</span>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-black text-gray-900">4.9</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Số dự án hoàn thành</span>
                        <span className="font-black text-gray-900">{completedProjects}</span>
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-gray-900">Hạng: Chuyên Gia</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${score}%` }} />
                        </div>
                    </div>

                    <button className="w-full py-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300">
                        Nâng cấp hồ sơ công ty
                    </button>
                </div>
            </div>
        </div>
    )
}
