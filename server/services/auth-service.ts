import { and, desc, eq, ne } from 'drizzle-orm'
import type { AuthUser, ChangePasswordInput, LoginInput, SessionInfo } from '../../shared/index.js'
import { sessions, users } from '../../db/schema.js'
import { db } from '../lib/db.js'
import { badRequest, unauthorized } from '../lib/errors.js'
import { mapSession } from '../lib/mappers.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import {
  createSession,
  deleteOtherSessions,
  hashSessionToken,
  type SessionUser,
} from '../lib/session.js'
import { assertLoginAllowed, clearLoginFailures, recordLoginAttempt } from '../middleware/rate-limit.js'

type LoginMeta = { ip: string | null; userAgent: string | null }

export function toAuthUser(user: SessionUser): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function login(
  input: LoginInput,
  meta: LoginMeta,
): Promise<{ token: string; ttl: number; user: AuthUser }> {
  const email = input.email.trim().toLowerCase()
  await assertLoginAllowed(email, meta.ip)

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const user = rows[0]

  const passwordValid = user ? await verifyPassword(input.password, user.passwordHash) : false

  await recordLoginAttempt({ identifier: email, ip: meta.ip, success: passwordValid })

  if (!user || !passwordValid) {
    throw unauthorized('邮箱或密码不正确')
  }

  await clearLoginFailures(email)

  const session = await createSession({
    userId: user.id,
    remember: input.remember,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))

  return {
    token: session.token,
    ttl: session.ttl,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

export async function changePassword(
  userId: string,
  currentToken: string,
  input: ChangePasswordInput,
): Promise<void> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const user = rows[0]

  if (!user) throw unauthorized()

  const valid = await verifyPassword(input.currentPassword, user.passwordHash)
  if (!valid) throw badRequest('当前密码不正确')

  const passwordHash = await hashPassword(input.newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))

  await deleteOtherSessions(userId, currentToken)
}

export async function listSessions(
  userId: string,
  currentToken: string,
): Promise<SessionInfo[]> {
  const currentTokenHash = hashSessionToken(currentToken)
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt))
    .limit(20)

  return rows.map((row) => mapSession(row, currentTokenHash))
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  await db.delete(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
}

export async function revokeOtherSessions(userId: string, currentToken: string): Promise<void> {
  await db
    .delete(sessions)
    .where(
      and(eq(sessions.userId, userId), ne(sessions.tokenHash, hashSessionToken(currentToken))),
    )
}
