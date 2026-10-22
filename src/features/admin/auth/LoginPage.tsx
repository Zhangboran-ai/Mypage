import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { loginSchema, type LoginInput } from '@shared'
import { api, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useSeo } from '@/hooks/use-seo'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

type LoginFormInput = {
  email: string
  password: string
  remember?: boolean
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useSeo({ title: '后台登录', noindex: true })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await api.post<{ user: { id: string; email: string; name: string; role: string } }>(
        '/api/auth/login',
        values,
      )
      queryClient.setQueryData(queryKeys.admin.me, result)
      const redirect = searchParams.get('redirect')
      navigate(redirect && redirect.startsWith('/admin') ? redirect : '/admin', { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '登录失败，请稍后重试。'
      setError('password', { message })
    }
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-nebula" />

      <div className="relative z-10 w-full max-w-sm">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          返回前台
        </Link>

        <div className="glass-card p-7">
          <div className="mb-6">
            <span className="flex size-10 items-center justify-center rounded-btn border border-accent/30 bg-accent-soft text-accent-strong">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-text-primary">后台登录</h1>
            <p className="mt-1 text-sm text-text-muted">仅限站长本人使用。</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="邮箱" htmlFor="login-email" required error={errors.email?.message}>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>

            <Field label="密码" htmlFor="login-password" required error={errors.password?.message}>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  className="pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </Field>

            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input type="checkbox" className="size-4 accent-[var(--accent)]" {...register('remember')} />
              记住我（30 天）
            </label>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              登录
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          连续 5 次输错密码会锁定 15 分钟。
        </p>
      </div>
    </div>
  )
}
