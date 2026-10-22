import { z } from 'zod'
import { CONTENT_STATUSES } from '../constants.js'
import { isoDateTimeSchema, paginationQuerySchema, slugOptionalSchema } from './common.js'

const nullableUrlSchema = z.string().url('请输入合法链接').nullable().optional()

export const contentStatusSchema = z.enum(CONTENT_STATUSES)

export const tagInputSchema = z.object({
  name: z.string().trim().min(1, '标签名不能为空').max(40, '标签名最长 40 个字符'),
  slug: slugOptionalSchema,
})

export const postInputSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(150, '标题最长 150 个字符'),
  slug: slugOptionalSchema,
  summary: z.string().trim().min(1, '摘要不能为空').max(300, '摘要最长 300 个字符'),
  content: z.string().min(1, '正文不能为空'),
  coverUrl: nullableUrlSchema,
  status: contentStatusSchema.default('DRAFT'),
  pinned: z.boolean().default(false),
  seoTitle: z.string().max(150).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
  ogImage: nullableUrlSchema,
  publishedAt: isoDateTimeSchema.nullable().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
  updatedAt: isoDateTimeSchema.optional(),
})

export const postStatusActionSchema = z.object({
  publishedAt: isoDateTimeSchema.nullable().optional(),
})

export const postListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(80).optional(),
  status: contentStatusSchema.optional(),
})

export const publicPostListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(80).optional(),
})

export type PostInput = z.infer<typeof postInputSchema>
export type PostListQuery = z.infer<typeof postListQuerySchema>
export type PublicPostListQuery = z.infer<typeof publicPostListQuerySchema>
export type PostStatusAction = z.infer<typeof postStatusActionSchema>
