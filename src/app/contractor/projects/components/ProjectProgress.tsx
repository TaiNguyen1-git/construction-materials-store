import React from 'react'

interface Milestone {
    id: string;
    name: string;
    amount: number;
    status: string;
    dueDate: string;
}

interface ProjectProgressProps {
    progress: number;
    milestones?: Milestone[];
    estimatedBudget?: number | null;
}

export default function ProjectProgress({ progress, milestones = [], estimatedBudget }: ProjectProgressProps) {
    // Tự động tính toán giải ngân thực tế thay vì hardcode 24.2%
    const paidAmount = milestones.filter(m => m.status === 'PAID').reduce((sum, m) => sum + m.amount, 0);
    const denominator = estimatedBudget && estimatedBudget > 0 
        ? estimatedBudget 
        : milestones.reduce((sum, m) => sum + m.amount, 0);
        
    const disbursementPercent = denominator > 0 ? (paidAmount / denominator) * 100 : 0;

    return (
        <div className="mt-12 pt-8 border-t border-slate-50">
            <div className="flex justify-between items-end mb-4 px-1">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ thi công</p>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{Math.round(progress || 0)}% Hoàn tất</h3>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giải ngân thực tế</p>
                    <h3 className="text-xl font-bold text-emerald-600 tracking-tight">
                        {disbursementPercent.toFixed(1).replace('.0', '')}%
                    </h3>
                </div>
            </div>
            {/* Progress Bar (Thi công + Giải ngân song song) */}
            <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner border border-slate-50 relative">
                    <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-[1500ms] relative overflow-hidden z-10"
                        style={{ width: `${progress || 0}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-[shimmer_3s_infinite]"></div>
                    </div>
                </div>
                {disbursementPercent > 0 && (
                    <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden shadow-inner border border-emerald-100/50 relative">
                        <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-[1500ms]"
                            style={{ width: `${disbursementPercent}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
