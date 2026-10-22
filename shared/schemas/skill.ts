import { z } from 'zod'
import { slugOptionalSchema } from './common'

export const skillCategoryInputSchema = z.object({
  name: z.string().trim().min(1, '分类名不能为空').max(60),
  slug: slugOptionalSchema,
  sortOrder: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
})

export const skillInputSchema = z.object({
  categoryId: z.string().uuid('请选择分类'),
  name: z.string().trim().min(1, '技能名不能为空').max(60),
  icon: z.string().max(80).nullable().optional(),
  level: z.number().int().min(0).max(100).default(60),
  levelLabel: z.string().max(30).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
})

export type SkillCategoryInput = z.infer<typeof skillCategoryInputSchema>
export type SkillInput = z.infer<typeof skillInputSchema>
