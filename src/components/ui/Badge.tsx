import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeProps = {
  children: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'
  className?: string
}

const tones = {
  default: 'border-border-subtle bg-white/[0.05] text-text-secondary',
  accent: 'border-accent/30 bg-accent-soft text-accent-strong',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger-soft text-danger',
  muted: 'border-border-subtle bg-white/[0.03] text-text-muted',
}

export function Badge({ children, tone = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs leading-5',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
