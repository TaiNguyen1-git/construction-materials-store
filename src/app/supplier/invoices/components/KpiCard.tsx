export default function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
    const colors: Record<string, { gradient: string; text: string; subText: string }> = {
        blue: { gradient: 'from-blue-50 to-indigo-50', text: 'text-blue-700', subText: 'text-blue-400' },
        emerald: { gradient: 'from-emerald-50 to-teal-50', text: 'text-emerald-700', subText: 'text-emerald-400' },
        amber: { gradient: 'from-amber-50 to-orange-50', text: 'text-amber-700', subText: 'text-amber-400' },
        rose: { gradient: 'from-rose-50 to-pink-50', text: 'text-rose-700', subText: 'text-rose-400' },
    }
    const c = colors[accent] || colors.blue

    return (
        <div className={`bg-gradient-to-br ${c.gradient} rounded-2xl lg:rounded-3xl p-5 lg:p-7 border border-white/60 shadow-sm hover:shadow-md transition-shadow duration-300`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
            <p className={`text-2xl lg:text-3xl font-black ${c.text} tracking-tight leading-none`}>{value}</p>
            <p className={`text-[11px] font-bold ${c.subText} mt-2`}>{sub}</p>
        </div>
    )
}
