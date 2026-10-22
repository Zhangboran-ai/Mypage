import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  REMEMBER_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from '../../shared/constants'
import { sessions, users } from '../../db/schema'
import { env } from '../env'
import { db } from './db'

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

type CreateSessionInput = {
  userId: string
  remember: boolean
  ip?: string | null
  userAgent?: string | null
}

export async function createSession(input: CreateSessionInput): Promise<{
  token: string
  ttl: number
  expiresAt: Date
}> {
  const token = generateSessionToken()
  const ttl = input.remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS
  const expiresAt = new Date(Date.now() + ttl * 1000)

  await db.insert(sessions).values({
    userId: input.userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    ip: input.ip ?? null,
    userAgent: input.userAgent?.slice(0, 500) ?? null,
  })

  return { token, ttl, expiresAt }
}

export function setSessionCookie(c: Context, token: string, ttl: number): void {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.useSecureCookies,
    sameSite: 'Lax',
    path: '/',
    maxAge: ttl,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: '/',
    secure: env.useSecureCookies,
    sameSite: 'Lax',
  })
}

export function getSessionToken(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE_NAME)
}

export type SessionUser = {
  id: string
  email: string
  name: string
  role: string
}

export async function findSessionUser(token: string): Promise<SessionUser | null> {
  const tokenHash = hashSessionToken(token)

  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return { id: row.id, email: row.email, name: row.name, role: row.role }
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)))
}

export async function deleteOtherSessions(userId: string, keepToken?: string): Promise<void> {
  if (keepToken) {
    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          // 保留当前会话，吊销其他设备
          ne(sessions.tokenHash, hashSessionToken(keepToken)),
        ),
      )
    return
  }

  await db.delete(sessions).where(eq(sessions.userId, userId))
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
}
