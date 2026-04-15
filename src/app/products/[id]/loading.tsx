import Header from '@/components/Header'

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-4 w-48 bg-slate-100 rounded mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-5">
            <div className="aspect-square bg-white rounded-2xl animate-pulse border border-neutral-100"></div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-10 w-3/4 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-12 w-48 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-32 w-full bg-white rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
