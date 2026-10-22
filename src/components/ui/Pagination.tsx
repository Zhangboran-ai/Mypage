import type { PaginatedMeta } from '@shared/schemas/responses'
import { Button } from './Button'

type PaginationProps = {
  meta: PaginatedMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="分页">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(meta.page - 1)}
        disabled={meta.page <= 1}
      >
        上一页
      </Button>
      <span className="text-sm text-text-muted">
        第 {meta.page} / {meta.totalPages} 页 · 共 {meta.total} 条
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(meta.page + 1)}
        disabled={meta.page >= meta.totalPages}
      >
        下一页
      </Button>
    </nav>
  )
}
