import Header from '@/components/Header'

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Banner Skeleton */}
      <div className="bg-primary-600 h-44 animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar Skeleton */}
          <div className="w-full lg:w-80 h-[600px] bg-white rounded-3xl animate-pulse border border-neutral-100"></div>

          {/* Products Content Skeleton */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl h-24 mb-6 animate-pulse"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-[340px] animate-pulse border border-neutral-100"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
