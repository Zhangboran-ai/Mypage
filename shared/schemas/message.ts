import { z } from 'zod'
import { paginationQuerySchema } from './common'

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, '请填写昵称').max(80, '昵称最长 80 个字符'),
  email: z.string().trim().email('邮箱格式不正确').max(255).optional().or(z.literal('')),
  content: z.string().trim().min(5, '内容至少 5 个字').max(2000, '内容最长 2000 个字符'),
  website: z.string().max(0, '提交失败').optional(),
  source: z.string().max(200).optional(),
})

export const messageUpdateSchema = z.object({
  read: z.boolean(),
})

export const messageListQuerySchema = paginationQuerySchema

export type ContactMessageInput = z.infer<typeof contactMessageSchema>
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>
export type MessageListQuery = z.infer<typeof messageListQuerySchema>
