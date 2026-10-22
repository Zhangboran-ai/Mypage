import { Skeleton } from '@/components/ui/Skeleton'

export function PageFallback() {
  return (
    <div className="container-page py-16" aria-busy="true" aria-label="页面加载中">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <Skeleton className="mt-2 h-4 w-full max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}
