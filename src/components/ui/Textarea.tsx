import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-btn border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm leading-6 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
