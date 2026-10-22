import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { skillInputSchema, type Skill, type SkillCategory } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type SkillDialogProps = {
  open: boolean
  skill: Skill | null
  categories: SkillCategory[]
  defaultCategoryId: string
  onClose: () => void
}

export function SkillDialog({
  open,
  skill,
  categories,
  defaultCategoryId,
  onClose,
}: SkillDialogProps) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [level, setLevel] = useState(60)
  const [levelLabel, setLevelLabel] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState('')
  const push = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!open) return
    setCategoryId(skill?.categoryId ?? defaultCategoryId)
    setName(skill?.name ?? '')
    setIcon(skill?.icon ?? '')
    setLevel(skill?.level ?? 60)
    setLevelLabel(skill?.levelLabel ?? '')
    setSortOrder(skill?.sortOrder ?? 0)
    setVisible(skill?.visible ?? true)
    setError('')
  }, [open, skill, defaultCategoryId])

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      skill
        ? api.put<Skill>(`/api/admin/skills/${skill.id}`, payload)
        : api.post<Skill>('/api/admin/skills', payload),
    onSuccess: async () => {
      push(skill ? '技能已更新' : '技能已添加')
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
    const parsed = skillInputSchema.safeParse({
      categoryId,
      name,
      icon: icon.trim() || null,
      level,
      levelLabel: levelLabel.trim() || null,
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
    <Dialog open={open} title={skill ? '编辑技能' : '新增技能'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="所属分类" htmlFor="skill-category" required>
          <Select
            id="skill-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="技能名" htmlFor="skill-name" required>
            <Input
              id="skill-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="React"
            />
          </Field>
          <Field label="图标（emoji 或文字）" htmlFor="skill-icon">
            <Input
              id="skill-icon"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="⚛️"
            />
          </Field>
          <Field label="熟练度（0-100）" htmlFor="skill-level">
            <Input
              id="skill-level"
              type="number"
              min={0}
              max={100}
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
            />
          </Field>
          <Field label="等级文案" htmlFor="skill-level-label" hint="留空显示百分比。">
            <Input
              id="skill-level-label"
              value={levelLabel}
              onChange={(event) => setLevelLabel(event.target.value)}
              placeholder="熟练"
            />
          </Field>
          <Field label="排序" htmlFor="skill-order">
            <Input
              id="skill-order"
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
