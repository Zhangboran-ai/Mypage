import { and, eq, gte, sql } from 'drizzle-orm'
import { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MINUTES } from '../../shared/constants.js'
import { loginAttempts } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { rateLimited } from '../lib/errors.js'

function windowStart(): Date {
  return new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000)
}

async function countFailures(where: ReturnType<typeof eq> | undefined): Promise<number> {
  if (!where) return 0

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(where, eq(loginAttempts.success, false), gte(loginAttempts.createdAt, windowStart())))

  return rows[0]?.count ?? 0
}

export async function assertLoginAllowed(identifier: string, ip: string | null): Promise<void> {
  const byIdentifier = await countFailures(eq(loginAttempts.identifier, identifier))
  if (byIdentifier >= LOGIN_MAX_ATTEMPTS) {
    throw rateLimited(`登录失败次数过多，请 ${LOGIN_WINDOW_MINUTES} 分钟后再试`)
  }

  if (ip) {
    const byIp = await countFailures(eq(loginAttempts.ip, ip))
    if (byIp >= LOGIN_MAX_ATTEMPTS) {
      throw rateLimited(`登录失败次数过多，请 ${LOGIN_WINDOW_MINUTES} 分钟后再试`)
    }
  }
}

export async function recordLoginAttempt(input: {
  identifier: string
  ip: string | null
  success: boolean
}): Promise<void> {
  await db.insert(loginAttempts).values({
    identifier: input.identifier.slice(0, 320),
    ip: input.ip?.slice(0, 64) ?? null,
    success: input.success,
  })
}

export async function clearLoginFailures(identifier: string): Promise<void> {
  await db
    .delete(loginAttempts)
    .where(and(eq(loginAttempts.identifier, identifier), eq(loginAttempts.success, false)))
}
