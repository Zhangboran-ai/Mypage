import { Hono } from 'hono'
import { settingsInputSchema } from '../../shared'
import type { AppEnv } from '../types'
import { ok } from '../lib/http'
import { parseJson } from '../lib/validate'
import { getSettings, updateSettings } from '../services/setting-service'

export const adminSettingRoutes = new Hono<AppEnv>()

adminSettingRoutes.get('/settings', async (c) => {
  return ok(c, await getSettings())
})

adminSettingRoutes.put('/settings', async (c) => {
  const input = await parseJson(c, settingsInputSchema)
  return ok(c, await updateSettings(input))
})
