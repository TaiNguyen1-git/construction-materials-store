import Header from '@/components/Header'

export default function BlogLoading() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            
            {/* Hero Skeleton */}
            <div className="bg-gradient-to-b from-blue-50/50 to-white pt-24 pb-40 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center animate-pulse">
                    <div className="h-8 w-64 bg-slate-100 rounded-full mx-auto mb-10"></div>
                    <div className="h-24 w-3/4 bg-slate-100 rounded-3xl mx-auto mb-8"></div>
                    <div className="h-6 w-1/2 bg-slate-100 rounded-full mx-auto mb-4"></div>
                </div>
            </div>

            {/* Filter Bar Skeleton */}
            <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                <div className="bg-white border border-neutral-100 p-2.5 rounded-[2rem] shadow-2xl h-16 animate-pulse"></div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-24">
                <div className="space-y-20">
                     <div className="h-[600px] bg-slate-50 rounded-[48px] animate-pulse"></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-6">
                                <div className="h-80 bg-slate-50 rounded-[40px] animate-pulse"></div>
                                <div className="h-4 w-1/4 bg-slate-50 rounded-full animate-pulse"></div>
                                <div className="h-8 w-3/4 bg-slate-50 rounded-xl animate-pulse"></div>
                                <div className="h-4 w-full bg-slate-50 rounded-full animate-pulse"></div>
                            </div>
                        ))}
                     </div>
                </div>
            </main>
        </div>
    )
}
