import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import type { MediaItem, Paginated } from '@shared'
import { api, toQueryString } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { uploadImages } from '@/lib/upload'
import { useSeo } from '@/hooks/use-seo'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { MediaCard } from './MediaCard'

const PAGE_SIZE = 12

export function MediaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const push = useToast()
  const queryClient = useQueryClient()

  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const type = searchParams.get('type') ?? ''

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.media({ page, pageSize: PAGE_SIZE, type: type || undefined }),
    queryFn: () =>
      api.get<Paginated<MediaItem>>(
        `/api/admin/media${toQueryString({ page, pageSize: PAGE_SIZE, type: type || undefined })}`,
      ),
  })

  useSeo({ title: '媒体库', noindex: true })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
    ])
  }

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/admin/media/${id}`),
    onSuccess: async () => {
      push('图片已删除')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const altMutation = useMutation({
    mutationFn: ({ id, alt }: { id: string; alt: string | null }) =>
      api.patch<MediaItem>(`/api/admin/media/${id}`, { alt }),
    onSuccess: async () => {
      push('替代文本已更新')
      await refresh()
    },
    onError: (error: Error) => push(error.message, 'error'),
  })

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    try {
      const uploaded = await uploadImages([...files])
      push(`已上传 ${uploaded.length} 张图片`)
      setParam('page', null)
      await refresh()
    } catch (error) {
      push(error instanceof Error ? error.message : '上传失败，请重试', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const items = data?.data ?? []

  return (
    <>
      <AdminPageHeader
        title="媒体库"
        description="上传前会在浏览器压缩为 WebP；图片直传 Vercel Blob，不经过函数请求体。"
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files)}
            />
            <Button
              size="sm"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              上传图片
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">共 {data?.meta.total ?? 0} 张</p>
        <label htmlFor="media-type" className="sr-only">
          类型筛选
        </label>
        <Select
          id="media-type"
          value={type}
          onChange={(event) => setParam('type', event.target.value || null)}
          className="w-40"
        >
          <option value="">全部类型</option>
          <option value="image/webp">WebP</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="媒体加载失败。" onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="还没有图片"
          description="点击右上角上传，支持一次选择多张。"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onSaveAlt={(id, alt) => altMutation.mutateAsync({ id, alt }).then(() => undefined)}
              onDelete={async (id) => {
                await deleteMutation.mutateAsync(id)
              }}
            />
          ))}
        </ul>
      )}

      {data ? (
        <Pagination meta={data.meta} onPageChange={(next) => setParam('page', String(next))} />
      ) : null}
    </>
  )
}
