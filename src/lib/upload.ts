import { upload } from '@vercel/blob/client'
import type { MediaItem } from '@shared'
import { api } from './api'
import { compressImage } from './image'

export type UploadOptions = {
  maxEdge?: number
  alt?: string | null
}

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 压缩后由浏览器直传 Vercel Blob，再在服务端登记元数据。
 * 函数不接触文件流，避免 4.5MB 请求体限制。
 */
export async function uploadImage(file: File, options: UploadOptions = {}): Promise<MediaItem> {
  const { blob, width, height } = await compressImage(file, options.maxEdge ?? 1600)
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const pathname = `media/${uniqueSuffix()}.${extension}`

  const result = await upload(pathname, blob, {
    access: 'public',
    handleUploadUrl: '/api/admin/media/upload',
    contentType: blob.type,
  })

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'

  return api.post<MediaItem>('/api/admin/media', {
    filename: `${baseName}.${extension}`,
    url: result.url,
    pathname: result.pathname,
    mimeType: blob.type,
    size: blob.size,
    width,
    height,
    alt: options.alt ?? null,
  })
}

export async function uploadImages(files: File[], maxEdge?: number): Promise<MediaItem[]> {
  const results: MediaItem[] = []

  for (const file of files) {
    results.push(await uploadImage(file, { maxEdge }))
  }

  return results
}
