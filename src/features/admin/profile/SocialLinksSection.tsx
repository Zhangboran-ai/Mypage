import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { socialLinkInputSchema, type SocialLink } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '../components/ConfirmDialog'

type FormState = {
  platform: string
  label: string
  url: string
  icon: string
  sortOrder: number
  visible: boolean
}

const emptyForm: FormState = {
  platform: '',
  label: '',
  url: '',
  icon: '',
  sortOrder: 0,
  visible: true,
}

export function SocialLinksSection({ links }: { links: SocialLink[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SocialLink | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const push = useToast()
  const queryClient = useQueryClient()

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.profile }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing
        ? api.put<SocialLink>(`/api/admin/social-links/${editing.id}`, payload)
        : api.post<SocialLink>('/api/admin/social-links', payload),
    onSuccess: async () => {
      push(editing ? '社交链接已更新' : '社交链接已添加')
      setOpen(false)
      await refresh()
    },
    onError: (err: Error) => push(err.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/social-links/${id}`),
    onSuccess: async () => {
      push('社交链接已删除')
      await refresh()
    },
    onError: (err: Error) => push(err.message, 'error'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setOpen(true)
  }

  const openEdit = (link: SocialLink) => {
    setEditing(link)
    setForm({
      platform: link.platform,
      label: link.label,
      url: link.url,
      icon: link.icon ?? '',
      sortOrder: link.sortOrder,
      visible: link.visible,
    })
    setError('')
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = socialLinkInputSchema.safeParse({
      ...form,
      icon: form.icon.trim() || null,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请检查表单')
      return
    }

    saveMutation.mutate(parsed.data)
  }

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">社交链接</h2>
        <Button variant="secondary" size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          添加
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">还没有社交链接。</p>
      ) : (
        <ul className="mt-4 divide-y divide-border-subtle">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-text-primary">
                  {link.label}
                  <span className="ml-2 text-xs text-text-muted">{link.platform}</span>
                  {!link.visible ? <span className="ml-2 text-xs text-warning">已隐藏</span> : null}
                </p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-xs truncate text-xs text-text-muted hover:text-accent-strong"
                >
                  {link.url}
                </a>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(link)} aria-label={`编辑 ${link.label}`}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                </Button>
                <ConfirmDialog
                  title="删除社交链接"
                  description={`确定删除「${link.label}」吗？`}
                  trigger={
                    <Button variant="ghost" size="sm" aria-label={`删除 ${link.label}`}>
                      <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                    </Button>
                  }
                  onConfirm={async () => {
                    await deleteMutation.mutateAsync(link.id)
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        title={editing ? '编辑社交链接' : '添加社交链接'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="平台" htmlFor="social-platform" required>
            <Input
              id="social-platform"
              value={form.platform}
              onChange={(event) => setForm({ ...form, platform: event.target.value })}
              placeholder="github / x / email"
            />
          </Field>
          <Field label="展示名" htmlFor="social-label" required>
            <Input
              id="social-label"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
          </Field>
          <Field label="链接" htmlFor="social-url" required>
            <Input
              id="social-url"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="排序" htmlFor="social-order">
              <Input
                id="social-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2.5 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(event) => setForm({ ...form, visible: event.target.checked })}
                className="size-4 accent-[var(--accent)]"
              />
              前台展示
            </label>
          </div>
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" size="sm" loading={saveMutation.isPending}>
              保存
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}
