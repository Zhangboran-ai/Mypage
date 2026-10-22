import { z } from 'zod'
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '../constants'

export const uuidSchema = z.string().uuid('ID 格式不正确')

export const slugSchema = z
  .string()
  .min(1, 'slug 不能为空')
  .max(80, 'slug 最长 80 个字符')
  .regex(/^[a-z0-9-]+$/, 'slug 只能包含小写字母、数字和连字符')

export const slugOptionalSchema = slugSchema.optional()

export const isoDateTimeSchema = z
  .string()
  .min(1, '时间不能为空')
  .refine((value) => !Number.isNaN(Date.parse(value)), '时间格式不正确')

export const nullableIsoDateTimeSchema = isoDateTimeSchema.nullable().optional()

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
})

export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  })
}

export const booleanQuerySchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'))

export const idParamSchema = z.object({ id: uuidSchema })

export const emptyToNull = (value: string): string | null => (value.trim() === '' ? null : value)
