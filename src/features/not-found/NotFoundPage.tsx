import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useSeo } from '@/hooks/use-seo'

export function NotFoundPage() {
  useSeo({ title: '页面不存在', noindex: true })

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Compass className="size-10 text-accent" aria-hidden="true" />
      <p className="mt-6 text-xs tracking-[0.3em] text-text-muted">404 · LOST IN SPACE</p>
      <h1 className="mt-4 text-3xl font-semibold text-text-primary sm:text-4xl">
        这片星域还没有内容
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        链接可能已经失效，或者页面被移动了。回到首页继续探索吧。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-btn bg-accent px-5 text-sm font-medium text-[#0A0D16] transition-colors hover:bg-accent-strong"
        >
          回到首页
        </Link>
        <Link
          to="/blog"
          className="inline-flex h-10 items-center rounded-btn border border-border-strong px-5 text-sm text-text-primary transition-colors hover:bg-white/[0.06]"
        >
          去读文章
        </Link>
      </div>
    </div>
  )
}
