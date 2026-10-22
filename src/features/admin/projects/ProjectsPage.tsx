import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
  type Paginated,
  type ProjectCard,
} from '@shared'
import { api, toQueryString } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ProjectTable } from './ProjectTable'

const PAGE_SIZE = 12

type ReorderItem = { id: string; sortOrder: number }

function buildReorderItems(
  projects: ProjectCard[],
  index: number,
  direction: -1 | 1,
): ReorderItem[] {
  const current = projects[index]
  const neighbor = projects[index + direction]
  if (!current || !neighbor) return []

  const low = Math.min(current.sortOrder, neighbor.sortOrder)
  const high = Math.max(current.sortOrder, neighbor.sortOrder)

  if (low === high) {
    return [
      { id: current.id, sortOrder: direction < 0 ? Math.max(0, low - 1) : high + 1 },
      { id: neighbor.id, sortOrder: low },
    ]
  }

  return [
    { id: current.id, sortOrder: neighbor.sortOrder },
    { id: neighbor.id, sortOrder: current.sortOrder },
  ]
}

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  const push = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.projects({ page, pageSize: PAGE_SIZE, status, q }),
    queryFn: () =>
      api.get<Paginated<ProjectCard>>(
        `/api/admin/projects${toQueryString({
          page,
          pageSize: PAGE_SIZE,
          status: status || undefined,
          q: q || undefined,
        })}`,
      ),
  })

  useSeo({ title: '项目管理', noindex: true })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['public', 'projects'] }),
    ])
  }

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/projects/${id}`),
    onSuccess: async () => {
      push('项目已删除')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const reorderMutation = useMutation({
    mutationFn: (items: ReorderItem[]) =>
      api.put<{ ok: boolean }>('/api/admin/projects/reorder', { items }),
    onSuccess: refresh,
    onError: (error: Error) => push(error.message, 'error'),
  })

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setParam('q', keyword.trim() || null)
  }

  const projects = data?.data ?? []
  const canReorder = !q && !status

  return (
    <>
      <AdminPageHeader
        title="项目"
        description="排序值越小越靠前；草稿与定时项目不会出现在前台。"
        actions={
          <Link
            to="/admin/projects/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-sm font-medium text-[#0A0D16] transition-colors hover:bg-accent-strong"
          >
            <Plus className="size-4" aria-hidden="true" />
            新增项目
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1" role="search">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <label htmlFor="admin-project-search" className="sr-only">
            搜索项目
          </label>
          <Input
            id="admin-project-search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题或简介"
            className="pl-9"
          />
        </form>

        <label htmlFor="admin-project-status" className="sr-only">
          状态筛选
        </label>
        <Select
          id="admin-project-status"
          value={status}
          onChange={(event) => setParam('status', event.target.value || null)}
          className="sm:w-40"
        >
          <option value="">全部状态</option>
          {CONTENT_STATUSES.map((item: ContentStatus) => (
            <option key={item} value={item}>
              {CONTENT_STATUS_LABELS[item]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="项目加载失败。" onRetry={() => void refetch()} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="没有项目"
          description="添加第一个项目，或调整筛选条件。"
          action={
            <Link
              to="/admin/projects/new"
              className="inline-flex h-9 items-center rounded-btn bg-accent px-3 text-sm font-medium text-[#0A0D16]"
            >
              新增项目
            </Link>
          }
        />
      ) : (
        <ProjectTable
          projects={projects}
          canReorder={canReorder}
          onMove={(index, direction) => {
            const items = buildReorderItems(projects, index, direction)
            if (items.length > 0) reorderMutation.mutate(items)
          }}
          onDelete={async (id) => {
            await deleteMutation.mutateAsync(id)
          }}
        />
      )}

      {data ? (
        <Pagination meta={data.meta} onPageChange={(next) => setParam('page', String(next))} />
      ) : null}
    </>
  )
}
