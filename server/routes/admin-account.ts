import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { ok } from '../lib/http'
import { listSessions, revokeOtherSessions, revokeSession } from '../services/auth-service'

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
