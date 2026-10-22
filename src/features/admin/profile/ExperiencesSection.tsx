import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { experienceInputSchema, type Experience } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { fromDatetimeLocal, formatMonth, toDatetimeLocal } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '../components/ConfirmDialog'

type FormState = {
  company: string
  role: string
  startDate: string
  endDate: string
  description: string
  sortOrder: number
}

const emptyForm: FormState = {
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  description: '',
  sortOrder: 0,
}

export function ExperiencesSection({ experiences }: { experiences: Experience[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Experience | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const push = useToast()
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.profile })
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing
        ? api.put<Experience>(`/api/admin/experiences/${editing.id}`, payload)
        : api.post<Experience>('/api/admin/experiences', payload),
    onSuccess: async () => {
      push(editing ? '履历已更新' : '履历已添加')
      setOpen(false)
      await refresh()
    },
    onError: (err: Error) => push(err.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/experiences/${id}`),
    onSuccess: async () => {
      push('履历已删除')
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

  const openEdit = (item: Experience) => {
    setEditing(item)
    setForm({
      company: item.company,
      role: item.role,
      startDate: toDatetimeLocal(item.startDate),
      endDate: toDatetimeLocal(item.endDate),
      description: item.description ?? '',
      sortOrder: item.sortOrder,
    })
    setError('')
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = experienceInputSchema.safeParse({
      company: form.company,
      role: form.role,
      startDate: fromDatetimeLocal(form.startDate),
      endDate: fromDatetimeLocal(form.endDate),
      description: form.description.trim() || null,
      sortOrder: form.sortOrder,
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
        <h2 className="text-sm font-semibold text-text-primary">履历</h2>
        <Button variant="secondary" size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          添加
        </Button>
      </div>

      {experiences.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">还没有添加履历。</p>
      ) : (
        <ul className="mt-4 divide-y divide-border-subtle">
          {experiences.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-text-primary">
                  {item.role} · {item.company}
                </p>
                <p className="text-xs text-text-muted">
                  {formatMonth(item.startDate)} — {formatMonth(item.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(item)}
                  aria-label={`编辑 ${item.company}`}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </Button>
                <ConfirmDialog
                  title="删除履历"
                  description={`确定删除「${item.company}」这段经历吗？`}
                  trigger={
                    <Button variant="ghost" size="sm" aria-label={`删除 ${item.company}`}>
                      <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                    </Button>
                  }
                  onConfirm={async () => {
                    await deleteMutation.mutateAsync(item.id)
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} title={editing ? '编辑履历' : '添加履历'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="公司" htmlFor="exp-company" required>
              <Input
                id="exp-company"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
              />
            </Field>
            <Field label="角色" htmlFor="exp-role" required>
              <Input
                id="exp-role"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              />
            </Field>
            <Field label="开始时间" htmlFor="exp-start" required>
              <Input
                id="exp-start"
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </Field>
            <Field label="结束时间" htmlFor="exp-end" hint="留空表示至今。">
              <Input
                id="exp-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </Field>
          </div>
          <Field label="描述" htmlFor="exp-description">
            <Textarea
              id="exp-description"
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="排序" htmlFor="exp-order">
            <Input
              id="exp-order"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
          </Field>
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
