import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import {
  usePublicPosts,
  usePublicProfile,
  usePublicProjects,
  useSiteSettings,
} from '@/features/public/use-public-data'
import { useSeo } from '@/hooks/use-seo'
import { SectionHeading } from '@/components/common/SectionHeading'
import { SkillGroups } from '@/components/common/SkillGroups'
import { CopyButton } from '@/components/common/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { HeroSection } from './HeroSection'
import { ProjectCardItem } from '@/features/projects/ProjectCardItem'
import { PostCardItem } from '@/features/blog/PostCardItem'

export function HomePage() {
  const profileQuery = usePublicProfile()
  const settingsQuery = useSiteSettings()
  const projectsQuery = usePublicProjects({ featured: true, pageSize: 3 })
  const postsQuery = usePublicPosts({ pageSize: 3 })

  const settings = settingsQuery.data
  const siteName = settings?.siteName ?? '星屿 Astra'

  useSeo({
    siteName,
    description: settings?.siteDescription,
    image: settings?.defaultOgImage ?? profileQuery.data?.profile?.coverUrl ?? null,
  })

  const skills = profileQuery.data?.skillCategories.filter(
    (category) => category.skills.length > 0,
  )

  return (
    <>
      <HeroSection
        data={profileQuery.data}
        isLoading={profileQuery.isLoading}
        fallbackTitle={siteName}
      />

      <section className="container-page py-12" aria-labelledby="featured-projects">
        <SectionHeading
          id="featured-projects"
          title="精选项目"
          description="最近投入较多精力、可以代表当前能力的作品。"
          action={
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-accent-strong"
            >
              全部项目
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />

        {projectsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : projectsQuery.isError ? (
          <ErrorState message="项目加载失败。" onRetry={() => void projectsQuery.refetch()} />
        ) : (projectsQuery.data?.data.length ?? 0) === 0 ? (
          <EmptyState title="还没有精选项目" description="在后台把项目设为精选后会显示在这里。" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectsQuery.data?.data.map((project) => (
              <ProjectCardItem key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="container-page py-12" aria-labelledby="latest-posts">
        <SectionHeading
          id="latest-posts"
          title="最新文章"
          description="记录技术实践、阅读与日常思考。"
          action={
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-accent-strong"
            >
              全部文章
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />

        {postsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : postsQuery.isError ? (
          <ErrorState message="文章加载失败。" onRetry={() => void postsQuery.refetch()} />
        ) : (postsQuery.data?.data.length ?? 0) === 0 ? (
          <EmptyState title="还没有发布文章" description="发布后的文章会出现在这里。" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {postsQuery.data?.data.map((post) => (
              <PostCardItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="container-page py-12" aria-labelledby="skills">
        <SectionHeading
          id="skills"
          title="技能概览"
          description="日常工作中使用较多的技术方向。"
          action={
            <Link
              to="/about#skills"
              className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-accent-strong"
            >
              详细能力
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />

        {profileQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (skills?.length ?? 0) === 0 ? (
          <EmptyState title="还没有技能信息" description="可以在后台的技能管理中维护。" />
        ) : (
          <SkillGroups categories={skills ?? []} compact />
        )}
      </section>

      <section className="container-page py-12">
        <div className="glass-card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">一起做点有意思的事</h2>
            <p className="mt-2 max-w-xl text-sm text-text-secondary">
              如果对我的项目或文章感兴趣，欢迎通过邮件联系；也可以通过页脚的社交链接找到我。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {profileQuery.data?.profile?.publicEmail ? (
              <>
                <a
                  href={`mailto:${profileQuery.data.profile.publicEmail}`}
                  className="inline-flex h-10 items-center gap-2 rounded-btn bg-accent px-4 text-sm font-medium text-[#0A0D16] transition-colors hover:bg-accent-strong"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  发送邮件
                </a>
                <CopyButton value={profileQuery.data.profile.publicEmail} label="复制邮箱" />
              </>
            ) : (
              <Link
                to="/contact"
                className="inline-flex h-10 items-center rounded-btn border border-border-strong px-4 text-sm text-text-primary transition-colors hover:bg-white/[0.06]"
              >
                前往联系页
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
