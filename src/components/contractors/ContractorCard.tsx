import { Star, Scale, Heart, ArrowRight } from 'lucide-react'
import { Contractor, getSkillName } from './types'

interface ContractorCardProps {
    contractor: Contractor
    isSelected: boolean
    onSelect: (id: string) => void
    isCompared: boolean
    onToggleCompare: (contractor: Contractor) => void
    onFavorite: (id: string) => void
}

export default function ContractorCard({
    contractor,
    isSelected,
    onSelect,
    isCompared,
    onToggleCompare,
    onFavorite
}: ContractorCardProps) {
    return (
        <div
            onClick={() => onSelect(contractor.id)}
            className={`group relative p-6 rounded-[32px] border-2 transition-all cursor-pointer ${isSelected 
                ? 'bg-white border-blue-500 shadow-2xl shadow-blue-100' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}
        >
            <div className="flex gap-4 items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                    {contractor.displayName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase truncate">
                        {contractor.displayName}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 truncate">
                        {contractor.companyName || 'Đối tác chiến lược'} • {contractor.city || 'Toàn quốc'}
                    </p>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleCompare(contractor); }}
                        className={`p-2 rounded-xl transition-all ${isCompared ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                        <Scale className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onFavorite(contractor.id); }}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                        <Heart className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
                {contractor.skills?.slice(0, 2).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        {getSkillName(s)}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100">
                    <Star className="w-3 h-3 fill-current" />
                    {contractor.avgRating || '5.0'}
                </div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                    Chi tiết <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    )
}
