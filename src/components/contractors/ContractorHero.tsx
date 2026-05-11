import { Search, MapPin, ChevronDown, ShieldCheck } from 'lucide-react'
import { CITIES } from './types'

interface ContractorHeroProps {
    searchTerm: string
    setSearchTerm: (val: string) => void
    cityFilter: string
    setCityFilter: (val: string) => void
    isLocationOpen: boolean
    setIsLocationOpen: (val: boolean) => void
}

export default function ContractorHero({
    searchTerm,
    setSearchTerm,
    cityFilter,
    setCityFilter,
    isLocationOpen,
    setIsLocationOpen
}: ContractorHeroProps) {
    return (
        <div className="relative pt-24 pb-48">
            <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#1e3a8a_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#312e81_0%,transparent_50%),radial-gradient(circle_at_50%_80%,#164e63_0%,transparent_50%)] opacity-80"></div>
            </div>
            <div className="max-w-[1400px] mx-auto px-4 relative z-20">
                <div className="max-w-4xl">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-8 backdrop-blur-md">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Hệ thống nhà thầu chuyên nghiệp SmartBuild</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight uppercase">
                        Tìm Kiếm <span className="text-blue-400 italic">Đối Tác</span> <br /> Thi Công Tin Cậy
                    </h1>
                    <div className="relative max-w-3xl">
                        <div className="bg-white/10 backdrop-blur-2xl p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center gap-2 border border-white/10 transition-all hover:border-white/20">
                            <div className="flex-1 flex items-center px-6 w-full group">
                                <Search className="w-5 h-5 text-blue-400 mr-3 group-focus-within:text-blue-300 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm nhà thầu, dịch vụ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full py-5 bg-transparent font-bold text-white placeholder:text-slate-500 outline-none text-lg"
                                />
                            </div>
                            <div className="w-full md:w-56 relative location-dropdown">
                                <button 
                                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                                    className="w-full flex items-center px-6 py-5 border-l border-white/10 group text-left transition-all hover:bg-white/5"
                                >
                                    <MapPin className="w-5 h-5 text-blue-400 mr-3 group-hover:text-blue-300 transition-colors" />
                                    <span className="flex-1 font-black text-white text-sm uppercase tracking-wider truncate">
                                        {cityFilter}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isLocationOpen && (
                                    <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="py-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                            {CITIES.map(city => (
                                                <button
                                                    key={city}
                                                    onClick={() => {
                                                        setCityFilter(city);
                                                        setIsLocationOpen(false);
                                                    }}
                                                    className={`w-full px-6 py-3.5 text-left text-[11px] font-black uppercase tracking-widest transition-all ${
                                                        cityFilter === city 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    {city}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 font-black text-white rounded-[24px] hover:from-blue-500 hover:to-indigo-500 transition-all uppercase tracking-[0.2em] text-xs shadow-lg shadow-blue-900/20 active:scale-95">
                                TÌM KIẾM
                            </button>
                        </div>

                        {/* ✨ Quick Suggestions */}
                        <div className="mt-6 flex flex-wrap items-center gap-3 px-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gợi ý:</span>
                            {['Điện nước', 'Sơn bả', 'Nội thất', 'Sửa chữa'].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSearchTerm(tag)}
                                    className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
