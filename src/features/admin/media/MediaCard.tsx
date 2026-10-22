import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { MediaItem } from '@shared'
import { formatDateTime, formatFileSize } from '@/lib/format'
import { CopyButton } from '@/components/common/CopyButton'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '../components/ConfirmDialog'

type MediaCardProps = {
  item: MediaItem
  onSaveAlt: (id: string, alt: string | null) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function MediaCard({ item, onSaveAlt, onDelete }: MediaCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [alt, setAlt] = useState(item.alt ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveAlt(item.id, alt.trim() ? alt.trim() : null)
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="glass-card overflow-hidden">
      <div className="aspect-[16/10] bg-white/[0.03]">
        <img
          src={item.url}
          alt={item.alt ?? ''}
          width={item.width ?? 640}
          height={item.height ?? 400}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="space-y-2 p-4">
        <p className="truncate text-sm font-medium text-text-primary" title={item.filename}>
          {item.filename}
        </p>
        <p className="text-xs text-text-muted">
          {formatFileSize(item.size)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
          {' · '}
          {formatDateTime(item.createdAt)}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <CopyButton value={item.url} label="复制链接" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAlt(item.alt ?? '')
              setDialogOpen(true)
            }}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            替代文本
          </Button>
          <ConfirmDialog
            title="删除图片"
            description="删除后无法恢复；被文章或项目引用时会被拒绝。"
            trigger={
              <Button variant="ghost" size="sm" aria-label={`删除 ${item.filename}`}>
                <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
              </Button>
            }
            onConfirm={() => onDelete(item.id)}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} title="图片替代文本" onClose={() => setDialogOpen(false)}>
        <Field
          label="替代文本"
          htmlFor={`media-alt-${item.id}`}
          hint="供屏幕阅读器与图片加载失败时使用。"
        >
          <Input
            id={`media-alt-${item.id}`}
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="描述图片内容"
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>
            取消
          </Button>
          <Button size="sm" loading={saving} onClick={() => void handleSave()}>
            保存
          </Button>
        </div>
      </Dialog>
    </li>
  )
}
