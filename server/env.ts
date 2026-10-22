import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL 未配置'),
  DATABASE_URL_UNPOOLED: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  PUBLIC_SITE_URL: z.string().url().optional(),
  DEPLOY_HOOK_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('[env] 环境变量校验失败', parsed.error.flatten().fieldErrors)
  throw new Error('环境变量校验失败，请检查 .env.local 或 Vercel 环境变量')
}

const raw = parsed.data

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  useSecureCookies:
    raw.VERCEL_ENV === 'production' ||
    raw.VERCEL_ENV === 'preview' ||
    raw.NODE_ENV === 'production',
}
