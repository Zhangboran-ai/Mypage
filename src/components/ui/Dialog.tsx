import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type DialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = 'dialog-title'

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // 点在 backdrop 上关闭：通过原生监听避免给 <dialog> 挂点击事件（无障碍规则禁止非交互元素带点击处理）
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }

    dialog.addEventListener('click', handleClick)
    return () => dialog.removeEventListener('click', handleClick)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(92vw,32rem)] rounded-card border border-border-subtle bg-bg-elevated p-0 text-text-primary backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭弹窗"
          className="rounded p-1 text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-primary"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
          {footer}
        </div>
      ) : null}
    </dialog>
  )
}
