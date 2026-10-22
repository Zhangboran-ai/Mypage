import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { sql } from 'drizzle-orm'
import type { AppEnv } from './types'
import { db } from './lib/db'
import { csrfGuard } from './middleware/csrf'
import { onError } from './middleware/error-handler'
import { publicRoutes } from './routes/public'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'

export const app = new Hono<AppEnv>().basePath('/api')

app.use(logger())
app.use(secureHeaders())
app.use('*', csrfGuard)
app.onError(onError)

app.get('/health', async (c) => {
  c.header('Cache-Control', 'no-store')

  try {
    await db.execute(sql`select 1`)
    return c.json({ status: 'ok', db: 'ok' })
  } catch (error) {
    console.error('[health] 数据库不可用', error)
    return c.json({ status: 'degraded', db: 'error' }, 503)
  }
})

app.route('/public', publicRoutes)
app.route('/auth', authRoutes)
app.route('/admin', adminRoutes)

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: '接口不存在' } }, 404))
