import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import type { Tag } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type TagSelectorProps = {
  tags: Tag[]
  selected: string[]
  onChange: (tagIds: string[]) => void
}

export function TagSelector({ tags, selected, onChange }: TagSelectorProps) {
  const [newTag, setNewTag] = useState('')
  const [creating, setCreating] = useState(false)
  const push = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<Tag>('/api/admin/tags', { name }),
    onSuccess: async (tag) => {
      push(`标签「${tag.name}」已创建`)
      onChange([...selected, tag.id])
      setNewTag('')
      setCreating(false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.tags })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags })
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-secondary">标签</p>

      {tags.length === 0 ? (
        <p className="text-xs text-text-muted">还没有标签，可以直接在下面新建。</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = selected.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(tag.id)}
                className={
                  active
                    ? 'rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong'
                    : 'rounded-full border border-border-subtle px-2.5 py-0.5 text-xs text-text-secondary hover:text-text-primary'
                }
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}

      {creating ? (
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor="new-tag-name" className="sr-only">
            新标签名称
          </label>
          <Input
            id="new-tag-name"
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
            placeholder="新标签名称"
            className="h-9"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                if (newTag.trim()) createMutation.mutate(newTag.trim())
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            loading={createMutation.isPending}
            onClick={() => newTag.trim() && createMutation.mutate(newTag.trim())}
          >
            创建
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
            取消
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent-strong"
        >
          <Plus className="size-3" aria-hidden="true" />
          新建标签
        </button>
      )}
    </div>
  )
}
