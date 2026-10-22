import type { MiddlewareHandler } from 'hono'
import { findSessionUser, getSessionToken } from '../lib/session'
import { unauthorized } from '../lib/errors'
import type { AppEnv } from '../types'

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getSessionToken(c)

  if (!token) {
    throw unauthorized()
  }

  const user = await findSessionUser(token)

  if (!user) {
    throw unauthorized()
  }

  c.set('user', user)
  c.set('sessionToken', token)
  await next()
}
