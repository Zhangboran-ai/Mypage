import { Hono } from 'hono'
import { settingsInputSchema } from '../../shared/index.js'
import type { AppEnv } from '../types.js'
import { ok } from '../lib/http.js'
import { parseJson } from '../lib/validate.js'
import { getSettings, updateSettings } from '../services/setting-service.js'

export const adminSettingRoutes = new Hono<AppEnv>()

adminSettingRoutes.get('/settings', async (c) => {
  return ok(c, await getSettings())
})

adminSettingRoutes.put('/settings', async (c) => {
  const input = await parseJson(c, settingsInputSchema)
  return ok(c, await updateSettings(input))
})
