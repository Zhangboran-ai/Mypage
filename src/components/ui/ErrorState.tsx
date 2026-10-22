import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = '加载失败',
  message = '请检查网络后重试。',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-danger/20 bg-danger-soft/40 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 size-7 text-danger" aria-hidden="true" />
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-text-muted">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          重试
        </Button>
      ) : null}
    </div>
  )
}
