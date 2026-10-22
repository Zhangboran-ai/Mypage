import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, '请输入邮箱').email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码').max(128, '密码过长'),
  remember: z.boolean().optional().default(false),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z
      .string()
      .min(8, '新密码至少 8 位')
      .max(72, '新密码最长 72 位')
      .regex(/[a-zA-Z]/, '新密码需包含字母')
      .regex(/[0-9]/, '新密码需包含数字'),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: '新密码不能与当前密码相同',
    path: ['newPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
