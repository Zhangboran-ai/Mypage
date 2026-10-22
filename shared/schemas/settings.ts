import { z } from 'zod'

const nullableUrlSchema = z.string().url('请输入合法链接').nullable().optional()

export const settingsInputSchema = z.object({
  siteName: z.string().trim().min(1, '站点名称不能为空').max(100),
  siteDescription: z.string().trim().min(1, '站点描述不能为空').max(300),
  logoUrl: nullableUrlSchema,
  faviconUrl: nullableUrlSchema,
  defaultOgImage: nullableUrlSchema,
  footerText: z.string().max(300).nullable().optional(),
  icpRecord: z.string().max(120).nullable().optional(),
  socialShareText: z.string().max(200).nullable().optional(),
  navConfig: z.record(z.string(), z.boolean()).default({}),
})

export type SettingsInput = z.infer<typeof settingsInputSchema>
