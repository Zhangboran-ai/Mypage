import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Star } from 'lucide-react'
import { usePublicProjects } from '@/features/public/use-public-data'
import { useSeo } from '@/hooks/use-seo'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { ProjectCardItem } from './ProjectCardItem'

const PAGE_SIZE = 9

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const tech = searchParams.get('tech') ?? ''
  const featured = searchParams.get('featured') === 'true'

  const projectsQuery = usePublicProjects({
    page,
    pageSize: PAGE_SIZE,
    tech: tech || undefined,
    featured: featured ? true : undefined,
  })
  const allProjectsQuery = usePublicProjects({ page: 1, pageSize: 50 })

  useSeo({
    title: '项目',
    description: '作品集：我参与和独立完成的项目，包含使用的技术栈与在线地址。',
  })

  const techOptions = Array.from(
    new Map(
      (allProjectsQuery.data?.data ?? []).flatMap((project) =>
        project.techTags.map((tag) => [tag.slug, tag] as const),
      ),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="项目"
        description="记录做过的产品、工具与实验，点击卡片查看完整介绍。"
      />

      <div className="container-page pb-16">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-text-muted">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            筛选
          </span>

          <button
            type="button"
            onClick={() => updateParam('tech', null)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              tech === ''
                ? 'border-accent/40 bg-accent-soft text-accent-strong'
                : 'border-border-subtle text-text-secondary hover:text-text-primary',
            )}
          >
            全部
          </button>

          {techOptions.map((option) => (
            <button
              key={option.slug}
              type="button"
              onClick={() => updateParam('tech', option.slug)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                tech === option.slug
                  ? 'border-accent/40 bg-accent-soft text-accent-strong'
                  : 'border-border-subtle text-text-secondary hover:text-text-primary',
              )}
            >
              {option.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => updateParam('featured', featured ? null : 'true')}
            aria-pressed={featured}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors',
              featured
                ? 'border-accent/40 bg-accent-soft text-accent-strong'
                : 'border-border-subtle text-text-secondary hover:text-text-primary',
            )}
          >
            <Star className="size-3" aria-hidden="true" />
            仅看精选
          </button>
        </div>

        {projectsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : projectsQuery.isError ? (
          <ErrorState message="项目列表加载失败。" onRetry={() => void projectsQuery.refetch()} />
        ) : (projectsQuery.data?.data.length ?? 0) === 0 ? (
          <EmptyState
            title="没有匹配的项目"
            description="试试切换筛选条件，或者稍后再来看看。"
            action={
              <Button variant="secondary" size="sm" onClick={() => setSearchParams({})}>
                清除筛选
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projectsQuery.data?.data.map((project) => (
                <ProjectCardItem key={project.id} project={project} />
              ))}
            </div>

            {projectsQuery.data ? (
              <Pagination
                meta={projectsQuery.data.meta}
                onPageChange={(nextPage) => updateParam('page', String(nextPage))}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
