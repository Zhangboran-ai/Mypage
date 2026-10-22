import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { settingsInputSchema, type SiteSettings } from '@shared'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ImageField } from '../components/ImageField'

type SettingsFormState = {
  siteName: string
  siteDescription: string
  logoUrl: string
  faviconUrl: string
  defaultOgImage: string
  footerText: string
  icpRecord: string
  socialShareText: string
  navConfig: Record<string, boolean>
}

const navItems = [
  { key: 'about', label: '关于' },
  { key: 'projects', label: '项目' },
  { key: 'blog', label: '博客' },
  { key: 'contact', label: '联系' },
]

const emptyToNull = (value: string): string | null => (value.trim() ? value.trim() : null)

function toState(settings: SiteSettings): SettingsFormState {
  return {
    siteName: settings.siteName,
    siteDescription: settings.siteDescription,
    logoUrl: settings.logoUrl ?? '',
    faviconUrl: settings.faviconUrl ?? '',
    defaultOgImage: settings.defaultOgImage ?? '',
    footerText: settings.footerText ?? '',
    icpRecord: settings.icpRecord ?? '',
    socialShareText: settings.socialShareText ?? '',
    navConfig: settings.navConfig ?? {},
  }
}

export function SettingsPage() {
  const [form, setForm] = useState<SettingsFormState | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const push = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: () => api.get<SiteSettings>('/api/admin/settings'),
  })

  useSeo({ title: '站点设置', noindex: true })

  useEffect(() => {
    if (data) setForm(toState(data))
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put<SiteSettings>('/api/admin/settings', payload),
    onSuccess: async () => {
      push('站点设置已保存')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
      ])
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const update = <Key extends keyof SettingsFormState>(
    key: Key,
    value: SettingsFormState[Key],
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    setErrors({})

    const parsed = settingsInputSchema.safeParse({
      siteName: form.siteName,
      siteDescription: form.siteDescription,
      logoUrl: emptyToNull(form.logoUrl),
      faviconUrl: emptyToNull(form.faviconUrl),
      defaultOgImage: emptyToNull(form.defaultOgImage),
      footerText: emptyToNull(form.footerText),
      icpRecord: emptyToNull(form.icpRecord),
      socialShareText: emptyToNull(form.socialShareText),
      navConfig: form.navConfig,
    })

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

  if (isLoading) {
    return (
      <>
        <AdminPageHeader title="站点设置" />
        <Skeleton className="h-96 w-full" />
      </>
    )
  }

  if (isError || !form) {
    return (
      <>
        <AdminPageHeader title="站点设置" />
        <ErrorState message="站点设置加载失败。" onRetry={() => void refetch()} />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title="站点设置"
        description="站点名称、描述与分享文案会用于全站的标题、页脚与社交卡片。"
      />

      <form onSubmit={handleSubmit} className="glass-card space-y-4 p-5 sm:p-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="站点名称" htmlFor="settings-name" required error={errors.siteName}>
            <Input
              id="settings-name"
              value={form.siteName}
              onChange={(event) => update('siteName', event.target.value)}
            />
          </Field>
          <Field
            label="站点描述"
            htmlFor="settings-description"
            required
            error={errors.siteDescription}
          >
            <Input
              id="settings-description"
              value={form.siteDescription}
              onChange={(event) => update('siteDescription', event.target.value)}
            />
          </Field>
          <Field label="页脚文案" htmlFor="settings-footer">
            <Input
              id="settings-footer"
              value={form.footerText}
              onChange={(event) => update('footerText', event.target.value)}
            />
          </Field>
          <Field label="备案号" htmlFor="settings-icp">
            <Input
              id="settings-icp"
              value={form.icpRecord}
              onChange={(event) => update('icpRecord', event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="社交分享默认文案"
          htmlFor="settings-share"
          hint="用于 OG 卡片描述，留空则回退站点描述。"
        >
          <Textarea
            id="settings-share"
            rows={2}
            value={form.socialShareText}
            onChange={(event) => update('socialShareText', event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <ImageField
            inputId="settings-logo"
            label="Logo"
            value={form.logoUrl}
            onChange={(url) => update('logoUrl', url)}
            maxEdge={512}
          />
          <ImageField
            inputId="settings-favicon"
            label="Favicon"
            value={form.faviconUrl}
            onChange={(url) => update('faviconUrl', url)}
            maxEdge={256}
          />
          <ImageField
            inputId="settings-og"
            label="默认 OG 图"
            value={form.defaultOgImage}
            onChange={(url) => update('defaultOgImage', url)}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text-secondary">导航显示项</legend>
          <div className="flex flex-wrap gap-4">
            {navItems.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 text-sm text-text-secondary"
              >
                <input
                  type="checkbox"
                  checked={form.navConfig[item.key] !== false}
                  onChange={(event) =>
                    update('navConfig', {
                      ...form.navConfig,
                      [item.key]: event.target.checked,
                    })
                  }
                  className="size-4 accent-[var(--accent)]"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end border-t border-border-subtle pt-4">
          <Button type="submit" size="sm" loading={mutation.isPending}>
            <Save className="size-3.5" aria-hidden="true" />
            保存设置
          </Button>
        </div>
      </form>
    </>
  )
}
