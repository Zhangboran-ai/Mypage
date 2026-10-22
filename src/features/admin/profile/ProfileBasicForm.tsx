import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Save } from 'lucide-react'
import { profileUpdateSchema, type Profile } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Markdown } from '@/lib/markdown'
import { ImageField } from '../components/ImageField'

type ProfileFormState = {
  displayName: string
  fullName: string
  headline: string
  bio: string
  avatarUrl: string
  coverUrl: string
  location: string
  publicEmail: string
  availability: boolean
  statusText: string
  heroTitle: string
  heroSubtitle: string
  resumeUrl: string
}

function toState(profile: Profile): ProfileFormState {
  return {
    displayName: profile.displayName,
    fullName: profile.fullName ?? '',
    headline: profile.headline,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? '',
    coverUrl: profile.coverUrl ?? '',
    location: profile.location ?? '',
    publicEmail: profile.publicEmail ?? '',
    availability: profile.availability,
    statusText: profile.statusText ?? '',
    heroTitle: profile.heroTitle ?? '',
    heroSubtitle: profile.heroSubtitle ?? '',
    resumeUrl: profile.resumeUrl ?? '',
  }
}

const emptyToNull = (value: string): string | null => (value.trim() ? value.trim() : null)

export function ProfileBasicForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState<ProfileFormState>(() => toState(profile))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(false)
  const push = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    setForm(toState(profile))
  }, [profile])

  const update = <Key extends keyof ProfileFormState>(key: Key, value: ProfileFormState[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put<Profile>('/api/admin/profile', payload),
    onSuccess: async () => {
      push('个人信息已保存')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      ])
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})

    const candidate = {
      displayName: form.displayName,
      fullName: emptyToNull(form.fullName),
      headline: form.headline,
      bio: form.bio,
      avatarUrl: emptyToNull(form.avatarUrl),
      coverUrl: emptyToNull(form.coverUrl),
      location: emptyToNull(form.location),
      publicEmail: emptyToNull(form.publicEmail),
      availability: form.availability,
      statusText: emptyToNull(form.statusText),
      heroTitle: emptyToNull(form.heroTitle),
      heroSubtitle: emptyToNull(form.heroSubtitle),
      resumeUrl: emptyToNull(form.resumeUrl),
    }

    const parsed = profileUpdateSchema.safeParse(candidate)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }

    mutation.mutate(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">基本资料</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview((value) => !value)}
          >
            <Eye className="size-3.5" aria-hidden="true" />
            {preview ? '继续编辑' : '预览介绍'}
          </Button>
          <Button type="submit" size="sm" loading={mutation.isPending}>
            <Save className="size-3.5" aria-hidden="true" />
            保存
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="昵称" htmlFor="profile-display-name" required error={errors.displayName}>
          <Input
            id="profile-display-name"
            value={form.displayName}
            onChange={(event) => update('displayName', event.target.value)}
          />
        </Field>
        <Field label="真实姓名" htmlFor="profile-full-name" error={errors.fullName}>
          <Input
            id="profile-full-name"
            value={form.fullName}
            onChange={(event) => update('fullName', event.target.value)}
          />
        </Field>
        <Field
          label="一句话定位"
          htmlFor="profile-headline"
          required
          error={errors.headline}
          className="sm:col-span-2"
        >
          <Input
            id="profile-headline"
            value={form.headline}
            onChange={(event) => update('headline', event.target.value)}
            placeholder="例如：全栈开发 / 关注开发者体验"
          />
        </Field>
        <Field label="Hero 主标题" htmlFor="profile-hero-title" hint="留空时使用昵称。">
          <Input
            id="profile-hero-title"
            value={form.heroTitle}
            onChange={(event) => update('heroTitle', event.target.value)}
          />
        </Field>
        <Field label="Hero 副标题" htmlFor="profile-hero-subtitle" hint="留空时使用一句话定位。">
          <Input
            id="profile-hero-subtitle"
            value={form.heroSubtitle}
            onChange={(event) => update('heroSubtitle', event.target.value)}
          />
        </Field>
        <Field label="所在地" htmlFor="profile-location" error={errors.location}>
          <Input
            id="profile-location"
            value={form.location}
            onChange={(event) => update('location', event.target.value)}
          />
        </Field>
        <Field label="公开邮箱" htmlFor="profile-email" error={errors.publicEmail}>
          <Input
            id="profile-email"
            type="email"
            value={form.publicEmail}
            onChange={(event) => update('publicEmail', event.target.value)}
          />
        </Field>
        <Field label="当前状态文案" htmlFor="profile-status" hint="例如：可接受远程机会。">
          <Input
            id="profile-status"
            value={form.statusText}
            onChange={(event) => update('statusText', event.target.value)}
          />
        </Field>
        <Field label="简历链接" htmlFor="profile-resume" error={errors.resumeUrl}>
          <Input
            id="profile-resume"
            value={form.resumeUrl}
            onChange={(event) => update('resumeUrl', event.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ImageField
          inputId="profile-avatar"
          label="头像"
          value={form.avatarUrl}
          onChange={(url) => update('avatarUrl', url)}
          maxEdge={512}
          hint="正方形效果最好，最长边 512px。"
        />
        <ImageField
          inputId="profile-cover"
          label="首页背景图（可选）"
          value={form.coverUrl}
          onChange={(url) => update('coverUrl', url)}
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={form.availability}
          onChange={(event) => update('availability', event.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        在前台显示「开放合作」徽标
      </label>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="profile-bio" className="text-sm font-medium text-text-secondary">
            关于我（Markdown）
          </label>
          <span className="text-xs text-text-muted">{form.bio.length} 字</span>
        </div>

        {preview ? (
          <div className="min-h-48 rounded-btn border border-border-subtle bg-white/[0.02] p-4">
            {form.bio.trim() ? (
              <Markdown content={form.bio} />
            ) : (
              <p className="text-sm text-text-muted">暂无内容。</p>
            )}
          </div>
        ) : (
          <Textarea
            id="profile-bio"
            rows={12}
            value={form.bio}
            onChange={(event) => update('bio', event.target.value)}
            className="font-mono text-[13px]"
            placeholder="支持 Markdown，可分段、列表、链接。"
          />
        )}
      </div>
    </form>
  )
}
