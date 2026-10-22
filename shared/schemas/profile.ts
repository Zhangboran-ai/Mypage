import { z } from 'zod'
import { isoDateTimeSchema } from './common.js'

const nullableUrlSchema = z.string().url('请输入合法链接').nullable().optional()

export const profileUpdateSchema = z
  .object({
    displayName: z.string().trim().min(1, '昵称不能为空').max(100).optional(),
    fullName: z.string().max(100).nullable().optional(),
    headline: z.string().trim().min(1, '一句话定位不能为空').max(200).optional(),
    bio: z.string().max(20000, '关于我最长 20000 字').optional(),
    avatarUrl: nullableUrlSchema,
    coverUrl: nullableUrlSchema,
    location: z.string().max(120).nullable().optional(),
    publicEmail: z.string().email('邮箱格式不正确').max(255).nullable().optional(),
    availability: z.boolean().optional(),
    statusText: z.string().max(120).nullable().optional(),
    heroTitle: z.string().max(120).nullable().optional(),
    heroSubtitle: z.string().max(300).nullable().optional(),
    resumeUrl: nullableUrlSchema,
  })
  .refine((value) => Object.keys(value).length > 0, { message: '没有需要保存的字段' })

export const socialLinkInputSchema = z.object({
  platform: z.string().trim().min(1, '平台不能为空').max(40),
  label: z.string().trim().min(1, '展示名不能为空').max(80),
  url: z.string().url('请输入合法链接'),
  icon: z.string().max(80).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
})

export const experienceInputSchema = z.object({
  company: z.string().trim().min(1, '公司不能为空').max(120),
  role: z.string().trim().min(1, '角色不能为空').max(120),
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema.nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>
export type ExperienceInput = z.infer<typeof experienceInputSchema>
