import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, MapPin } from 'lucide-react'
import type { PublicProfile } from '@shared'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { SocialLinks } from '@/components/common/SocialLinks'

type HeroSectionProps = {
  data?: PublicProfile
  isLoading: boolean
  fallbackTitle: string
}

export function HeroSection({ data, isLoading, fallbackTitle }: HeroSectionProps) {
  const profile = data?.profile

  if (isLoading) {
    return (
      <section className="container-page pt-16 pb-12 sm:pt-24">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-6 h-12 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        <Skeleton className="mt-3 h-5 w-2/3 max-w-md" />
      </section>
    )
  }

  const title = profile?.heroTitle || profile?.displayName || fallbackTitle
  const subtitle =
    profile?.heroSubtitle ||
    profile?.headline ||
    '这里记录我的作品、文章与正在思考的事情。'

  return (
    <section className="container-page pt-16 pb-14 sm:pt-24 sm:pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl animate-fade-up">
          <div className="flex flex-wrap items-center gap-3">
            {profile?.availability ? (
              <Badge tone="success">{profile.statusText || '开放合作机会'}</Badge>
            ) : profile?.statusText ? (
              <Badge tone="muted">{profile.statusText}</Badge>
            ) : null}
            {profile?.location ? (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="size-3.5" aria-hidden="true" />
                {profile.location}
              </span>
            ) : null}
          </div>

          <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight text-balance text-text-primary sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/projects">
              <Button>
                查看项目
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link
              to="/blog"
              className="inline-flex h-11 items-center gap-2 rounded-btn border border-border-strong bg-white/[0.04] px-5 text-sm text-text-primary transition-colors hover:bg-white/[0.08]"
            >
              阅读博客
              <ArrowDownRight className="size-4" aria-hidden="true" />
            </Link>
            <SocialLinks links={data?.socialLinks ?? []} />
          </div>
        </div>

        <div className="relative shrink-0 self-start lg:self-auto">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-full bg-accent/10 blur-2xl"
          />
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.displayName} 的头像`}
              width={224}
              height={224}
              className="relative size-40 rounded-full border border-border-strong object-cover sm:size-52"
            />
          ) : (
            <div className="relative flex size-40 items-center justify-center rounded-full border border-accent/20 bg-bg-card text-4xl font-semibold text-accent-strong sm:size-52 sm:text-5xl">
              {(profile?.displayName || fallbackTitle).slice(0, 1)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
