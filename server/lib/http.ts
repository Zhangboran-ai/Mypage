import type { Context } from 'hono'

export function ok<T>(c: Context, data: T) {
  return c.json({ data })
}

export function okWithStatus<T>(c: Context, data: T, status: 200 | 201 | 202) {
  return c.json({ data }, status)
}

export function setPublicCache(c: Context, seconds = 60): void {
  c.header('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=300`)
}

export function setNoStore(c: Context): void {
  c.header('Cache-Control', 'no-store')
}

export function getClientIp(c: Context): string | null {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return c.req.header('x-real-ip') ?? null
}

export function getUserAgent(c: Context): string | null {
  return c.req.header('user-agent') ?? null
}
