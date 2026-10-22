import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'

export function useMe() {
  return useQuery({
    queryKey: queryKeys.admin.me,
    queryFn: () => api.get<{ user: AuthUser }>('/api/auth/me'),
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useCurrentUser(): AuthUser | undefined {
  const { data } = useMe()
  return data?.user
}

export function useAdminQueryClient() {
  return useQueryClient()
}
