import type { Context } from 'hono'
import type { z } from 'zod'
import { badRequest } from './errors.js'

export async function parseJson<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    throw badRequest('请求体必须是合法的 JSON')
  }

  return schema.parse(body)
}

export function parseQuery<T>(c: Context, schema: z.ZodType<T>): T {
  return schema.parse(c.req.query())
}
