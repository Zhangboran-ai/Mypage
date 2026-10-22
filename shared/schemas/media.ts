import { z } from 'zod'
import { paginationQuerySchema } from './common.js'

export const mediaConfirmSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  url: z.string().url('图片地址不合法'),
  pathname: z.string().trim().min(1).max(500),
  mimeType: z.string().trim().min(1).max(100),
  size: z.number().int().min(1).max(5 * 1024 * 1024, '文件不能超过 5MB'),
  width: z.number().int().min(1).nullable().optional(),
  height: z.number().int().min(1).nullable().optional(),
  alt: z.string().max(300).nullable().optional(),
})

export const mediaUpdateSchema = z.object({
  alt: z.string().max(300).nullable().optional(),
})

export const mediaListQuerySchema = paginationQuerySchema.extend({
  type: z.string().trim().max(100).optional(),
})

export const mediaUploadTokenSchema = z.object({
  pathname: z.string().trim().min(1).max(500),
  contentType: z.string().trim().min(1).max(100),
  size: z.number().int().min(1).max(5 * 1024 * 1024),
})

export type MediaConfirmInput = z.infer<typeof mediaConfirmSchema>
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>
