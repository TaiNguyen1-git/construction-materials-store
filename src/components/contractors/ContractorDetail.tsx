import { Heart, Scale, BadgeCheck, MessageSquare, Info, Wrench, Users, Star, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Contractor, getSkillName } from './types'
import { encodeId } from '@/lib/id-utils'

interface ContractorDetailProps {
    contractor: Contractor
    compareList: Contractor[]
    toggleCompare: (c: Contractor) => void
    onFavorite: () => void
    onChat: (id: string) => void
    similarContractors: Contractor[]
    onSelectSimilar: (id: string) => void
}

export default function ContractorDetail({
    contractor,
    compareList,
    toggleCompare,
    onFavorite,
    onChat,
    similarContractors,
    onSelectSimilar
}: ContractorDetailProps) {
    const isCompared = compareList.some(item => item.id === contractor.id)

    return (
        <div className="sticky top-24 bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden h-[calc(100vh-120px)] flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                {/* Header Section Inside Scrollable */}
                <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-700 relative shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
                </div>
                
                <div className="px-10 -mt-12 relative z-10">
                    <div className="flex justify-between items-end mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-[32px] bg-white p-1 shadow-xl">
                                <div className="w-full h-full rounded-[28px] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-900 border border-slate-50">
                                    {contractor.displayName?.charAt(0)}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                <BadgeCheck className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="flex gap-2 mb-1">
                            <button 
                                onClick={onFavorite}
                                className="p-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 sm:bg-slate-50 sm:text-slate-400 sm:border-slate-100 sm:hover:text-red-500 sm:hover:bg-red-50"
                            >
                                <Heart className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => toggleCompare(contractor)}
                                className={`p-3 backdrop-blur-md rounded-xl transition-all border ${isCompared 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white/10 text-white border-white/20 sm:bg-slate-50 sm:text-slate-400 sm:border-slate-100 sm:hover:text-blue-600 sm:hover:bg-blue-50'}`}
                            >
                                <Scale className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">
                            {contractor.displayName}
                        </h2>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            {contractor.companyName || 'Đối tác chiến lược'} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {contractor.city || 'Toàn quốc'}
                        </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-8">
                        {[
                            { label: 'Đánh giá', value: `${contractor.avgRating || '5.0'} ⭐`, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Kinh nghiệm', value: `${contractor.experienceYears || '0'} Năm`, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Dự án', value: `${contractor.totalProjectsCompleted || '0'} C.Trình`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Đội ngũ', value: `${contractor.teamSize || '1'} N.Sự`, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.bg} p-3 rounded-2xl border border-white shadow-sm text-center`}>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                                <p className={`text-[11px] font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 mb-10">
                        <button 
                            onClick={() => onChat(contractor.id)}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Nhắn tin ngay <MessageSquare className="w-4 h-4" />
                        </button>
                        <Link 
                            href={`/contractors/${encodeId(contractor.id)}`}
                            className="flex-1 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center"
                        >
                            Hồ sơ
                        </Link>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5" /> Giới thiệu đối tác
                            </h3>
                            <p className="text-slate-600 font-medium leading-relaxed text-base">
                                {contractor.bio || 'Chưa có thông tin giới thiệu chi tiết cho đối tác này.'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Wrench className="w-3.5 h-3.5" /> Chuyên môn chính
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {contractor.skills?.map((s: string) => (
                                    <span key={s} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black border border-slate-100 uppercase tracking-widest">
                                        {getSkillName(s)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 🤝 SIMILAR CONTRACTORS SECTION */}
                        <div className="pt-8 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Đối tác tương tự
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {similarContractors.map(similar => (
                                    <div 
                                        key={similar.id}
                                        onClick={() => onSelectSimilar(similar.id)}
                                        className="group/item flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors shrink-0">
                                            {similar.displayName?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 uppercase truncate mb-0.5 group-hover/item:text-blue-600 transition-colors">
                                                {similar.displayName}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                                    <Star className="w-3 h-3 fill-current" /> {similar.avgRating || '5.0'}
                                                </div>
                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {similar.experienceYears || '0'} năm kinh nghiệm
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover/item:text-blue-500 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
