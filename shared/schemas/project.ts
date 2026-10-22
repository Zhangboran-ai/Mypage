import { z } from 'zod'
import { booleanQuerySchema, isoDateTimeSchema, paginationQuerySchema, slugOptionalSchema } from './common.js'
import { contentStatusSchema } from './post.js'

const nullableUrlSchema = z.string().url('请输入合法链接').nullable().optional()

export const projectImageInputSchema = z.object({
  url: z.string().url('图片地址不合法'),
  alt: z.string().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(120, '标题最长 120 个字符'),
  slug: slugOptionalSchema,
  summary: z.string().trim().min(1, '一句话简介不能为空').max(300, '简介最长 300 个字符'),
  content: z.string().nullable().optional(),
  coverUrl: nullableUrlSchema,
  repoUrl: nullableUrlSchema,
  demoUrl: nullableUrlSchema,
  role: z.string().max(120).nullable().optional(),
  startDate: isoDateTimeSchema.nullable().optional(),
  endDate: isoDateTimeSchema.nullable().optional(),
  featured: z.boolean().default(false),
  status: contentStatusSchema.default('DRAFT'),
  sortOrder: z.number().int().min(0).default(0),
  seoTitle: z.string().max(150).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
  publishedAt: isoDateTimeSchema.nullable().optional(),
  techTags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  images: z.array(projectImageInputSchema).max(12).default([]),
  updatedAt: isoDateTimeSchema.optional(),
})

export const projectListQuerySchema = paginationQuerySchema.extend({
  featured: booleanQuerySchema,
  tech: z.string().trim().max(40).optional(),
})

export const adminProjectListQuerySchema = paginationQuerySchema.extend({
  status: contentStatusSchema.optional(),
  q: z.string().trim().max(100).optional(),
})

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) }))
    .min(1, '没有需要排序的项')
    .max(200),
})

export type ProjectInput = z.infer<typeof projectInputSchema>
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>
export type AdminProjectListQuery = z.infer<typeof adminProjectListQuerySchema>
export type ReorderInput = z.infer<typeof reorderSchema>
