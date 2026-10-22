type PostParams = { page?: number; pageSize?: number; q?: string; tag?: string; status?: string }
type ProjectParams = { page?: number; pageSize?: number; featured?: boolean; tech?: string }

export const queryKeys = {
  profile: ['public', 'profile'] as const,
  settings: ['public', 'settings'] as const,
  tags: ['public', 'tags'] as const,
  posts: (params: PostParams) => ['public', 'posts', params] as const,
  post: (slug: string) => ['public', 'post', slug] as const,
  projects: (params: ProjectParams) => ['public', 'projects', params] as const,
  project: (slug: string) => ['public', 'project', slug] as const,
  admin: {
    me: ['admin', 'me'] as const,
    dashboard: ['admin', 'dashboard'] as const,
    profile: ['admin', 'profile'] as const,
    skills: ['admin', 'skills'] as const,
    tags: ['admin', 'tags'] as const,
    posts: (params: PostParams) => ['admin', 'posts', params] as const,
    post: (id: string) => ['admin', 'post', id] as const,
    projects: (params: { page?: number; pageSize?: number; q?: string; status?: string }) =>
      ['admin', 'projects', params] as const,
    project: (id: string) => ['admin', 'project', id] as const,
    media: (params: { page?: number; pageSize?: number; type?: string }) =>
      ['admin', 'media', params] as const,
    messages: (params: { page?: number; pageSize?: number }) =>
      ['admin', 'messages', params] as const,
    settings: ['admin', 'settings'] as const,
    sessions: ['admin', 'sessions'] as const,
  },
}
