import { Briefcase, Mail, MapPin, Sparkles } from 'lucide-react'
import { usePublicProfile, useSiteSettings } from '@/features/public/use-public-data'
import { useSeo } from '@/hooks/use-seo'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeading } from '@/components/common/SectionHeading'
import { SkillGroups } from '@/components/common/SkillGroups'
import { SocialLinks } from '@/components/common/SocialLinks'
import { Markdown } from '@/lib/markdown'
import { formatMonth } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function AboutPage() {
  const { data, isLoading, isError, refetch } = usePublicProfile()
  const { data: settings } = useSiteSettings()
  const profile = data?.profile

  useSeo({
    title: '关于',
    description: profile?.headline ?? settings?.siteDescription,
    image: profile?.coverUrl ?? settings?.defaultOgImage ?? null,
  })

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-64 w-full" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container-page py-20">
        <ErrorState message="个人信息加载失败。" onRetry={() => void refetch()} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="还没有填写个人信息"
          description="登录后台的「个人信息」页面即可完善这里的内容。"
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={profile.displayName}
        description={profile.headline}
        action={<SocialLinks links={data?.socialLinks ?? []} />}
      />

      <div className="container-page grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="glass-card p-6 sm:p-8" aria-labelledby="about-bio">
          <h2 id="about-bio" className="sr-only">
            个人介绍
          </h2>
          {profile.bio.trim() ? (
            <Markdown content={profile.bio} />
          ) : (
            <p className="text-sm text-text-muted">这位朋友还没有写下自我介绍。</p>
          )}
        </section>

        <aside className="space-y-5">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold tracking-wide text-text-primary">基本信息</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {profile.fullName ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Sparkles className="size-4 text-text-muted" aria-hidden="true" />
                  <dt className="sr-only">姓名</dt>
                  <dd>{profile.fullName}</dd>
                </div>
              ) : null}
              {profile.location ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="size-4 text-text-muted" aria-hidden="true" />
                  <dt className="sr-only">所在地</dt>
                  <dd>{profile.location}</dd>
                </div>
              ) : null}
              {profile.publicEmail ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="size-4 text-text-muted" aria-hidden="true" />
                  <dt className="sr-only">邮箱</dt>
                  <dd>
                    <a href={`mailto:${profile.publicEmail}`} className="hover:text-accent-strong">
                      {profile.publicEmail}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              {profile.availability ? (
                <Badge tone="success">{profile.statusText || '开放合作机会'}</Badge>
              ) : profile.statusText ? (
                <Badge tone="muted">{profile.statusText}</Badge>
              ) : null}
              {profile.resumeUrl ? (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-strong underline underline-offset-4"
                >
                  查看简历
                </a>
              ) : null}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold tracking-wide text-text-primary">社交链接</h2>
            <div className="mt-4">
              <SocialLinks links={data?.socialLinks ?? []} />
            </div>
          </div>
        </aside>
      </div>

      <section id="skills" className="container-page scroll-mt-24 py-14">
        <SectionHeading title="技能" description="按分类整理的技术栈与熟练度。" />
        <SkillGroups categories={data?.skillCategories ?? []} />
      </section>

      <section className="container-page pb-16" aria-labelledby="experience">
        <SectionHeading title="经历" description="按时间整理的职业经历。" />
        {(data?.experiences.length ?? 0) === 0 ? (
          <EmptyState title="还没有添加经历" />
        ) : (
          <ol className="space-y-4">
            {data?.experiences.map((item) => (
              <li key={item.id} className="glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-accent" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-text-primary">{item.role}</h3>
                    <span className="text-sm text-text-secondary">@ {item.company}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {formatMonth(item.startDate)} — {formatMonth(item.endDate)}
                  </p>
                </div>
                {item.description ? (
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-text-secondary">
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}
