import { PageSkeleton } from '@/components/admin/skeletons/AdminSkeletons'

export default function AdminLoading() {
  return (
    <div className="w-full h-full min-h-screen bg-slate-50/50">
       <PageSkeleton />
    </div>
  )
}
