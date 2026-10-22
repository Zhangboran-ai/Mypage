import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PageFallback } from '@/components/common/PageFallback'
import { AdminSidebar } from '@/features/admin/AdminSidebar'

export function AdminLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen bg-bg-base">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 0%, rgba(124,156,255,0.10), transparent 70%), radial-gradient(50% 40% at 90% 10%, rgba(255,226,184,0.05), transparent 70%)',
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
