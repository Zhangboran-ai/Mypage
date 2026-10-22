import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { StarField } from '@/components/background/StarField'
import { PageFallback } from '@/components/common/PageFallback'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-nebula" />
      <StarField />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-btn focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-sm"
      >
        跳到主要内容
      </a>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main id="main" className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  )
}
