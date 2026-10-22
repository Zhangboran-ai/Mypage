import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { usePublicPost } from '@/features/public/use-public-data'
import { useSeo } from '@/hooks/use-seo'
import { ApiError } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { Markdown, extractToc } from '@/lib/markdown'
import { ReadingProgress } from '@/components/common/ReadingProgress'
import { TableOfContents } from '@/components/common/TableOfContents'
import { CopyButton } from '@/components/common/CopyButton'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = usePublicPost(slug)
  const toc = useMemo(() => (data?.content ? extractToc(data.content) : []), [data?.content])

  useSeo({
    title: data?.seoTitle ?? data?.title ?? '文章',
    description: data?.seoDescription ?? data?.summary,
    image: data?.ogImage ?? data?.coverUrl,
    type: 'article',
    jsonLd: data
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data.title,
          description: data.summary,
          image: data.ogImage ?? data.coverUrl ?? undefined,
          datePublished: data.publishedAt ?? undefined,
          dateModified: data.updatedAt,
          author: { '@type': 'Person', name: 'Astra' },
          mainEntityOfPage: window.location.href,
        }
      : null,
  })

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-5 h-10 w-3/4" />
        <Skeleton className="mt-4 h-4 w-1/2" />
        <Skeleton className="mt-10 h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    const isNotFound = error instanceof ApiError && error.status === 404

    return (
      <div className="container-page py-20">
        {isNotFound ? (
          <EmptyState
            title="文章不存在或尚未发布"
            description="它可能已被撤回，或者链接有误。"
            action={
              <Link to="/blog" className="text-sm text-accent-strong underline underline-offset-4">
                返回文章列表
              </Link>
            }
          />
        ) : (
          <ErrorState message="文章加载失败。" onRetry={() => void refetch()} />
        )}
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      <ReadingProgress />
      <article className="container-page py-12 sm:py-16">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          全部文章
        </Link>

        <header className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {data.tags.map((tag) => (
              <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                <Badge tone="accent">#{tag.name}</Badge>
              </Link>
            ))}
          </div>

          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance text-text-primary sm:text-4xl">
            {data.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <time dateTime={data.publishedAt ?? data.updatedAt}>{formatDate(data.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {data.readingTime} 分钟阅读
            </span>
            <span aria-hidden="true">·</span>
            <CopyButton value={window.location.href} label="复制链接" variant="ghost" size="sm" />
          </div>
        </header>

        {data.coverUrl ? (
          <img
            src={data.coverUrl}
            alt={`${data.title} 封面`}
            width={1200}
            height={630}
            className="mt-8 w-full rounded-card border border-border-subtle object-cover"
          />
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0 max-w-[72ch]">
            <Markdown content={data.content} />

            <nav aria-label="上下篇" className="mt-12 grid gap-3 border-t border-border-subtle pt-6 sm:grid-cols-2">
              {data.prev ? (
                <Link
                  to={`/blog/${data.prev.slug}`}
                  className="group rounded-card border border-border-subtle p-4 transition-colors hover:border-border-strong"
                >
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    <ArrowLeft className="size-3" aria-hidden="true" />
                    上一篇
                  </span>
                  <p className="mt-1 text-sm text-text-primary group-hover:text-accent-strong">
                    {data.prev.title}
                  </p>
                </Link>
              ) : (
                <span />
              )}
              {data.next ? (
                <Link
                  to={`/blog/${data.next.slug}`}
                  className="group rounded-card border border-border-subtle p-4 text-right transition-colors hover:border-border-strong"
                >
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    下一篇
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </span>
                  <p className="mt-1 text-sm text-text-primary group-hover:text-accent-strong">
                    {data.next.title}
                  </p>
                </Link>
              ) : null}
            </nav>

            {data.related.length > 0 ? (
              <section className="mt-12" aria-labelledby="related-posts">
                <h2 id="related-posts" className="text-sm font-semibold text-text-primary">
                  相关文章
                </h2>
                <ul className="mt-3 space-y-2">
                  {data.related.map((post) => (
                    <li key={post.id}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="block rounded-btn px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-white/[0.04] hover:text-text-primary"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside>
            <TableOfContents items={toc} />
          </aside>
        </div>
      </article>
    </>
  )
}
