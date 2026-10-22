import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-btn border border-border-subtle bg-white/[0.03] px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
