import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, ExternalLink, Github, UserRound } from 'lucide-react'
import { usePublicProject } from '@/features/public/use-public-data'
import { useSeo } from '@/hooks/use-seo'
import { ApiError } from '@/lib/api'
import { formatMonth } from '@/lib/format'
import { Markdown } from '@/lib/markdown'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = usePublicProject(slug)

  useSeo({
    title: data?.seoTitle ?? data?.title ?? '项目',
    description: data?.seoDescription ?? data?.summary,
    image: data?.coverUrl,
    type: 'article',
  })

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-5 h-10 w-2/3" />
        <Skeleton className="mt-6 aspect-[16/8] w-full" />
      </div>
    )
  }

  if (isError) {
    const isNotFound = error instanceof ApiError && error.status === 404

    return (
      <div className="container-page py-20">
        {isNotFound ? (
          <EmptyState
            title="项目不存在或尚未发布"
            description="它可能已经下架，或者链接有误。"
            action={
              <Link to="/projects" className="text-sm text-accent-strong underline underline-offset-4">
                返回项目列表
              </Link>
            }
          />
        ) : (
          <ErrorState message="项目加载失败。" onRetry={() => void refetch()} />
        )}
      </div>
    )
  }

  if (!data) return null

  return (
    <article className="container-page py-14 sm:py-20">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        全部项目
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          {data.featured ? <Badge tone="accent">精选</Badge> : null}
          {data.techTags.map((tag) => (
            <Badge key={tag.id} tone="muted">
              {tag.name}
            </Badge>
          ))}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-text-primary sm:text-4xl">
          {data.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-secondary">{data.summary}</p>

        <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted">
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            <dt className="sr-only">时间</dt>
            <dd>
              {formatMonth(data.startDate)} — {formatMonth(data.endDate)}
            </dd>
          </div>
          {data.role ? (
            <div className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5" aria-hidden="true" />
              <dt className="sr-only">角色</dt>
              <dd>{data.role}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {data.demoUrl ? (
            <a
              href={data.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-btn bg-accent px-4 text-sm font-medium text-[#0A0D16] transition-colors hover:bg-accent-strong"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              在线预览
            </a>
          ) : null}
          {data.repoUrl ? (
            <a
              href={data.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-btn border border-border-strong px-4 text-sm text-text-primary transition-colors hover:bg-white/[0.06]"
            >
              <Github className="size-4" aria-hidden="true" />
              源代码
            </a>
          ) : null}
        </div>
      </header>

      {data.coverUrl ? (
        <img
          src={data.coverUrl}
          alt={`${data.title} 封面`}
          width={1200}
          height={640}
          className="mt-10 w-full rounded-card border border-border-subtle object-cover"
        />
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          {data.content ? (
            <Markdown content={data.content} />
          ) : (
            <p className="text-sm text-text-muted">这个项目还没有补充详细介绍。</p>
          )}
        </div>

        {data.images.length > 0 ? (
          <aside aria-label="项目截图" className="space-y-3">
            {data.images.map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={image.alt ?? `${data.title} 截图`}
                loading="lazy"
                className="w-full rounded-card border border-border-subtle"
              />
            ))}
          </aside>
        ) : null}
      </div>
    </article>
  )
}
