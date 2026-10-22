import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-btn border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)
