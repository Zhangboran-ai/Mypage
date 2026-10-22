import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel?: string
  trigger: ReactNode
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = '确认删除',
  trigger,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} role="presentation">
        {trigger}
      </span>
      <Dialog open={open} title={title} onClose={() => setOpen(false)}>
        <p className="text-sm text-text-secondary">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button variant="danger" size="sm" loading={pending} onClick={() => void handleConfirm()}>
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
