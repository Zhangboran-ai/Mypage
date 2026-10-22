import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, MonitorSmartphone, ShieldOff } from 'lucide-react'
import { changePasswordSchema, type SessionInfo } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { formatDateTime } from '@/lib/format'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const push = useToast()
  const queryClient = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: queryKeys.admin.sessions,
    queryFn: () => api.get<SessionInfo[]>('/api/admin/account/sessions'),
  })

  useSeo({ title: '账号安全', noindex: true })

  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.post<{ ok: boolean }>('/api/auth/change-password', payload),
    onSuccess: async () => {
      push('密码已更新，其他设备已退出登录')
      setCurrentPassword('')
      setNewPassword('')
      setErrors({})
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessions })
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/account/sessions/${id}`),
    onSuccess: async () => {
      push('该会话已退出')
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessions })
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const revokeOthersMutation = useMutation({
    mutationFn: () => api.delete<{ ok: boolean }>('/api/admin/account/sessions'),
    onSuccess: async () => {
      push('其他设备已全部退出')
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessions })
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})

    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }

    passwordMutation.mutate(parsed.data)
  }

  const sessions = sessionsQuery.data ?? []
  const hasOtherSessions = sessions.some((session) => !session.current)

  return (
    <>
      <AdminPageHeader
        title="账号安全"
        description="修改密码后，其他设备上的会话会立即失效。"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-6" noValidate>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <KeyRound className="size-4" aria-hidden="true" />
            修改密码
          </h2>

          <div className="mt-4 space-y-4">
            <Field
              label="当前密码"
              htmlFor="account-current"
              required
              error={errors.currentPassword}
            >
              <Input
                id="account-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>
            <Field
              label="新密码"
              htmlFor="account-new"
              required
              error={errors.newPassword}
              hint="至少 8 位，需同时包含字母与数字。"
            >
              <Input
                id="account-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" size="sm" loading={passwordMutation.isPending}>
              更新密码
            </Button>
          </div>
        </form>

        <section className="glass-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <MonitorSmartphone className="size-4" aria-hidden="true" />
              登录会话
            </h2>
            {hasOtherSessions ? (
              <ConfirmDialog
                title="退出其他设备"
                description="除当前设备外，所有已登录设备都会失效。"
                confirmLabel="全部退出"
                trigger={
                  <Button variant="secondary" size="sm">
                    <ShieldOff className="size-3.5" aria-hidden="true" />
                    退出其他设备
                  </Button>
                }
                onConfirm={async () => {
                  await revokeOthersMutation.mutateAsync()
                }}
              />
            ) : null}
          </div>

          {sessionsQuery.isLoading ? (
            <Skeleton className="mt-4 h-32 w-full" />
          ) : sessionsQuery.isError ? (
            <div className="mt-4">
              <ErrorState
                message="会话列表加载失败。"
                onRetry={() => void sessionsQuery.refetch()}
              />
            </div>
          ) : sessions.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="没有活跃会话" />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border-subtle">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-text-primary">
                        {session.ip ?? '未知 IP'}
                      </p>
                      {session.current ? <Badge tone="success">当前设备</Badge> : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {session.userAgent ?? '未知浏览器'}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      登录于 {formatDateTime(session.createdAt)} · 有效期至{' '}
                      {formatDateTime(session.expiresAt)}
                    </p>
                  </div>
                  {session.current ? null : (
                    <ConfirmDialog
                      title="注销该会话"
                      description="该设备上的登录状态会立即失效。"
                      confirmLabel="注销"
                      trigger={
                        <Button variant="ghost" size="sm">
                          注销
                        </Button>
                      }
                      onConfirm={async () => {
                        await revokeMutation.mutateAsync(session.id)
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
