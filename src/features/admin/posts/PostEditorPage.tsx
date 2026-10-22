import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Send } from 'lucide-react'
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  postInputSchema,
  type AdminPostDetail,
  type ContentStatus,
  type PostInput,
  type Tag,
} from '@shared'
import { toClientSlug } from '@/lib/slug'
import { api, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/format'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { ImageField } from '../components/ImageField'
import { PostEditorFields, type PostFormState } from './PostEditorFields'
import { TagSelector } from './TagSelector'

const emptyForm: PostFormState = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  coverUrl: '',
  status: 'DRAFT',
  pinned: false,
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  publishedAt: '',
  tagIds: [],
}

function toFormState(post: AdminPostDetail): PostFormState {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    content: post.content,
    coverUrl: post.coverUrl ?? '',
    status: post.status,
    pinned: post.pinned,
    seoTitle: post.seoTitle ?? '',
    seoDescription: post.seoDescription ?? '',
    ogImage: post.ogImage ?? '',
    publishedAt: toDatetimeLocal(post.publishedAt),
    tagIds: post.tagIds,
  }
}

export function PostEditorPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const push = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<PostFormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [baseline, setBaseline] = useState<PostFormState>(emptyForm)
  // 新建成功后主动跳转到编辑页时，跳过一次「未保存离开」拦截
  const skipBlockRef = useRef(false)

  const postQuery = useQuery({
    queryKey: queryKeys.admin.post(id ?? 'new'),
    queryFn: () => api.get<AdminPostDetail>(`/api/admin/posts/${id}`),
    enabled: isEditing,
  })

  const tagsQuery = useQuery({
    queryKey: ['admin', 'tags', 'all'],
    queryFn: () => api.get<Tag[]>('/api/admin/tags/all'),
  })

  useSeo({ title: isEditing ? '编辑文章' : '新建文章', noindex: true })

  useEffect(() => {
    if (postQuery.data) {
      const next = toFormState(postQuery.data)
      setForm(next)
      setBaseline(next)
    }
  }, [postQuery.data])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const update = <Key extends keyof PostFormState>(key: Key, value: PostFormState[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: (payload: PostInput) =>
      isEditing
        ? api.put<{ id: string; slug: string }>(`/api/admin/posts/${id}`, payload)
        : api.post<{ id: string; slug: string }>('/api/admin/posts', payload),
    onSuccess: async (result, payload) => {
      push('文章已保存')

      const snapshot = { ...form, status: payload.status }
      setForm(snapshot)
      setBaseline(snapshot)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['public', 'posts'] }),
      ])

      if (!isEditing) {
        skipBlockRef.current = true
        navigate(`/admin/posts/${result.id}/edit`, { replace: true })
      } else {
        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.post(id ?? 'new') })
      }
    },
    onError: (error: Error) => {
      const message =
        error instanceof ApiError && error.status === 409
          ? '内容已在其他窗口修改，请刷新后再保存。'
          : error.message
      push(message, 'error')
    },
  })

  const handleSave = useCallback(
    (statusOverride?: ContentStatus) => {
      const status = statusOverride ?? form.status
      setErrors({})

      const payload = {
        title: form.title,
        slug: form.slug.trim() || undefined,
        summary: form.summary,
        content: form.content,
        coverUrl: form.coverUrl.trim() || null,
        status,
        pinned: form.pinned,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        ogImage: form.ogImage.trim() || null,
        publishedAt: form.publishedAt ? fromDatetimeLocal(form.publishedAt) : null,
        tagIds: form.tagIds,
        updatedAt: postQuery.data?.updatedAt,
      }

      const parsed = postInputSchema.safeParse(payload)
      if (!parsed.success) {
        const next: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? '')
          if (key && !next[key]) next[key] = issue.message
        }
        setErrors(next)
        push(parsed.error.issues[0]?.message ?? '请检查表单', 'error')
        return
      }

      if (statusOverride) update('status', status)
      saveMutation.mutate(parsed.data)
    },
    [form, postQuery.data?.updatedAt, saveMutation, push],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSave])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !skipBlockRef.current &&
      isDirty &&
      !saveMutation.isPending &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  if (isEditing && postQuery.isLoading) {
    return (
      <>
        <AdminPageHeader title="编辑文章" />
        <Skeleton className="h-[36rem] w-full" />
      </>
    )
  }

  if (isEditing && postQuery.isError) {
    return (
      <>
        <AdminPageHeader title="编辑文章" />
        <ErrorState message="文章加载失败。" onRetry={() => void postQuery.refetch()} />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={isEditing ? '编辑文章' : '新建文章'}
        description={isDirty ? '有未保存的修改' : '所有修改已保存'}
        actions={
          <>
            <Link
              to="/admin/posts"
              className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-border-subtle px-3 text-sm text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              返回
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave('DRAFT')}
              loading={saveMutation.isPending}
            >
              <Save className="size-3.5" aria-hidden="true" />
              保存草稿
            </Button>
            <Button size="sm" onClick={() => handleSave('PUBLISHED')} loading={saveMutation.isPending}>
              <Send className="size-3.5" aria-hidden="true" />
              发布
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="glass-card p-5 sm:p-6">
          <PostEditorFields
            form={form}
            errors={errors}
            onChange={update}
            onGenerateSlug={() => update('slug', toClientSlug(form.title))}
          />
        </div>

        <aside className="space-y-4">
          <section className="glass-card space-y-3 p-5">
            <h2 className="text-sm font-semibold text-text-primary">发布</h2>
            <Field label="状态" htmlFor="post-status">
              <Select
                id="post-status"
                value={form.status}
                onChange={(event) => update('status', event.target.value as ContentStatus)}
              >
                {CONTENT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {CONTENT_STATUS_LABELS[item]}
                  </option>
                ))}
              </Select>
            </Field>

            {form.status === 'SCHEDULED' ? (
              <Field label="发布时间" htmlFor="post-published-at" required error={errors.publishedAt}>
                <Input
                  id="post-published-at"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => update('publishedAt', event.target.value)}
                />
              </Field>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(event) => update('pinned', event.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              置顶文章
            </label>

            {postQuery.data?.publishedAt ? (
              <p className="text-xs text-text-muted">首次发布于 {postQuery.data.publishedAt.slice(0, 10)}</p>
            ) : null}
          </section>

          <section className="glass-card space-y-4 p-5">
            <ImageField
              inputId="post-cover"
              label="封面图"
              value={form.coverUrl}
              onChange={(url) => update('coverUrl', url)}
            />
            <TagSelector
              tags={tagsQuery.data ?? []}
              selected={form.tagIds}
              onChange={(tagIds) => update('tagIds', tagIds)}
            />
          </section>
        </aside>
      </div>

      <Dialog
        open={blocker.state === 'blocked'}
        title="离开编辑器？"
        onClose={() => blocker.reset?.()}
      >
        <p className="text-sm text-text-secondary">
          当前修改还没有保存，离开后这些修改会丢失。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => blocker.reset?.()}>
            继续编辑
          </Button>
          <Button variant="danger" size="sm" onClick={() => blocker.proceed?.()}>
            放弃修改
          </Button>
        </div>
      </Dialog>
    </>
  )
}
