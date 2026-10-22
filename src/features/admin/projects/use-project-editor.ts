import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  projectInputSchema,
  type AdminProjectDetail,
  type ContentStatus,
  type TechTag,
} from '@shared'
import { api, ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import type { ProjectFormState } from '../projects/ProjectEditorFields'

const emptyForm: ProjectFormState = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  coverUrl: '',
  repoUrl: '',
  demoUrl: '',
  role: '',
  startDate: '',
  endDate: '',
  featured: false,
  status: 'DRAFT',
  publishedAt: '',
  seoTitle: '',
  seoDescription: '',
  techTagsText: '',
  images: [],
}

const emptyToNull = (value: string): string | null => (value.trim() ? value.trim() : null)

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function dateToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toFormState(project: AdminProjectDetail): ProjectFormState {
  return {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    content: project.content ?? '',
    coverUrl: project.coverUrl ?? '',
    repoUrl: project.repoUrl ?? '',
    demoUrl: project.demoUrl ?? '',
    role: project.role ?? '',
    startDate: toDateInput(project.startDate),
    endDate: toDateInput(project.endDate),
    featured: project.featured,
    status: project.status,
    publishedAt: toDatetimeLocal(project.publishedAt),
    seoTitle: project.seoTitle ?? '',
    seoDescription: project.seoDescription ?? '',
    techTagsText: project.techTagNames.join(', '),
    images: project.images.map((image) => ({ url: image.url, alt: image.alt ?? '' })),
  }
}

/**
 * 项目编辑器的状态、校验与保存逻辑。
 * 与文章编辑器一致：带 updatedAt 做乐观锁，冲突时提示刷新而不是静默覆盖。
 */
export function useProjectEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const push = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<ProjectFormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [baseline, setBaseline] = useState<ProjectFormState>(emptyForm)

  const projectQuery = useQuery({
    queryKey: queryKeys.admin.project(id ?? 'new'),
    queryFn: () => api.get<AdminProjectDetail>(`/api/admin/projects/${id}`),
    enabled: isEditing,
  })

  const techQuery = useQuery({
    queryKey: ['admin', 'tech-tags'],
    queryFn: () => api.get<TechTag[]>('/api/admin/tech-tags'),
  })

  useEffect(() => {
    if (projectQuery.data) {
      const next = toFormState(projectQuery.data)
      setForm(next)
      setBaseline(next)
    }
  }, [projectQuery.data])

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const update = useCallback(
    <Key extends keyof ProjectFormState>(key: Key, value: ProjectFormState[Key]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isEditing
        ? api.put<{ id: string; slug: string }>(`/api/admin/projects/${id}`, payload)
        : api.post<{ id: string; slug: string }>('/api/admin/projects', payload),
    onSuccess: async (result) => {
      push('项目已保存')
      setBaseline(form)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['public', 'projects'] }),
      ])

      if (!isEditing) navigate(`/admin/projects/${result.id}/edit`, { replace: true })
      else await queryClient.invalidateQueries({ queryKey: queryKeys.admin.project(id ?? 'new') })
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

      const parsed = projectInputSchema.safeParse({
        title: form.title,
        slug: form.slug.trim() || undefined,
        summary: form.summary,
        content: form.content.trim() ? form.content : null,
        coverUrl: emptyToNull(form.coverUrl),
        repoUrl: emptyToNull(form.repoUrl),
        demoUrl: emptyToNull(form.demoUrl),
        role: emptyToNull(form.role),
        startDate: dateToIso(form.startDate),
        endDate: dateToIso(form.endDate),
        featured: form.featured,
        status,
        sortOrder: projectQuery.data?.sortOrder ?? 0,
        seoTitle: emptyToNull(form.seoTitle),
        seoDescription: emptyToNull(form.seoDescription),
        publishedAt: form.publishedAt ? fromDatetimeLocal(form.publishedAt) : null,
        techTags: form.techTagsText
          .split(/[,，、]/)
          .map((name) => name.trim())
          .filter(Boolean),
        images: form.images
          .filter((image) => image.url.trim())
          .map((image, index) => ({
            url: image.url.trim(),
            alt: image.alt.trim() || null,
            sortOrder: index,
          })),
        updatedAt: projectQuery.data?.updatedAt,
      })

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
    [form, projectQuery.data, saveMutation, update, push],
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
      isDirty && !saveMutation.isPending && currentLocation.pathname !== nextLocation.pathname,
  )

  return {
    isEditing,
    form,
    errors,
    isDirty,
    update,
    handleSave,
    isSaving: saveMutation.isPending,
    blocker,
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    isError: projectQuery.isError,
    refetch: projectQuery.refetch,
    techSuggestions: techQuery.data?.map((tech) => tech.name) ?? [],
  }
}
