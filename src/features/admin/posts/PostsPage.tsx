import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS, type ContentStatus, type Paginated, type PostListItem } from '@shared'
import { api, toQueryString } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { formatDateTime } from '@/lib/format'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'

const PAGE_SIZE = 12

export function PostsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  const push = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.posts({ page, pageSize: PAGE_SIZE, status, q }),
    queryFn: () =>
      api.get<Paginated<PostListItem>>(
        `/api/admin/posts${toQueryString({
          page,
          pageSize: PAGE_SIZE,
          status: status || undefined,
          q: q || undefined,
        })}`,
      ),
  })

  useSeo({ title: '文章管理', noindex: true })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['public', 'posts'] }),
    ])
  }

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean }>(`/api/admin/posts/${id}/publish`, {}),
    onSuccess: async () => {
      push('文章已发布')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean }>(`/api/admin/posts/${id}/unpublish`, {}),
    onSuccess: async () => {
      push('文章已转为草稿')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/posts/${id}`),
    onSuccess: async () => {
      push('文章已删除')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setParam('q', keyword.trim() || null)
  }

  const posts = data?.data ?? []

  return (
    <>
      <AdminPageHeader
        title="文章"
        description="草稿不会出现在前台；定时发布由服务端按时间判断。"
        actions={
          <Link
            to="/admin/posts/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-sm font-medium text-[#0A0D16] transition-colors hover:bg-accent-strong"
          >
            <Plus className="size-4" aria-hidden="true" />
            写文章
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1" role="search">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <label htmlFor="admin-post-search" className="sr-only">
            搜索文章
          </label>
          <Input
            id="admin-post-search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题或摘要"
            className="pl-9"
          />
        </form>

        <label htmlFor="admin-post-status" className="sr-only">
          状态筛选
        </label>
        <Select
          id="admin-post-status"
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
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="文章加载失败。" onRetry={() => void refetch()} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="没有文章"
          description="写第一篇，或者调整筛选条件。"
          action={
            <Link
              to="/admin/posts/new"
              className="inline-flex h-9 items-center rounded-btn bg-accent px-3 text-sm font-medium text-[#0A0D16]"
            >
              写文章
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border-subtle">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-white/[0.03] text-left text-xs text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">标题</th>
                <th scope="col" className="px-4 py-3 font-medium">状态</th>
                <th scope="col" className="px-4 py-3 font-medium">标签</th>
                <th scope="col" className="px-4 py-3 font-medium">更新时间</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="max-w-xs px-4 py-3">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="block truncate text-text-primary hover:text-accent-strong"
                    >
                      {post.title}
                    </Link>
                    <p className="truncate text-xs text-text-muted">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag.id} tone="muted">
                          {tag.name}
                        </Badge>
                      ))}
                      {post.tags.length > 2 ? (
                        <span className="text-xs text-text-muted">+{post.tags.length - 2}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-text-muted">
                    {formatDateTime(post.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === 'PUBLISHED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unpublishMutation.mutate(post.id)}
                          aria-label={`撤回 ${post.title}`}
                        >
                          <EyeOff className="size-3.5" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => publishMutation.mutate(post.id)}
                          aria-label={`发布 ${post.title}`}
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        aria-label={`编辑 ${post.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-btn text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Link>
                      <ConfirmDialog
                        title="删除文章"
                        description={`确定删除「${post.title}」吗？删除后前台不再展示。`}
                        trigger={
                          <Button variant="ghost" size="sm" aria-label={`删除 ${post.title}`}>
                            <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                          </Button>
                        }
                        onConfirm={async () => {
                          await deleteMutation.mutateAsync(post.id)
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

      {data ? (
        <Pagination
          meta={data.meta}
          onPageChange={(nextPage) => setParam('page', String(nextPage))}
        />
      ) : null}
    </>
  )
}
