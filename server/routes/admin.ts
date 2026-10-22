import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { requireAuth } from '../middleware/auth'
import { getDashboard } from '../services/dashboard-service'
import { adminPostRoutes } from './admin-posts'
import { adminProjectRoutes } from './admin-projects'
import { adminProfileRoutes } from './admin-profile'
import { adminSkillRoutes } from './admin-skills'
import { adminTagRoutes } from './admin-tags'
import { adminMediaRoutes } from './admin-media'
import { adminSettingRoutes } from './admin-settings'
import { adminMessageRoutes } from './admin-messages'
import { adminAccountRoutes } from './admin-account'
import { ok } from '../lib/http'

export const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', async (c, next) => {
  // 先写响应头：即使后续鉴权失败抛错，401 响应也不会被缓存
  c.header('Cache-Control', 'no-store')
  await next()
})

adminRoutes.use('*', requireAuth)

adminRoutes.get('/dashboard', async (c) => {
  return ok(c, await getDashboard())
})

adminRoutes.route('/', adminProfileRoutes)
adminRoutes.route('/', adminSkillRoutes)
adminRoutes.route('/', adminTagRoutes)
adminRoutes.route('/', adminPostRoutes)
adminRoutes.route('/', adminProjectRoutes)
adminRoutes.route('/', adminMediaRoutes)
adminRoutes.route('/', adminSettingRoutes)
adminRoutes.route('/', adminMessageRoutes)
adminRoutes.route('/', adminAccountRoutes)
