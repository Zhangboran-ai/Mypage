import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { contactMessageSchema, type ContactMessageInput } from '@shared'
import { api, ApiError } from '@/lib/api'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PageHeader } from '@/components/common/PageHeader'
import { usePublicProfile } from '@/features/public/use-public-data'
import { SocialLinks } from '@/components/common/SocialLinks'

export function ContactPage() {
  const push = useToast()
  const { data: profile } = usePublicProfile()

  useSeo({
    title: '联系',
    description: '通过留言或邮件取得联系。',
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: { name: '', email: '', content: '', website: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post<{ ok: boolean }>('/api/public/messages', {
        ...values,
        email: values.email || undefined,
      })
      push('留言已发送，我会尽快回复。')
      reset()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '发送失败，请稍后重试。'
      push(message, 'error')
    }
  })

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="联系我"
        description="有合作、项目或技术问题，欢迎留言；也可以直接发邮件。"
      />

      <div className="container-page grid gap-8 pb-20 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={onSubmit} className="glass-card space-y-5 p-6 sm:p-8" noValidate>
          <Field label="昵称" htmlFor="contact-name" required error={errors.name?.message}>
            <Input
              id="contact-name"
              autoComplete="name"
              placeholder="怎么称呼你"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </Field>

          <Field
            label="邮箱"
            htmlFor="contact-email"
            hint="方便我回复你，不会公开显示。"
            error={errors.email?.message}
          >
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>

          <Field label="内容" htmlFor="contact-content" required error={errors.content?.message}>
            <Textarea
              id="contact-content"
              rows={7}
              placeholder="想聊点什么？"
              aria-invalid={Boolean(errors.content)}
              {...register('content')}
            />
          </Field>

          <div className="sr-only" aria-hidden="true">
            <label htmlFor="contact-website">请勿填写</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" {...register('website')} />
          </div>

          <Button type="submit" loading={isSubmitting}>
            <Send className="size-4" aria-hidden="true" />
            发送留言
          </Button>
        </form>

        <aside className="space-y-5">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-text-primary">直接联系</h2>
            {profile?.profile?.publicEmail ? (
              <a
                href={`mailto:${profile.profile.publicEmail}`}
                className="mt-3 block text-sm break-all text-accent-strong underline underline-offset-4"
              >
                {profile.profile.publicEmail}
              </a>
            ) : (
              <p className="mt-3 text-sm text-text-muted">还没有公开邮箱，先留言吧。</p>
            )}

            <div className="mt-5">
              <SocialLinks links={profile?.socialLinks ?? []} />
            </div>
          </div>

          <div className="rounded-card border border-border-subtle bg-white/[0.02] p-6">
            <h2 className="text-sm font-semibold text-text-primary">回复时间</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              通常会在一到两个工作日内回复。留言会进入后台，不会公开展示。
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
