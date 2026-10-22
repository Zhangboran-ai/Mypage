import { Hono } from 'hono'
import { changePasswordSchema, loginSchema } from '../../shared'
import type { AppEnv } from '../types'
import { getClientIp, getUserAgent, ok, setNoStore } from '../lib/http'
import { unauthorized } from '../lib/errors'
import {
  clearSessionCookie,
  deleteSessionByToken,
  findSessionUser,
  getSessionToken,
  setSessionCookie,
} from '../lib/session'
import { parseJson } from '../lib/validate'
import { changePassword, login } from '../services/auth-service'
import { requireAuth } from '../middleware/auth'

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/login', async (c) => {
  setNoStore(c)
  const input = await parseJson(c, loginSchema)
  const result = await login(input, { ip: getClientIp(c), userAgent: getUserAgent(c) })
  setSessionCookie(c, result.token, result.ttl)
  return ok(c, { user: result.user })
})

authRoutes.post('/logout', async (c) => {
  setNoStore(c)
  const token = getSessionToken(c)
  if (token) await deleteSessionByToken(token)
  clearSessionCookie(c)
  return ok(c, { ok: true })
})

authRoutes.get('/me', async (c) => {
  setNoStore(c)
  const token = getSessionToken(c)
  if (!token) throw unauthorized()

  const user = await findSessionUser(token)
  if (!user) throw unauthorized()

  return ok(c, { user: { id: user.id, email: user.email, name: user.name, role: user.role } })
})

authRoutes.post('/change-password', requireAuth, async (c) => {
  setNoStore(c)
  const user = c.get('user')
  const input = await parseJson(c, changePasswordSchema)
  await changePassword(user.id, c.get('sessionToken'), input)
  return ok(c, { ok: true })
})
