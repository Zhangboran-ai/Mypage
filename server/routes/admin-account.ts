import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { ok } from '../lib/http.js'
import { listSessions, revokeOtherSessions, revokeSession } from '../services/auth-service.js'

export const adminAccountRoutes = new Hono<AppEnv>()

adminAccountRoutes.get('/account/sessions', async (c) => {
  const user = c.get('user')
  return ok(c, await listSessions(user.id, c.get('sessionToken')))
})

adminAccountRoutes.delete('/account/sessions/:id', async (c) => {
  const user = c.get('user')
  await revokeSession(user.id, c.req.param('id'))
  return ok(c, { ok: true })
})

adminAccountRoutes.delete('/account/sessions', async (c) => {
  const user = c.get('user')
  await revokeOtherSessions(user.id, c.get('sessionToken'))
  return ok(c, { ok: true })
})
