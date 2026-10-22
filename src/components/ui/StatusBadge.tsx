import type { ReactNode } from 'react'
import { CONTENT_STATUS_LABELS, type ContentStatus } from '@shared/constants'
import { Badge } from './Badge'

const tones: Record<ContentStatus, 'muted' | 'success' | 'warning'> = {
  DRAFT: 'muted',
  PUBLISHED: 'success',
  SCHEDULED: 'warning',
}

export function StatusBadge({ status }: { status: ContentStatus }): ReactNode {
  return <Badge tone={tones[status]}>{CONTENT_STATUS_LABELS[status]}</Badge>
}
