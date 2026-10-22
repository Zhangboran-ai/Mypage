import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { tagInputSchema, type TagWithCount } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function TagsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TagWithCount | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const push = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.tags,
    queryFn: () => api.get<TagWithCount[]>('/api/admin/tags'),
  })

  useSeo({ title: '标签管理', noindex: true })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tags }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tags }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; slug?: string }) =>
      editing
        ? api.put<TagWithCount>(`/api/admin/tags/${editing.id}`, payload)
        : api.post<TagWithCount>('/api/admin/tags', payload),
    onSuccess: async () => {
      push(editing ? '标签已更新' : '标签已创建')
      setOpen(false)
      await refresh()
    },
    onError: (err: Error) => push(err.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/tags/${id}`),
    onSuccess: async () => {
      push('标签已删除')
      await refresh()
    },
    onError: (err: Error) => push(err.message, 'error'),
  })

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSlug('')
    setError('')
    setOpen(true)
  }

  const openEdit = (tag: TagWithCount) => {
    setEditing(tag)
    setName(tag.name)
    setSlug(tag.slug)
    setError('')
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = tagInputSchema.safeParse({ name, slug: slug.trim() || undefined })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请检查表单')
      return
    }

    saveMutation.mutate(parsed.data)
  }

  const tags = data ?? []

  return (
    <>
      <AdminPageHeader
        title="标签管理"
        description="标签用于文章分类与前台筛选。"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" aria-hidden="true" />
            新增标签
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState message="标签加载失败。" onRetry={() => void refetch()} />
      ) : tags.length === 0 ? (
        <EmptyState title="还没有标签" description="创建标签后可以在文章编辑器里选择。" />
      ) : (
        <div className="overflow-hidden rounded-card border border-border-subtle">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">名称</th>
                <th scope="col" className="px-4 py-3 font-medium">slug</th>
                <th scope="col" className="px-4 py-3 font-medium">文章数</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-4 py-3 text-text-primary">{tag.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{tag.slug}</td>
                  <td className="px-4 py-3 text-text-secondary">{tag.count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(tag)}
                        aria-label={`编辑标签 ${tag.name}`}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Button>
                      <ConfirmDialog
                        title="删除标签"
                        description={`删除「${tag.name}」后，文章上的该标签会同时移除。`}
                        trigger={
                          <Button variant="ghost" size="sm" aria-label={`删除标签 ${tag.name}`}>
                            <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                          </Button>
                        }
                        onConfirm={async () => {
                          await deleteMutation.mutateAsync(tag.id)
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} title={editing ? '编辑标签' : '新增标签'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="名称" htmlFor="tag-name" required>
            <Input
              id="tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="前端"
            />
          </Field>
          <Field label="slug" htmlFor="tag-slug" hint="留空会根据名称自动生成。">
            <Input
              id="tag-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="frontend"
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
    </>
  )
}
