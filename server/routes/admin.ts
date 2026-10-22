import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { requireAuth } from '../middleware/auth.js'
import { getDashboard } from '../services/dashboard-service.js'
import { adminPostRoutes } from './admin-posts.js'
import { adminProjectRoutes } from './admin-projects.js'
import { adminProfileRoutes } from './admin-profile.js'
import { adminSkillRoutes } from './admin-skills.js'
import { adminTagRoutes } from './admin-tags.js'
import { adminMediaRoutes } from './admin-media.js'
import { adminSettingRoutes } from './admin-settings.js'
import { adminMessageRoutes } from './admin-messages.js'
import { adminAccountRoutes } from './admin-account.js'
import { ok } from '../lib/http.js'

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
