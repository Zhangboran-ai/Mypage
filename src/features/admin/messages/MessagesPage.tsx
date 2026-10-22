import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MailOpen, Trash2 } from 'lucide-react'
import type { Message, Paginated } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { formatDateTime } from '@/lib/format'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'

const PAGE_SIZE = 12

export function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const push = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.messages({ page, pageSize: PAGE_SIZE }),
    queryFn: () =>
      api.get<Paginated<Message>>(`/api/admin/messages?page=${page}&pageSize=${PAGE_SIZE}`),
  })

  useSeo({ title: '留言管理', noindex: true })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
    ])
  }

  const readMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      api.patch<Message>(`/api/admin/messages/${id}`, { read }),
    onSuccess: refresh,
    onError: (error: Error) => push(error.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/messages/${id}`),
    onSuccess: async () => {
      push('留言已删除')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const messages = data?.data ?? []

  return (
    <>
      <AdminPageHeader
        title="留言"
        description="来自前台联系表单的留言；未读条目会标红。"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="留言加载失败。" onRetry={() => void refetch()} />
      ) : messages.length === 0 ? (
        <EmptyState
          title="还没有留言"
          description="访客在前台联系页提交后会出现在这里。"
          action={
            <Link
              to="/contact"
              className="inline-flex h-9 items-center rounded-btn border border-border-strong px-3 text-sm text-text-primary"
            >
              查看联系页
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={
                message.read
                  ? 'glass-card p-5'
                  : 'glass-card border-accent/30 p-5 shadow-glow'
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{message.name}</p>
                    {message.read ? (
                      <Badge tone="muted">已读</Badge>
                    ) : (
                      <Badge tone="accent">未读</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDateTime(message.createdAt)}
                    {message.email ? ` · ${message.email}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {message.email ? (
                    <a
                      href={`mailto:${message.email}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-btn px-2 text-xs text-text-secondary hover:bg-white/[0.06] hover:text-text-primary"
                    >
                      <Mail className="size-3.5" aria-hidden="true" />
                      回复
                    </a>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      readMutation.mutate({ id: message.id, read: !message.read })
                    }
                    aria-label={message.read ? '标记为未读' : '标记为已读'}
                  >
                    {message.read ? (
                      <Mail className="size-3.5" aria-hidden="true" />
                    ) : (
                      <MailOpen className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                  <ConfirmDialog
                    title="删除留言"
                    description={`确定删除「${message.name}」的留言吗？删除后无法恢复。`}
                    trigger={
                      <Button variant="ghost" size="sm" aria-label={`删除 ${message.name} 的留言`}>
                        <Trash2 className="size-3.5 text-danger" aria-hidden="true" />
                      </Button>
                    }
                    onConfirm={async () => {
                      await deleteMutation.mutateAsync(message.id)
                    }}
                  />
                </div>
              </div>

              <p className="mt-3 text-sm whitespace-pre-line text-text-secondary">
                {message.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      {data ? (
        <Pagination
          meta={data.meta}
          onPageChange={(next) => {
            const params = new URLSearchParams(searchParams)
            params.set('page', String(next))
            setSearchParams(params)
          }}
        />
      ) : null}
    </>
  )
}
