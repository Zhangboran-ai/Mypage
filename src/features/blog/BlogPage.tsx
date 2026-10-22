import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { usePublicPosts, usePublicTags } from '@/features/public/use-public-data'
import { useSeo } from '@/hooks/use-seo'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { PostCardItem } from './PostCardItem'

const PAGE_SIZE = 10

export function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const tag = searchParams.get('tag') ?? ''
  const q = searchParams.get('q') ?? ''
  const [keyword, setKeyword] = useState(q)

  useEffect(() => {
    setKeyword(q)
  }, [q])

  const postsQuery = usePublicPosts({ page, pageSize: PAGE_SIZE, tag: tag || undefined, q: q || undefined })
  const tagsQuery = usePublicTags()

  useSeo({
    title: '博客',
    description: '技术实践、阅读笔记与日常思考。',
  })

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateParam('q', keyword.trim() || null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="博客"
        description="写下来的技术、产品与生活，让想法有迹可循。"
      />

      <div className="container-page pb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => updateParam('tag', null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                tag === ''
                  ? 'border-accent/40 bg-accent-soft text-accent-strong'
                  : 'border-border-subtle text-text-secondary hover:text-text-primary',
              )}
            >
              全部
            </button>
            {(tagsQuery.data ?? [])
              .filter((item) => item.count > 0)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateParam('tag', item.slug)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    tag === item.slug
                      ? 'border-accent/40 bg-accent-soft text-accent-strong'
                      : 'border-border-subtle text-text-secondary hover:text-text-primary',
                  )}
                >
                  {item.name}
                  <span className="ml-1 text-text-muted">{item.count}</span>
                </button>
              ))}
          </div>

          <form onSubmit={handleSearch} className="flex w-full items-center gap-2 sm:w-72" role="search">
            <label htmlFor="post-search" className="sr-only">
              搜索文章
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <Input
                id="post-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索标题或摘要"
                className="pl-9"
              />
              {keyword ? (
                <button
                  type="button"
                  aria-label="清除搜索"
                  onClick={() => {
                    setKeyword('')
                    updateParam('q', null)
                  }}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-10">
              搜索
            </Button>
          </form>
        </div>

        {postsQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        ) : postsQuery.isError ? (
          <ErrorState message="文章列表加载失败。" onRetry={() => void postsQuery.refetch()} />
        ) : (postsQuery.data?.data.length ?? 0) === 0 ? (
          <EmptyState
            title={q || tag ? '没有找到匹配的文章' : '还没有发布文章'}
            description={q || tag ? '换个关键词或标签试试。' : '后台发布文章后会显示在这里。'}
          />
        ) : (
          <>
            <div className="grid gap-4">
              {postsQuery.data?.data.map((post) => (
                <PostCardItem key={post.id} post={post} />
              ))}
            </div>

            {postsQuery.data ? (
              <Pagination
                meta={postsQuery.data.meta}
                onPageChange={(nextPage) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(nextPage))
                  setSearchParams(next)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
