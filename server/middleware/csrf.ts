import type { MiddlewareHandler } from 'hono'
import { forbidden } from '../lib/errors'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * 写操作校验 Origin 与当前请求同源，配合 SameSite=Lax 抵御 CSRF。
 * 无 Origin 的请求（服务端调用、命令行）放行，因为浏览器提交写请求一定带 Origin。
 */
export const csrfGuard: MiddlewareHandler = async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) {
    await next()
    return
  }

  const origin = c.req.header('origin')
  if (!origin) {
    await next()
    return
  }

  const requestUrl = new URL(c.req.url)
  const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? requestUrl.host
  const proto = c.req.header('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '')

  const allowedOrigins = new Set([requestUrl.origin, `${proto}://${host}`])

  if (!allowedOrigins.has(origin)) {
    throw forbidden('请求来源不合法')
  }

  await next()
}
