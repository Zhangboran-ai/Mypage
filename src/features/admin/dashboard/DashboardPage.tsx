import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Dashboard } from '@shared'
import { FileText, FolderKanban, MessageSquare, PenLine, Wrench } from 'lucide-react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { formatDateTime } from '@/lib/format'
import { useSeo } from '@/hooks/use-seo'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const quickLinks = [
  { to: '/admin/posts/new', label: '写文章', icon: PenLine },
  { to: '/admin/projects/new', label: '新增项目', icon: FolderKanban },
  { to: '/admin/profile', label: '编辑资料', icon: FileText },
  { to: '/admin/media', label: '上传图片', icon: Wrench },
]

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => api.get<Dashboard>('/api/admin/dashboard'),
  })

  useSeo({ title: '仪表盘', noindex: true })

  const stats = [
    { label: '已发布文章', value: data?.stats.posts ?? 0, icon: FileText },
    { label: '草稿', value: data?.stats.drafts ?? 0, icon: PenLine },
    { label: '项目', value: data?.stats.projects ?? 0, icon: FolderKanban },
    { label: '技能', value: data?.stats.skills ?? 0, icon: Wrench },
    { label: '未读留言', value: data?.stats.unreadMessages ?? 0, icon: MessageSquare },
  ]

  return (
    <>
      <AdminPageHeader title="仪表盘" description="内容概览与最近更新的文章。" />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="仪表盘加载失败。" onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="glass-card p-4">
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  <p className="mt-3 text-2xl font-semibold text-text-primary">{item.value}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.label}</p>
                </div>
              )
            })}
          </div>

          <section className="mt-6 flex flex-wrap gap-2">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex h-9 items-center gap-2 rounded-btn border border-border-subtle px-3 text-sm text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </section>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">最近更新</h2>
              <Link to="/admin/posts" className="text-xs text-text-muted hover:text-text-primary">
                全部文章 →
              </Link>
            </div>

            {(data?.recentPosts.length ?? 0) === 0 ? (
              <EmptyState title="还没有文章" description="写第一篇吧。" />
            ) : (
              <ul className="divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle">
                {data?.recentPosts.map((post) => (
                  <li
                    key={post.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        className="block truncate text-sm text-text-primary hover:text-accent-strong"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatDateTime(post.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
