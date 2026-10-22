import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { del } from '@vercel/blob'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../../shared/constants'
import { AppError, forbidden, unauthorized } from './errors'
import { findSessionUser } from './session'

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
}

export function assertBlobConfigured(): void {
  if (!isBlobConfigured()) {
    throw new AppError('INTERNAL_ERROR', '对象存储未配置，请先在 Vercel 创建 Blob 存储')
  }
}

type UploadHandlerInput = {
  request: Request
  body: HandleUploadBody
  sessionToken: string
}

export async function handleClientUpload({
  request,
  body,
  sessionToken,
}: UploadHandlerInput) {
  assertBlobConfigured()

  return handleUpload({
    request,
    body,
    // 签发令牌前再次校验会话，避免只依赖上层中间件
    onBeforeGenerateToken: async (pathname) => {
      const user = await findSessionUser(sessionToken)
      if (!user) throw unauthorized()

      if (!pathname.startsWith('media/')) {
        throw forbidden('非法的上传路径')
      }

      return {
        allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
        maximumSizeInBytes: MAX_IMAGE_BYTES,
        addRandomSuffix: true,
      }
    },
  })
}

export async function deleteBlob(url: string): Promise<void> {
  if (!isBlobConfigured()) return

  try {
    await del(url)
  } catch (error) {
    console.error('[blob] 删除失败', error)
  }
}
