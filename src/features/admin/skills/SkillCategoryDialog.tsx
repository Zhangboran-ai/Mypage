import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { skillCategoryInputSchema, type SkillCategory } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

type SkillCategoryDialogProps = {
  open: boolean
  category: SkillCategory | null
  onClose: () => void
}

export function SkillCategoryDialog({ open, category, onClose }: SkillCategoryDialogProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState('')
  const push = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setSlug(category?.slug ?? '')
    setSortOrder(category?.sortOrder ?? 0)
    setVisible(category?.visible ?? true)
    setError('')
  }, [open, category])

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      category
        ? api.put<SkillCategory>(`/api/admin/skill-categories/${category.id}`, payload)
        : api.post<SkillCategory>('/api/admin/skill-categories', payload),
    onSuccess: async () => {
      push(category ? '分类已更新' : '分类已创建')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.skills }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      ])
      onClose()
    },
    onError: (err: Error) => push(err.message, 'error'),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = skillCategoryInputSchema.safeParse({
      name,
      slug: slug.trim() || undefined,
      sortOrder,
      visible,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请检查表单')
      return
    }

    mutation.mutate(parsed.data)
  }

  return (
    <Dialog open={open} title={category ? '编辑分类' : '新增分类'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="分类名" htmlFor="skill-category-name" required>
          <Input
            id="skill-category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="前端 / 后端 / 工具"
          />
        </Field>
        <Field label="slug" htmlFor="skill-category-slug" hint="留空会根据分类名自动生成。">
          <Input
            id="skill-category-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="frontend"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="排序" htmlFor="skill-category-order">
            <Input
              id="skill-category-order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </Field>
          <label className="flex items-end gap-2 pb-2.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
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
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" size="sm" loading={mutation.isPending}>
            保存
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
