import { useQuery } from '@tanstack/react-query'
import type {
  Paginated,
  PostDetail,
  PostListItem,
  ProjectCard,
  ProjectDetail,
  PublicProfile,
  SiteSettings,
  TagWithCount,
} from '@shared'
import { api, toQueryString } from '@/lib/api'
import { queryKeys } from '@/lib/query'

type PostParams = { page?: number; pageSize?: number; q?: string; tag?: string }
type ProjectParams = { page?: number; pageSize?: number; featured?: boolean; tech?: string }

export function usePublicProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<PublicProfile>('/api/public/profile'),
    staleTime: 5 * 60_000,
  })
}

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.get<SiteSettings>('/api/public/settings'),
    staleTime: 5 * 60_000,
  })
}

export function usePublicTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => api.get<TagWithCount[]>('/api/public/tags'),
    staleTime: 5 * 60_000,
  })
}

export function usePublicProjects(params: ProjectParams) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () =>
      api.get<Paginated<ProjectCard>>(`/api/public/projects${toQueryString(params)}`),
    staleTime: 60_000,
  })
}

export function usePublicProject(slug: string) {
  return useQuery({
    queryKey: queryKeys.project(slug),
    queryFn: () => api.get<ProjectDetail>(`/api/public/projects/${slug}`),
    staleTime: 60_000,
    enabled: Boolean(slug),
  })
}

export function usePublicPosts(params: PostParams) {
  return useQuery({
    queryKey: queryKeys.posts(params),
    queryFn: () => api.get<Paginated<PostListItem>>(`/api/public/posts${toQueryString(params)}`),
    staleTime: 60_000,
  })
}

export function usePublicPost(slug: string) {
  return useQuery({
    queryKey: queryKeys.post(slug),
    queryFn: () => api.get<PostDetail>(`/api/public/posts/${slug}`),
    staleTime: 60_000,
    enabled: Boolean(slug),
  })
}
