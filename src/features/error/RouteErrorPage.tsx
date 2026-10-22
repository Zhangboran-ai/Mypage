import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function RouteErrorPage() {
  const error = useRouteError()

  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  const message = isNotFound
    ? '这个页面不存在，或者已经被移动了。'
    : '页面出现了一点问题，请刷新后重试。'

  if (import.meta.env.DEV && error) {
    console.error('[router]', error)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-text-muted">ASTRA</p>
      <h1 className="mt-4 text-4xl font-semibold text-text-primary">
        {isNotFound ? '404' : '出错了'}
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>刷新页面</Button>
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-btn border border-border-strong px-5 text-sm text-text-primary transition-colors hover:bg-white/[0.06]"
        >
          回到首页
        </Link>
      </div>
    </div>
  )
}
