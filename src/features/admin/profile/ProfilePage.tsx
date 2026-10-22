import { useQuery } from '@tanstack/react-query'
import type { Experience, Profile, SkillCategory, SocialLink } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useSeo } from '@/hooks/use-seo'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ProfileBasicForm } from './ProfileBasicForm'
import { SocialLinksSection } from './SocialLinksSection'
import { ExperiencesSection } from './ExperiencesSection'

type AdminProfileBundle = {
  profile: Profile
  socialLinks: SocialLink[]
  experiences: Experience[]
  skillCategories: SkillCategory[]
}

export function ProfilePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: () => api.get<AdminProfileBundle>('/api/admin/profile'),
  })

  useSeo({ title: '个人信息', noindex: true })

  return (
    <>
      <AdminPageHeader
        title="个人信息"
        description="这些内容会直接展示在前台的首页、关于页与页脚。"
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !data ? (
        <ErrorState message="个人信息加载失败。" onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-5">
          <ProfileBasicForm profile={data.profile} />
          <SocialLinksSection links={data.socialLinks} />
          <ExperiencesSection experiences={data.experiences} />
        </div>
      )}
    </>
  )
}
