import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { Skill, SkillCategory } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SkillCategoryDialog } from './SkillCategoryDialog'
import { SkillDialog } from './SkillDialog'

export function SkillsPage() {
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean
    category: SkillCategory | null
  }>({ open: false, category: null })
  const [skillDialog, setSkillDialog] = useState<{
    open: boolean
    skill: Skill | null
    categoryId: string
  }>({ open: false, skill: null, categoryId: '' })
  const push = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.skills,
    queryFn: () => api.get<SkillCategory[]>('/api/admin/skills'),
  })

  useSeo({ title: '技能管理', noindex: true })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.skills }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
    ])
  }

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/skill-categories/${id}`),
    onSuccess: async () => {
      push('分类及其技能已删除')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const deleteSkill = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/skills/${id}`),
    onSuccess: async () => {
      push('技能已删除')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const categories = data ?? []

  return (
    <>
      <AdminPageHeader
        title="技能管理"
        description="分类与技能都支持排序与隐藏，前台顺序与这里的排序一致。"
        actions={
          <Button size="sm" onClick={() => setCategoryDialog({ open: true, category: null })}>
            <Plus className="size-3.5" aria-hidden="true" />
            新增分类
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="技能加载失败。" onRetry={() => void refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="还没有技能分类"
          description="先创建一个分类，例如「前端」或「工具」，再添加具体技能。"
        />
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <section key={category.id} className="glass-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-text-primary">{category.name}</h2>
                  <Badge tone="muted">排序 {category.sortOrder}</Badge>
                  {!category.visible ? <Badge tone="warning">已隐藏</Badge> : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSkillDialog({ open: true, skill: null, categoryId: category.id })}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    技能
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoryDialog({ open: true, category })}
                    aria-label={`编辑分类 ${category.name}`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Button>
                  <ConfirmDialog
                    title="删除分类"
                    description={`删除「${category.name}」会同时删除其中 ${category.skills.length} 个技能，确定继续吗？`}
                    trigger={
                      <Button variant="ghost" size="sm" aria-label={`删除分类 ${category.name}`}>
                        <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                      </Button>
                    }
                    onConfirm={async () => {
                      await deleteCategory.mutateAsync(category.id)
                    }}
                  />
                </div>
              </div>

              {category.skills.length === 0 ? (
                <p className="mt-4 text-sm text-text-muted">这个分类下还没有技能。</p>
              ) : (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {category.skills.map((skill) => (
                    <li
                      key={skill.id}
                      className="flex items-center justify-between gap-2 rounded-btn border border-border-subtle px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text-primary">
                          {skill.icon ? <span className="mr-1">{skill.icon}</span> : null}
                          {skill.name}
                          {!skill.visible ? (
                            <span className="ml-2 text-[11px] text-warning">隐藏</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-text-muted">
                          {skill.levelLabel ?? `${skill.level}%`} · 排序 {skill.sortOrder}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSkillDialog({ open: true, skill, categoryId: category.id })}
                          aria-label={`编辑技能 ${skill.name}`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </Button>
                        <ConfirmDialog
                          title="删除技能"
                          description={`确定删除「${skill.name}」吗？`}
                          trigger={
                            <Button variant="ghost" size="sm" aria-label={`删除技能 ${skill.name}`}>
                              <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                            </Button>
                          }
                          onConfirm={async () => {
                            await deleteSkill.mutateAsync(skill.id)
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <SkillCategoryDialog
        open={categoryDialog.open}
        category={categoryDialog.category}
        onClose={() => setCategoryDialog({ open: false, category: null })}
      />

      {categories.length > 0 ? (
        <SkillDialog
          open={skillDialog.open}
          skill={skillDialog.skill}
          categories={categories}
          defaultCategoryId={skillDialog.categoryId || categories[0].id}
          onClose={() => setSkillDialog({ open: false, skill: null, categoryId: '' })}
        />
      ) : null}
    </>
  )
}
